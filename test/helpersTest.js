const { assert } = require('chai');

const { getUserByEmail, addUser } = require('../helpers');

// only testing users database
const testUsers = {
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

describe('getUserByEmail', function() {
  it('should return a user with a valid email', function() {
    const user = getUserByEmail('user@example.com', testUsers);
    assert.isObject(user, 'user is an object');
    assert.strictEqual(user.id, 'userRandomID', 'id should match');
    assert.strictEqual(user.email, 'user@example.com', 'email should match');
    assert.strictEqual(user.password, 'purple-monkey-dinosaur', 'password should match');
  });

  it('should return undefined if a user does not exist in the database', function() {
    const user = getUserByEmail('user3@no.com', testUsers);
    assert.isUndefined(user);
  });
});

describe('addUser', function() {
  it('should add an user if the user has id, email, and password', function() {
    const newUser = {
      id: "aSt39A",
      email: 'bon@bon.com',
      password: 'bonny-hoppy'
    };
    addUser(newUser, testUsers);
    assert.isObject(testUsers[newUser.id]);
    assert.strictEqual(testUsers[newUser.id].email, 'bon@bon.com');
    assert.strictEqual(testUsers[newUser.id].password, 'bonny-hoppy');
  });
  it ('should return undefined if any of id, email, or password is missing', function() {
    const newUser = {
      id: '',
      email: 'a',
      password: 'hello'
    };
    addUser(newUser, testUsers);
    assert.isUndefined(testUsers[newUser.id]);
  });
});