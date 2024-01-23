var express = require("express");
const fileUpload = require("express-fileupload");
var path = require("path");
const bodyParser = require("body-parser");
var shop = require("../backend/server.js");
var auth = require("../backend/auth.js");
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
//app
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.set("trust proxy", true);
app.use(require("express-status-monitor")());
app.use(rateLimitMiddleware);
app.use(fileUpload());

app.get("/", function (req, res) {
  // TESTES
  res.sendFile(path.join(__dirname + "/login_page.html"));
});
app.use(express.static("images"));
app.post("/upload", (req, res) => {
  var autorizado = auth.login_user_with_cookie(req.body.cookie);
  if (!autorizado)
    return res.status(401).send("You are not authorized to upload files");

  fs.writeFile(
    "images/" + req.files.image.name,
    req.files.image.data,
    (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
  res.sendStatus(200);
});

app.post("/new", async function (req, res) {
  var result = await shop.new_order_test(req.body, req.ip);
  res.sendStatus(result);
});

app.get("/get_marcacoes", function (req, res) {
  var autorizado = auth.login_user_with_cookie(req.query.cookie);
  if (autorizado) {
    shop.update_agendamentos_json(res); //res.send is inside the function couse it need to be async for some reason it do not work ouside
  } else {
    res.sendStatus(401);
  }
});

app.post("/create_product", function (req, res) {
  var autorizado = auth.login_user_with_cookie(req.body.cookie);
  if (autorizado) {
    shop.create_new_product(req.body, req.ip);
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.get("/get_products", function (req, res) {
  shop.update_products_json(res); //res.send is inside the function couse it need to be async for some reason it do not work ouside
});

app.post("/delete_Product", function (req, res) {
  var autorizado = auth.login_user_with_cookie(req.body.cookie);
  if (autorizado) {
    shop.delete_product(req.body.name);
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.post("/login", function (req, res) {
  console.log("Trying to login " + req.body.user);
  auth.login_user(req.body.user, req.body.password, res);
});

app.post("/create_user", function (req, res) {
  var autorizado = auth.login_user_with_cookie(req.body.cookie);
  if (autorizado) {
    auth.create_user(req.body.user, req.body.password);
  } else {
    res.sendStatus(401);
  }
});

app.post("/delete_user", function (req, res) {
  var autorizado = auth.login_user_with_cookie(req.body.cookie);
  if (autorizado) {
    auth.delete_user(req.body.user);
  } else {
    res.sendStatus(401);
  }
});

app.post("/login_cookie", function (req, res) {
  var autorizado = auth.login_user_with_cookie(req.body.cookie);
  if (autorizado) {
    res.sendFile(path.join(__dirname + "/backoffice/backoffice.html"));
  } else {
    res.sendStatus(401);
  }
});

//js files
app.get("/backoffice.js", function (req, res) {
  res.sendFile(path.join(__dirname + "/backoffice/backoffice.js"));
});

app.listen(8080);
console.log("Express server started");
