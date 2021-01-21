const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// purpose: return a string of 6 random alphanumeric characters!
// source: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript/27747377
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// add user to users
const addUser = function(userInfo) {
  const { id, email, password } = userInfo;
  users[id] = { id, email, password };
  console.log(users);
};

// checking if email already exists
const getUserByEmail = function(email) {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
};

// filter urls such that only creators of urls can see
const urlsForUser = function(userID) {
  const filteredURLs = {}; // a key value pair of short and long urls
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      filteredURLs[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return filteredURLs;
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// index page
app.get('/urls', (req, res) => {
  const userID = req.cookies["user_id"];
  const filteredURLs = urlsForUser(userID);
  const templateVars = {
    urls: filteredURLs,
    user: users[userID]
  };
  res.render('urls_index', templateVars);
});

// new needs to be defined before the specific url id
app.get('/urls/new', (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.redirect('/urls');
  }
  const templateVars = {
    user: users[userID]
  };
  res.render('urls_new', templateVars);
});

// route for creating a new url, which only happens if a user is logged in
app.post('/urls', (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect(`/urls/${newShortURL}`);
});

// route for seeing a particular url
app.get('/urls/:shortURL', (req, res) => {
  const userID = req.cookies["user_id"];
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
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// handle delete urls and can use cookies in curl to test
// source: https://stackoverflow.com/questions/15995919/how-to-use-curl-to-send-cookies/15996114#15996114
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.cookies["user_id"];
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
app.post('/urls/:id', (req, res) => {
  const userID = req.cookies["user_id"];
  const shortURL = req.params.id;
  if (!userID) {
    return res.status(401).send('Edit not authorized');
  }
  if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== userID) {
    return res.status(401).send('URL does not exist');
  } else {
    const updatedLongURL = req.body.longURL;
    urlDatabase[shortURL] = {
      longURL: updatedLongURL,
      userID: userID
    };
    res.redirect('/urls');
  }
});

// show user login
app.get('/login', (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID]
  };
  res.render('user_login', templateVars);
});

// handle user login with email
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  // check if user indeed exists
  if (!user) {
    return res.status(403).send('Email cannot be found');
  }
  if (user.password !== password) {
    return res.status(403).send('Password is incorrect');
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
});

// handle user logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// get register page
app.get('/register', (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID]
  };
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

  if (getUserByEmail(email)) {
    return res.status(400).send('Email has already been used');
  }

  const id = generateRandomString();
  const userInfo = { email, password, id };
  addUser(userInfo);

  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Examine app listening on port ${PORT}!`);
});

console.log('Starting...');