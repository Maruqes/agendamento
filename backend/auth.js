var db = require("./db.js");
const bcrypt = require("bcrypt");

var sessions = [];

function dont_repeat_session(token) {
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].token == token) {
      return false;
    }
  }
  return true;
}

function create_session_token() {
  var token = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 60; i++) token += possible.charAt(Math.floor(Math.random() * possible.length));
  if (dont_repeat_session(token) == false) {
    token = create_session_token();
  }
  return token;
}

function create_session(user, is_admin) {
  var token = create_session_token();
  sessions.push({ user: user, token: token, admin: is_admin });
  return token;
}

function search_for_token(token) {
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].token == token) {
      return sessions[i];
    }
  }
  return null;
}

function there_is_user(user, data) {
  try {
    if (data.length == 0) {
      return false;
    }
    if (user != data[0].user) {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
}

async function login_user(user, password, resexpress) {
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].user == user) {
      logout_user(sessions[i].token);
    }
  }

  db.search_for_user(user)
    .then(async (data) => {
      if (there_is_user(user, data) == false) {
        console.log("User not found");
        resexpress.status(401).send("Wrong password");
        return;
      }
      const res = await bcrypt.compare(password, data[0].password);
      if (res) {
        console.log("Logged in " + user + " if admin " + data[0].admin);
        session_token = create_session(user, data[0].admin);
        console.log(session_token);
        resexpress.status(200).send(JSON.stringify('{ "session_token": "' + session_token + '" }'));

        return;
      } else {
        console.log("Wrong password");
        resexpress.status(401).send("Wrong password");
      }
    })
    .catch((err) => {
      resexpress.status(401).send("Wrong password");
      console.log(err);
    });
}

async function create_user(user, password, admin, email, phone_number, full_name, resexpress) {
  //verificar se user ja existe
  const existingUser = await db.search_for_user(user);

  if (existingUser[0]) {
    console.log(`User ${user} already exists`);
    resexpress.status(401).send("User already exists");
    return;
  }

  if (user == "" || password == "") {
    console.log("User or password empty");
    resexpress.status(500).send("User or password empty");
    return;
  }

  const saltRounds = 10;

  const hash = await bcrypt.hash(password, saltRounds);
  db.add_user(user, hash, admin, email, phone_number, full_name)
    .then(() => {
      console.log("User created");
      resexpress.status(200).send("User created");
    })
    .catch((err) => {
      console.log(err);
    });
}

async function edit_user(user, password, admin, email, phone_number, full_name, resexpress) {
  const existingUser = await db.search_for_user(user);

  if (!existingUser[0]) {
    console.log(`User ${user} does not exist`);
    resexpress.status(401).send("User does not exist");
    return;
  }
  if (existingUser[0].user != user) {
    console.log(`User ${user} does not exist`);
    resexpress.status(401).send("User does not exist");
    return;
  }

  const saltRounds = 10;

  const hash = await bcrypt.hash(password, saltRounds);
  db.edit_user(user, hash, admin, email, phone_number, full_name)
    .then(() => {
      console.log("User edited");
      resexpress.status(200).send("User edited");
    })
    .catch((err) => {
      console.log(err);
    });
}

async function delete_user(user, who_is_deleting, resexpress) {
  const existingUser = await db.search_for_user(user);

  if (who_is_deleting == user) {
    console.log(`User ${user} cannot delete himself`);
    resexpress.status(401).send("User cannot delete himself");
    return;
  }
  if (!existingUser[0]) {
    console.log(`User ${user} does not exist`);
    resexpress.status(401).send("User does not exist");
    return;
  }
  if (existingUser[0].user != user) {
    console.log(`User ${user} does not exist`);
    resexpress.status(401).send("User does not exist");
    return;
  }
  db.delete_user(user)
    .then(() => {
      sessions = sessions.filter((session) => session.user !== user);
      console.log("User deleted");
      resexpress.status(200).send("User deleted");
    })
    .catch((err) => {
      console.log(err);
    });
}

function login_user_with_cookie(user_recieved, cookie) {
  console.log(user_recieved);
  var user = search_for_token(cookie);
  if (user == null) {
    console.log("User not found");
    return -1;
  }
  if (user_recieved != user.user) {
    console.log("User is wrong");
    return -1;
  }
  console.log("Logged in " + user.user + " if admin " + user.admin);
  return user.admin;
}

function update_users_json(res) {
  db.read_db_users()
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err);
    });
}

function get_specific_user(user, res) {
  db.search_for_user(user)
    .then((result) => {
      if (result[0].user == user) {
        res.send(result);
      } else {
        res.send("User not found");
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

function logout_user(cookie) {
  try {
    sessions = sessions.filter((session) => {
      if (session.token === cookie) {
        console.log("Logged out user: " + session.user);
      }
    });
  } catch (err) {
    console.log(err);
  }
}
sessions.push({ user: "admin", token: "admin", admin: 1 }); //PARA REMOVER
sessions.push({ user: "admin0", token: "admin0", admin: 0 }); //PARA REMOVER
console.log("REMOVER");
console.log(sessions);
console.log("REMOVER");
module.exports = {
  login_user,
  login_user_with_cookie,
  create_user,
  delete_user,
  update_users_json,
  logout_user,
  edit_user,
  there_is_user,
  search_for_token,
  get_specific_user,
};
