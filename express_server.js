const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

// import helper functions
const { generateRandomString, addUser, getUserByEmail, urlsForUser, checkDuplicateURLs } = require('./helpers');

// set and use middleware
app.use(morgan('dev'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// storing short and long url pairs
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// storing user id and obj pairs
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

// index page
app.get('/', (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// all urls
app.get('/urls', (req, res) => {
  const userID = req.session["user_id"];
  const filteredURLs = urlsForUser(userID, urlDatabase);
  const templateVars = {
    urls: filteredURLs,
    user: users[userID]
  };
  res.render('urls_index', templateVars);
});

// new needs to be defined before the specific url id
app.get('/urls/new', (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.redirect('/login');
  }
  const templateVars = {
    user: users[userID]
  };
  res.render('urls_new', templateVars);
});

// route for creating a new url, which only happens if a user is logged in
app.post('/urls', (req, res) => {
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  const userID = req.session["user_id"];
  const existingURLs = urlsForUser(userID, urlDatabase);
  if (checkDuplicateURLs(existingURLs, newLongURL)) {
    return res.send('URL already exists');
  }
  urlDatabase[newShortURL] = {
    longURL: newLongURL,
    userID
  };
  res.redirect(`/urls/${newShortURL}`);
});

// route for seeing a particular url
app.get('/urls/:shortURL', (req, res) => {
  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL;
  if (!userID) {
    return res.status(401).send('Please log in first');
  }
  if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== userID) {
    return res.status(401).send('URL does not exist');
  }
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[userID]
  };
  res.render('urls_show', templateVars);
});

// route for redirecting to the long url (all authorized)
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(403).send('URL does not exist');
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// handle delete urls and can use cookies in curl to test
// source: https://stackoverflow.com/questions/15995919/how-to-use-curl-to-send-cookies/15996114#15996114
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL;
  if (!userID) {
    return res.status(401).send('Delete not authorized');
  }
  if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== userID) {
    return res.status(401).send('URL does not exist');
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

// handle update urls
app.post('/urls/:shortURL', (req, res) => {
  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL;
  if (!userID) {
    return res.status(401).send('Edit not authorized');
  }
  if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== userID) {
    return res.status(401).send('URL does not exist');
  } else {
    const existingURLs = urlsForUser(userID, urlDatabase);
    const updatedLongURL = req.body.longURL;
    if (checkDuplicateURLs(existingURLs, updatedLongURL)) {
      return res.send('URL already exists');
    }
    urlDatabase[shortURL] = {
      longURL: updatedLongURL,
      userID: userID
    };
    res.redirect('/urls');
  }
});

// show user login
app.get('/login', (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: users[userID]
  };
  res.render('user_login', templateVars);
});

// handle user login with email
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  // check if user indeed exists
  if (!user) {
    return res.status(403).send('Email cannot be found');
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Password is incorrect');
  } else {
    req.session['user_id'] = user.id;
    res.redirect('/urls');
  }
});

// handle user logout
app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');
});

// get register page
app.get('/register', (req, res) => {
  // must log out first before registering
  if (req.session["user_id"]) {
    return res.redirect('/urls');
  }
  const templateVars = { user: '' }; // user doesn't exist
  res.render('user_registration', templateVars);
});

// handle user registration
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // error handling
  if (!email || !password) {
    return res.status(400).send('Either email or password missing!');
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send('Email has already been used');
  }

  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10); // hash with 10 rounds
  const userInfo = {
    id,
    email, 
    password: hashedPassword, 
  };
  addUser(userInfo, users);

  req.session['user_id'] = id;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Examine app listening on port ${PORT}!`);
});

console.log('Starting...');