const express = require('express');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  res.send(urlDatabase);
})

app.listen(PORT, () => {
  console.log(`Examine app listening on port ${PORT}!`);
});

console.log('first to log!')