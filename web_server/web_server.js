var express = require("express");
const fileUpload = require("express-fileupload");
var path = require("path");
const bodyParser = require("body-parser");
var shop = require("../backend/server.js");
var auth = require("../backend/auth.js");
var db = require("../backend/db.js");
var socket = require("../web_server/sockets.js");
var marcacoes = require("../backend/marcacoes.js");
const defines = require("../web_server/defines.js");
const cors = require("cors");
const console = require("./logs").console;
const setRateLimit = require("express-rate-limit");
const fs = require("fs");

const rateLimitMiddleware = setRateLimit({
  windowMs: 15 * 1000, //15 secs
  max: 15,
  message: "Too many requests",
  headers: true,
});
//

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.set("trust proxy", true);
//app.use(rateLimitMiddleware);
app.use(fileUpload());

app.get("/", function (req, res)
{
  // TESTES
  res.sendFile(path.join(__dirname + "/login_page.html"));
});
app.use(express.static("images"));
app.post("/upload", (req, res) =>
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == -1)
    return res.status(401).send("You are not authorized to upload files");

  fs.writeFile(
    "images/" + req.files.image.name,
    req.files.image.data,
    (err) =>
    {
      if (err) throw err;
    }
  );
  res.sendStatus(200);
});



////marcacoes
app.post("/new", async function (req, res)
{
  var result = await marcacoes.new_order_test(req.body, req.ip);
  if (result == 703)
  {
    res.status(703).send("Product does not exist");

  } else if (result == 704)
  {
    res.status(704).send("The schedule does not fit");
  } else if (result == 705)
  {
    res.status(705).send("User does not exist");
  } else if (result == 701)
  {
    res.status(701).send("Bad Input");
  } else if (result == 702)
  {
    res.status(702).send("Invalid phone number");
  } else
  {
    res.sendStatus(result);
  }
});

app.post("/delete_marcacao", async function (req, res)
{
  const result = await marcacoes.delete_marcacao(req.body.uuid);
  if (result == 701)
  {
    res.status(result).send("UUID is undefined");
  } else if (result == 702)
  {
    res.status(result).send("Could not find marcacao");
  } else 
  {
    res.sendStatus(result);
  }
});

app.post("/edit_marcacao", async function (req, res)
{
  const result = await marcacoes.edit_marcacao(req.body);
  if (result == 701)
  {
    res.status(result).send("Bad Input");
  } else if (result == 702)
  {
    res.status(result).send("Marcacao does not exist (uuid)");
  } else if (result == 704)
  {
    res.status(result).send("The schedule does not fit");
  } else
  {
    res.sendStatus(result);
  }
});

app.get("/get_marcacoes", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.query.username,
    req.query.cookie
  );
  if (autorizado >= 0)
  {
    shop.update_agendamentos_json(res, req.query.username, req.query.user);
    //res.send is inside the function couse it need to be async for some reason it do not work ouside
  } else
  {
    res.sendStatus(401);
  }
});
////////////////////////




////products
app.post("/create_product", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await shop.create_new_product(req.body, req.ip);
    if (result == 701)
    {
      res.status(result).send("invalid product");
    } else if (result == 702)
    {
      res.status(result).send("SQL injection detected");

    } else if (result == 703)
    {
      res.status(result).send("Product already exists");
    }
    else if (result == 704)
    {
      res.status(result).send("Price is not a number or negative");

    } else
    {
      res.sendStatus(result);
    }
  } else
  {
    res.sendStatus(401);
  }
});

app.get("/get_products", function (req, res)
{
  shop.update_products_json(res); //res.send is inside the function couse it need to be async for some reason it do not work ouside
});

app.post("/delete_Product", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await shop.delete_product(req.body.name);
    console.log(result);
    if (result == 703)
    {
      res.status(result).send("Product does not exist");
    }
    else if (result == 701)
    {
      console.log("JIUJJUH")
      res.status(result).send("invalid product");
    } else
    {
      res.sendStatus(result);
    }
  } else
  {
    res.sendStatus(401);
  }
});

app.post("/edit_product", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await shop.edit_product(req.body, req.ip);
    if (result == 701)
    {
      res.status(result).send("invalid product");
    } else if (result == 702)
    {
      res.status(result).send("SQL injection detected");

    } else if (result == 703)
    {
      res.status(result).send("Product does not exists");
    }
    else if (result == 704)
    {
      res.status(result).send("Price is not a number or negative");

    } else
    {
      res.sendStatus(result);
    }
  } else
  {
    res.sendStatus(401);
  }
});
////////////////////////

////users
app.post("/create_user", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (req.body.user_permission != 0 && req.body.user_permission != 1)
    return res.send("USER perms are wrong needs to be 0 or 1");

  if (autorizado == 1)
  {
    auth.create_user(
      req.body.user,
      req.body.password,
      req.body.user_permission,
      req.body.email,
      req.body.phone_number,
      req.body.full_name,
      req.body.image,
      res
    );
  } else
  {
    res.sendStatus(401);
  }
});

app.post("/delete_user", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    auth.delete_user(req.body.user, req.body.username, res);
  } else
  {
    res.sendStatus(401);
  }
});

