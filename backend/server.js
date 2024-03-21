const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");
var auth = require("./auth.js");
const estabelecimentos = require("./estabelecimentos.js");
const crypto = require("crypto");

function containsSQLCode(str)
{
  try
  {
    const sqlKeywords = ["SELECT", "UPDATE", "DELETE", "INSERT", "CREATE", "DROP", "ALTER", "TRUNCATE", "REPLACE"];

    return sqlKeywords.some((keyword) => str.toUpperCase().includes(keyword));
  } catch (err)
  {
    return false;
  }
}

function isValidPhoneNumber(user_number)
{
  try
  {
    if (user_number[0] === "+" && user_number[1] === "3" && user_number[2] === "5" && user_number[3] === "1" && user_number.length === 13)
    {
      return true;
    } else
    {
      return false;
    }
  } catch (err)
  {
    console.error(`Error in isValidPhoneNumber: ${err}`);
    return false;
  }
}

async function update_agendamentos_json(res, username, user)
{
  if (username == "" || user == "" || username == undefined || user == undefined)
  {
    console.error("username or user is NULL");
    res.sendStatus(401);
    return;
  }
  console.log(`username = ${username} user = ${user}`);
  if (username != user)
  {
    var data = auth.search_for_token(username); // search for login users
    if (data.admin == 0)
    {
      console.error("User not admin");
      console.log("User not admin");
      res.sendStatus(401);
      return;
    }
  }

  db.read_db(user)
    .then((result) =>
    {
      res.send(result);
    })
    .catch((err) =>
    {
      console.error(err);
      res.sendStatus(500);
    });
}

async function update_products_json(res)
{
  db.read_db_products()
    .then((result) =>
    {
      res.send(result);
    })
    .catch((err) =>
    {
      console.error(err);
      res.sendStatus(500);
    });
}

async function create_new_product(body)
{
  const { name, estabelecimento_id, price, image, duration, description } = body;

  if (name == undefined || price == undefined || image == undefined || duration == undefined || description == undefined || name == "" || price == "")
  {
    console.error("Invalid product");
    return 701;
  }

  if (containsSQLCode(name) || containsSQLCode(image) || containsSQLCode(description))
  {
    console.error(`SQL injection detected: ${name} ${price} ${image} ${duration}`);
    return 702;
  }

  const existingProduct = await db.get_product_on_db(name);

  if (existingProduct[0])
  {
    console.log(`Product ${name} already exists`);
    return 703;
  }

  if (isNaN(price))
  {
    console.log(`Price ${price} is not a number`);
    return 704;
  }

  if (price < 0)
  {
    console.log(`Price ${price} is negative`);
    return 704;
  }

  if (!Array.isArray(estabelecimento_id))
  {
    console.log("estabelecimento_id must be an array");
    return 705;
  }

  for (var i = 0; i < estabelecimento_id.length; i++)
  {
    if (estabelecimento_id[i] == "" || estabelecimento_id[i] == undefined || await estabelecimentos.does_estabelecimento_exist(estabelecimento_id[i]) == false)
    {
      console.log("Estabelecimento " + estabelecimento_id[i] + " is invalid");
      return 705;
    }
  }

  try
  {
    await db.create_new_product_on_db(name, estabelecimento_id, price, image, duration, description);
    console.log(`[+] Produto ${name} adicionado`);
  } catch (err)
  {
    console.log(`Erro ao adicionar produto ${name} err ${err}`);
    console.error(`Erro ao adicionar produto ${name} err ${err}`);
    return 500;
  }
  return 200;
}

async function edit_product(body)
{
  const { name, estabelecimento_id, price, image, duration, description } = body;

  if (name == undefined || price == undefined || image == undefined || duration == undefined || description == undefined || name == "" || price == "")
  {
    console.log("produto invalido");
    return 701;
  }
  if (containsSQLCode(name) || containsSQLCode(image) || containsSQLCode(description))
  {
    console.error(`SQL injection detected: ${name} ${price} ${image} ${duration}`);
    return 702;
  }

  const existingProduct = await db.get_product_on_db(name);

  if (!existingProduct[0])
  {
    console.log(`Product ${name} does not exist`);
    return 703;
  }

  if (isNaN(price) || price < 0)
  {
    console.log(`Price ${price} is not a number or negative`);
    return 704;
  }

  if (!Array.isArray(estabelecimento_id))
  {
    console.log("estabelecimento_id must be an array");
    return 705;
  }

  for (var i = 0; i < estabelecimento_id.length; i++)
  {
    if (estabelecimento_id[i] == "" || estabelecimento_id[i] == undefined || await estabelecimentos.does_estabelecimento_exist(estabelecimento_id[i]) == false)
    {
      console.log("Estabelecimento " + estabelecimento_id[i] + " is invalid");
      return 705;
    }
  }

  try
  {
    await db.edit_product_on_db(name, estabelecimento_id, price, image, duration, description);
    console.log(`Produto ${name} editado`);
  } catch (err)
  {
    console.log(`Erro ao editar produto ${name} err ${err}`);
    console.error(`Erro ao editar produto ${name} err ${err}`);
    return 500;
  }
  return 200;
}

async function delete_product(product)
{

  if (product == undefined || product == "")
  {
    console.log("produto invalido");
    return 701;
  }
  const existingProduct = await db.get_product_on_db(product);

  if (!existingProduct[0])
  {
    console.log(`Product ${product} does not exist`);
    return 703;
  }

  try
  {
    await db.delete_product_on_db(product);
    console.log(`Product ${product} removed`);
  } catch (err)
  {
    console.log(`Error removing product ${product}: ${err}`);
    console.error(`Error removing product ${product}: ${err}`);
    return 500
  }
  return 200;
}


//////////////////////SHECULER//////////////////////
function runAtSpecificTimeOfDay(hour, minutes, func)
{
  const twentyFourHours = 86400000;
  const now = new Date();
  let eta_ms = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, 0, 0).getTime() - now;
  if (eta_ms < 0)
  {
    eta_ms += twentyFourHours;
  }
  setTimeout(function ()
  {
    //run once
    func();
    // run every 24 hours from now on
    setInterval(func, twentyFourHours);
  }, eta_ms);
}

function start_sheculer()
{
  console.log("Sheculer running");
  runAtSpecificTimeOfDay(17, 44, sms.daily_sms);
}
start_sheculer();

module.exports = {
  update_agendamentos_json,
  create_new_product,
  update_products_json,
  delete_product,
  edit_product,
  isValidPhoneNumber,
  containsSQLCode,
};
