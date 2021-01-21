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
const addUser = function(userInfo, database) {
  const { id, email, password } = userInfo;
  if (!id || !email || !password) {
    return;
  }
  database[id] = { id, email, password };
  // console.log(database); // show all users
};

// checking if email already exists
const getUserByEmail = function(email, database) {
  for (let id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
};

// filter urls such that only creators of urls can see
const urlsForUser = function(userID, urlDatabase) {
  const filteredURLs = {}; // a key value pair of short and long urls
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      filteredURLs[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return filteredURLs;
};

// check duplicate long urls
const checkDuplicateURLs = function(urls, check) {
  for (let url in urls) {
    if (urls[url] === check) {
      return true;
    }
  }
  return false;
};

module.exports = {
  generateRandomString,
  addUser,
  getUserByEmail,
  urlsForUser,
  checkDuplicateURLs
};