app.post("/edit_user", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );

  if (autorizado == 1)
  {
    auth.edit_user(
      req.body.user,
      req.body.email,
      req.body.phone_number,
      req.body.full_name,
      req.body.image,
      res
    );
  } else if (autorizado == 0)
  {
    if (req.body.user != req.body.username)
    {
      res.sendStatus(401);
      return;
    }
    auth.edit_user(
      req.body.user,
      req.body.email,
      req.body.phone_number,
      req.body.full_name,
      req.body.image,
      res
    );
  } else
  {
    res.sendStatus(401);
  }
});

app.get("/get_users", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.query.username,
    req.query.cookie
  );
  if (autorizado == 1)
  {
    auth.update_users_json(res);
  } else if (autorizado == 0)
  {
    auth.get_specific_user(req.query.username, res);
  } else
  {
    res.sendStatus(401);
  }
});
////////////////////////


////login
app.post("/login", function (req, res)
{
  console.log("Trying to login " + req.body.user);
  auth.login_user(req.body.user, req.body.password, res);
});

app.post("/login_cookie", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado >= 0)
  {
    res.sendFile(path.join(__dirname + "/backoffice/backoffice.html"));
  } else
  {
    res.sendStatus(401);
  }
});

app.post("/logout", function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado >= 0)
  {
    auth.logout_user(req.body.cookie);
    console.log("Logout: " + req.body.username);
    res.sendStatus(200);
  } else
  {
    res.sendStatus(401);
  }
});
////////////////////////



//////images
app.get("/images/:name", function (req, res)
{
  if (
    req.params.name.includes("..") ||
    req.params.name.includes("cd") ||
    req.params.name.includes("cd")
  )
    return res.sendStatus(403);
  if (
    req.params.name.includes(".png") ||
    req.params.name.includes(".jpeg") ||
    req.params.name.includes(".jpg")
  )
  {
    res.sendFile(path.join(__dirname + "/images/" + req.params.name));
  } else
  {
    res.sendStatus(403);
  }
});
////////////////////////

//////horarios/bloqueios
app.post("/set_horario", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await shop.set_horario(
      req.body.dia,
      req.body.comeco,
      req.body.fim
    );
    res.sendStatus(result);
  } else
  {
    res.sendStatus(401);
  }
});

app.get("/get_horario", function (req, res)
{
  shop.get_horario(res);
});

app.post("/set_bloqueio", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await shop.set_bloqueio(
      req.body.dia,
      req.body.mes,
      req.body.ano,
      req.body.comeco,
      req.body.fim,
      req.body.user
    );
    res.sendStatus(result);
  } else
  {
    res.sendStatus(401);
  }
});

app.get("/get_bloqueio", function (req, res)
{
  shop.get_bloqueio(res);
});

app.post("/delete_bloqueio", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await shop.delete_bloqueio(req.body.uuid);
    res.sendStatus(result);
  } else
  {
    res.sendStatus(401);
  }
});
////////////////////////

///reset password
app.post("/start_reset_password", async function (req, res)
{
  let result = await auth.reset_password_by_email(req.body.email);
  res.sendStatus(result);
});

app.get("/reset_password_uuid/:uuid", function (req, res)
{
  res.sendFile(path.join(__dirname + "/reset_pass/index.html"));
});

app.post("/reset_password", async function (req, res)
{
  let result = await auth.reset_password(req.body.uuid, req.body.password);
  res.sendStatus(result);
});





//////
app.post("/change_user_permission", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.body.username,
    req.body.cookie
  );
  if (autorizado == 1)
  {
    var result = await auth.change_user_permission(
      req.body.user,
      req.body.permission
    );
    if (result == 701)
    {
      res.status(result).send("User does not exist");

    } else
    {
      res.sendStatus(result);

    }
  } else
  {
    res.sendStatus(401);
  }
});


//js files
app.get("/backoffice.js", function (req, res)
{
  res.sendFile(path.join(__dirname + "/backoffice/backoffice.js"));
});


///get_all_db_data
app.get("/get_all_db_data", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.query.username,
    req.query.cookie
  );
  if (autorizado == 1)
  {
    var result = await db.get_all_db_data();
    res.send(result);
  } else
  {
    res.sendStatus(401);
  }
});

app.get("/chat", function (req, res)
{

  var autorizado_ADMINS = defines.CHECK_OUR_USERS(req.query.username, req.query.cookie);
  if (autorizado_ADMINS == 1)
  {
    res.sendFile(path.join(__dirname + "/chat.html"));
  } else
  {
    res.sendStatus(401);
  }
});

app.get("/get_chat_msg", async function (req, res)
{
  var autorizado = auth.login_user_with_cookie(
    req.query.username,
    req.query.cookie
  );

  var autorizado_ADMINS = defines.CHECK_OUR_USERS(req.query.username, req.query.cookie);

  if (autorizado >= 0 || autorizado_ADMINS == 1)
  {
    var result = await db.get_chat_msg(req.query.number_of_messages);
    res.send(result);
  } else
  {
    res.sendStatus(401);
  }
});

////debug ---> TO REMOVE
console.log("ADDING DEBUG ROUTES TO REMOVE");
app.get("/debug_db", async function (req, res)
{
  await db.get_all_db_data()
    .then((result) =>
    {
      res.send(result);
    })
    .catch((err) =>
    {
      console.error(err);
      res.sendStatus(500);
    });
});

app.get("/debug_db_html", function (req, res)
{
  res.sendFile(path.join(__dirname + "/backoffice/see_db.html"));
});

console.log("REMOVE DEBUG ROUTES");

httpServer = app.listen(8080);
console.log("Express server started");

socket.create_ws_connection(httpServer);

