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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  for (let i = 0; i < 6; i++ ) {
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
  for(let userID in users) {
    if (users[userID].email === email) {
      return users[userID]
    }
  }
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
  const templateVars = {
    urls: urlDatabase,
    user: users[userID]
  };
  res.render('urls_index', templateVars);
});

// new needs to be defined before the specific url id
app.get('/urls/new', (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID]
  };
  res.render('urls_new', templateVars);
});

// route for creating a new url
app.post('/urls', (req, res) => {
  // save the url
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// route for seeing a particular url
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const userID = req.cookies["user_id"];
  const templateVars = {
    shortURL, 
    longURL,
    user: users[userID]
  };
  res.render('urls_show', templateVars);
});

// route for handling redirect
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// handle delete urls
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (shortURL in urlDatabase) {
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
});

// handle update urls
app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const updatedLongURL = req.body.longURL;
  urlDatabase[shortURL] = updatedLongURL;
});

// show user login
app.get('/login', (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID]
  }
  res.render('user_login', templateVars);
});

// handle user login with email
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  // check if user indeed exists
  if (!user) {
    res.status(403).send('Email cannot be found');
  } else {
    if (user.password !== password) {
      res.status(403).send('Password is incorrect');
    } else {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    }
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

  if (getUserByEmail(email)){
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