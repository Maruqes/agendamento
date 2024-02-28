var db = require("./db.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

var sessions = [];

function dont_repeat_session(token)
{
  for (var i = 0; i < sessions.length; i++)
  {
    if (sessions[i].token == token)
    {
      return false;
    }
  }
  return true;
}

function create_session_token()
{
  var token = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 60; i++) token += possible.charAt(Math.floor(Math.random() * possible.length));
  if (dont_repeat_session(token) == false)
  {
    token = create_session_token();
  }
  return token;
}

function create_session(user, is_admin)
{
  var token = create_session_token();
  sessions.push({ user: user, token: token, admin: is_admin });
  return token;
}

function search_for_token(token)
{
  for (var i = 0; i < sessions.length; i++)
  {
    if (sessions[i].token == token)
    {
      return sessions[i];
    }
  }
  return null;
}

function there_is_user(user, data)
{
  try
  {
    if (data.length == 0)
    {
      return false;
    }
    if (user != data[0].user)
    {
      return false;
    }
  } catch (err)
  {
    console.log(err);
    return false;
  }
  return true;
}

async function login_user(user, password, resexpress)
{
  if (user == "" || password == "" || user == undefined || password == undefined)
  {
    console.log("User or password empty");
    resexpress.status(701).send("User or password empty");
    return;
  }

  for (var i = 0; i < sessions.length; i++)
  {
    if (sessions[i].user == user)
    {
      logout_user(sessions[i].token);
      break;
    }
  }

  db.search_for_user(user)
    .then(async (data) =>
    {
      if (there_is_user(user, data) == false)
      {
        console.log("User not found");
        resexpress.status(401).send("Wrong password");
        return;
      }
      const res = await bcrypt.compare(password, data[0].password);
      if (res)
      {
        console.log("Logged in " + user + " if admin " + data[0].admin);
        session_token = create_session(user, data[0].admin);
        console.log(session_token);
        resexpress.status(200).send(JSON.stringify('{ "session_token": "' + session_token + '" }'));
        return;
      } else
      {
        console.log("Wrong password");
        resexpress.status(401).send("Wrong password");
      }
    })
    .catch((err) =>
    {
      resexpress.status(401).send("Wrong password");
      console.log(err);
    });
}

async function create_user(user, password, admin, email, phone_number, full_name, image, resexpress)
{
  if (user == "" || password == "" || user == undefined || password == undefined || admin == "" || admin == undefined || email == "" || email == undefined || phone_number == "" || phone_number == undefined || full_name == "" || full_name == undefined || image == "" || image == undefined)
  {
    console.log("Bad input");
    resexpress.status(400).send("Bad input");
    return;
  }

  //verificar se user ja existe
  const existingUser = await db.search_for_user(user);

  if (existingUser[0])
  {
    console.log(`User ${user} already exists`);
    resexpress.status(701).send("User already exists");
    return;
  }

  const saltRounds = 10;

  const hash = await bcrypt.hash(password, saltRounds);
  db.add_user(user, hash, admin, email, phone_number, full_name, image)
    .then(() =>
    {
      console.log("User created");
      resexpress.status(200).send("User created");
    })
    .catch((err) =>
    {
      console.log(err);
      resexpress.status(500).send("Internal Error");
    });
}

async function edit_user(user, email, phone_number, full_name, image, resexpress)
{

  if (user == "" || user == undefined || email == "" || email == undefined || phone_number == "" || phone_number == undefined || full_name == "" || full_name == undefined || image == "" || image == undefined)
  {
    console.log("Bad input");
    resexpress.status(400).send("Bad input");
    return;
  }

  const existingUser = await db.search_for_user(user);

  if (!existingUser[0])
  {
    console.log(`User ${user} does not exist`);
    resexpress.status(701).send("User does not exist");
    return;
  }
  if (existingUser[0].user != user)
  {
    console.log(`User ${user} does not exist`);
    resexpress.status(701).send("User does not exist");
    return;
  }

  db.edit_user(user, email, phone_number, full_name, image)
    .then(() =>
    {
      console.log("User edited");
      resexpress.status(200).send("User edited");
    })
    .catch((err) =>
    {
      console.log(err);
      resexpress.status(500).send("Internal Error");
    });
}

