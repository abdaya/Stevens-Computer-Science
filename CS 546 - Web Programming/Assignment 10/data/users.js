const bcrypt = require('bcrypt');
const saltRounds = 10;
const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users

function isCharacterALetter(char) {
    return (/[a-zA-Z]/).test(char)
}

function usernameValidation(username) {
    if (!username) throw 'must provide username';
    if (typeof username !== 'string') throw 'username must be a string';
    if (username.trim().length < 4) {
        throw 'username should be at least 4 characters long';
    }
    username = username.trim();
    let USERNAME = "";
    for (var i = 0; i < username.length; i++) {
        let c = username.charAt(i)
        if(isCharacterALetter(c)) {
            USERNAME += c.toUpperCase();
        } else {
            throw'no spaces in the username and only alphanumeric characters'
        }
    };
    return USERNAME
}

async function checkUsernameIfExists(username) {
    const userCollection = await users();
    let user = await userCollection.findOne({username: username})
    if(user === null) {
        return username
    } else {
        throw 'there is already a user with that username'
    }   
}


function passwordValidation(password) {
    if(!password) throw 'must provide password'
    if (typeof password !== 'string') throw 'password must be a string';
    if (password.trim().length < 6) {
        throw 'password should be at least 6 characters long';
    }
    for (var i = 0; i < password.length; i++) {
        if(password.charAt(i) === ' ') {
            throw 'password cannot contain space'
        }
    };
    return password
}

async function createUser(username, password) {
    try {
        username = usernameValidation(username);
        username = await checkUsernameIfExists(username);
        password = passwordValidation(password);
    }catch(e) {
        throw e
    }
    const userCollection = await users();
    let newUser = {
        username : username,
        password : await bcrypt.hash(password, saltRounds)
    }
    const insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add user';
    }
    return {userInserted : true}
}


async function checkUser(username, password) {
    try {
        username = usernameValidation(username)
        password = passwordValidation(password)
    } catch (e) {
        throw e
    }
    const userCollection = await users();
    let userInfo = await userCollection.findOne({username: username})
    if(userInfo === null) {
        throw 'Either the username or password is invalid'
    }
    let hashedPassword = userInfo.password
    let passwordMatch = await bcrypt.compare(password, hashedPassword)
    if (!passwordMatch) {
        throw 'Either the username or password is invalid'
    } else {
        return {authenticated: true}
    }
    
}

module.exports = {
    createUser,
    checkUser
}
