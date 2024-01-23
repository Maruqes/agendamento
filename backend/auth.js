var db = require("./db.js");
const bcrypt = require("bcrypt");

var sessions = [];

function create_session_token() {
    var token = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 60; i++) token += possible.charAt(Math.floor(Math.random() * possible.length));
    return token;
}

function create_session(user) {
    var token = create_session_token();
    sessions.push({ user: user, token: token });
    return token;
}

function search_for_token(token) {
    for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].token == token) {
            return sessions[i].user;
        }
    }
    return null;
}

function there_is_user(user, data) {
    if (data.length == 0) {
        return false;
    }
    if (user != data[0].user) {
        return false;
    }
    return true;
}

async function login_user(user, password, resexpress) {
    db.search_for_user(user)
        .then(async (data) => {
            if (there_is_user(user, data) == false) {
                console.log("User not found");
                return;
            }
            const res = await bcrypt.compare(password, data[0].password);
            if (res) {
                console.log("Logged in " + user);
                session_token = create_session(user);
                console.log(session_token);
                resexpress.status(200).send(JSON.stringify('{ "session_token": "' + session_token + '" }'));

                return;
            } else {
                console.log("Wrong password");
                resexpress.status(401).send("Wrong password");
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

async function create_user(user, password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    db.add_user(user, hash)
        .then(() => {
            console.log("User created");
        })
        .catch((err) => {
            console.log(err);
        });
}

async function delete_user(user) {
    const existingUser = await db.search_for_user(user);

    if (!existingUser[0]) {
        console.log(`User ${user} does not exist`);
        return;
    }
    db.delete_user(user)
        .then(() => {
            sessions = sessions.filter((session) => session.user !== user);
            console.log("User deleted");
        })
        .catch((err) => {
            console.log(err);
        });
}

function login_user_with_cookie(cookie) {
    var user = search_for_token(cookie);
    if (user == null) {
        console.log("User not found");
        return false;
    }
    console.log("Logged in " + user);
    return true;
}

module.exports = { login_user, login_user_with_cookie, create_user, delete_user };