async function delete_user(user, who_is_deleting, resexpress)
{
  const existingUser = await db.search_for_user(user);

  if (who_is_deleting == user)
  {
    console.log(`User ${user} cannot delete himself`);
    resexpress.status(701).send("User cannot delete himself");
    return;
  }
  if (!existingUser[0])
  {
    console.log(`User ${user} does not exist`);
    resexpress.status(400).send("User does not exist");
    return;
  }
  if (existingUser[0].user != user)
  {
    console.log(`User ${user} does not exist`);
    resexpress.status(400).send("User does not exist");
    return;
  }
  db.delete_user(user)
    .then(() =>
    {
      sessions = sessions.filter((session) => session.user !== user);
      console.log("User deleted");
      resexpress.status(200).send("User deleted");
    })
    .catch((err) =>
    {
      console.log(err);
      resexpress.status(500).send("Internal Error");
    });
}

function login_user_with_cookie(user_recieved, cookie)
{
  if (user_recieved == undefined || cookie == undefined)
  {
    console.log("User or cookie undefined");
    return -1;
  }
  console.log(user_recieved);

  var user = search_for_token(cookie);

  if (user == null)
  {
    console.log("User not found");
    return -1;
  }

  if (user_recieved != user.user)
  {
    console.log("User is wrong");
    return -1;
  }

  console.log("Logged in " + user.user + " if admin " + user.admin);
  return user.admin;
}

function update_users_json(res)
{
  db.read_db_users()
    .then((result) =>
    {
      for (var i = 0; i < result.length; i++) //remover isto daqui e passar para o frontEnd
      {
        result[i].image = "images/" + result[i].image;
      }
      res.send(result);
    })
    .catch((err) =>
    {
      console.error(err);
    });
}

function get_specific_user(user, res)
{
  if (user == undefined || user == "")
  {
    res.send("User not found");
    res.status(400).send("User not found");
    return;
  }
  db.search_for_user(user)
    .then((result) =>
    {
      if (result[0].user == user)
      {
        delete result[0].password;
        result[0].image = "images/" + result[0].image;
        res.send(result);
      } else
      {
        res.send("User not found");
      }
    })
    .catch((err) =>
    {
      console.error(err);
    });
}

function logout_user(cookie)
{
  if (cookie == undefined)
  {
    return;
  }
  try
  {
    sessions = sessions.filter((session) =>
    {
      if (session.token !== cookie)
      {
        console.log("Logged out user: " + session.user);
        return session;
      }
    });
  } catch (err)
  {
    console.log(err);
  }
}


//reset passwords
var reset_pass_tokens = [];

function remove_reset_pass_token(token)
{

}

function check_for_reset_password_token(uuid)
{
  let count = 0;

  let interval = setInterval(function ()
  {

    count += 1;

    if (count === 60) 
    {
      reset_pass_tokens = reset_pass_tokens.filter((token) =>   ////VER ESTA MERDA CARALHO
      {
        if (token.token !== uuid)
        {
          return token;
        }
      });
      console.log("Stoped checking for reset password tokens");
      clearInterval(interval);
    }
    console.log("Checking for reset password tokens");

  }, 10000);
}

async function reset_password_by_email(email)
{
  if (email == undefined || email == "")
  {
    return 400;
  }

  const user_DB = await db.get_users_by_email(email);
  console.log(user_DB);
  if (user_DB.length === 0)
  {
    return 400;
  }

  //gerar a new link to reset password

  let uuid = crypto.randomUUID();

  reset_pass_tokens.push({ email: email, token: uuid });
  check_for_reset_password_token(uuid);

  console.log("http://localhost:8080/reset_password_uuid/" + uuid); //enviar email
  return 200;
}

function delete_other_sessions(user)
{
  if (user == undefined || user === "")
  {
    return;
  }
  console.log(user)
  console.log(sessions)
  sessions = sessions.filter((session) =>
  {
    if (session.user !== user)
    {
      return session;
    }
  });
  console.log("deleted other sessions")
  console.log(sessions)
}

async function reset_password(uuid, password)
{
  if (uuid == undefined || password == undefined || uuid == "" || password == "")
  {
    return 400;
  }

  let user = reset_pass_tokens.filter((token) =>
  {
    if (token.token === uuid)
    {
      return token;
    }
  });

  if (user.length === 0)
  {
    return 701;
  }

  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return await db.edit_password(user[0].email, hash)
    .then(async () =>
    {
      console.log("Password reseted");
      await db.get_users_by_email(user[0].email).then((result) => { delete_other_sessions(result[0].user); });
      return 200;
    })
    .catch((err) =>
    {
      console.log(err);
      return 500;
    });
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
  reset_password_by_email,
  reset_password,
};
