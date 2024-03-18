const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");
var auth = require("./auth.js");
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
  const { name, price, image, duration, description } = body;

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

  try
  {
    await db.create_new_product_on_db(name, price, image, duration, description);
    console.log(`Produto ${name} adicionado`);
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
  const { name, price, image, duration, description } = body;

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

  try
  {
    await db.edit_product_on_db(name, price, image, duration, description);
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

function set_horario(dia, comeco, fim)
{
  if (dia == undefined || comeco == undefined || fim == undefined)
  {
    return 400;
  }

  if (dia < 0 || dia > 6 || comeco < 0 || comeco > 24 || fim < 0 || fim > 24)
  {
    return 400;
  }
  var comeco_hora = parseInt(comeco.split(":")[0]);
  var comeco_minuto = parseInt(comeco.split(":")[1]);
  var fim_hora = parseInt(fim.split(":")[0]);
  var fim_minuto = parseInt(fim.split(":")[1]);
  if (comeco_hora * 60 + comeco_minuto > fim_hora * 60 + fim_minuto)
  {
    return 400;
  }
  console.log(`[+] SETADO NOVO HORARIO dia = ${dia} comeco = ${comeco} fim = ${fim}`);
  db.set_horario(dia, comeco, fim);
  return 200;
}

async function get_horario(res)
{
  db.get_horario()
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


async function set_bloqueio(dia, mes, ano, comeco, fim, user)
{
  //dia -> xx/xx/xxxx
  if (dia == undefined || mes == undefined || ano == undefined || comeco == undefined || fim == undefined || user == undefined)
  {
    return 400;
  }

  if (user != '*')
  {
    const existingUser = await db.search_for_user(user);

    if (!existingUser[0] || existingUser[0].user != user)
    {
      console.log(`User ${user} does not exist`);
      return 701;
    }
  }


  if (dia < 1 || dia > 31 || mes < 1 || mes > 12)
  {
    return 400;
  }

  var comeco_hora = parseInt(comeco.split(":")[0]);
  var comeco_minuto = parseInt(comeco.split(":")[1]);
  var fim_hora = parseInt(fim.split(":")[0]);
  var fim_minuto = parseInt(fim.split(":")[1]);
  if (comeco_hora * 60 + comeco_minuto > fim_hora * 60 + fim_minuto)
  {
    return 400;
  }

  console.log(`[+] SETADO NOVO BLOQUEIO dia = ${dia} comeco = ${comeco} fim = ${fim} user = ${user}`);
  let uuid = crypto.randomUUID();
  db.set_bloqueio(dia, mes, ano, comeco, fim, uuid, user);
  return 200;

}

async function get_bloqueio(res)
{
  db.get_bloqueio()
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

async function delete_bloqueio(uuid)
{
  if (uuid == undefined || uuid == "")
  {
    console.log("uuid invalido");
    return 701;
  }
  const existingBloqueio = await db.get_bloqueio_uuid(uuid);

  if (!existingBloqueio[0] || existingBloqueio[0].uuid != uuid)
  {
    console.log(`Bloqueio ${uuid} does not exist`);
    return 703;
  }

  try
  {
    await db.delete_bloqueio_on_db(uuid);
    console.log(`Bloqueio ${uuid} removed`);
  } catch (err)
  {
    console.log(`Error removing bloqueio ${uuid}: ${err}`);
    console.error(`Error removing bloqueio ${uuid}: ${err}`);
    return 500
  }
  return 200;

}



async function create_new_estabelecimento(body)
{
  const { name, address, phone, image, description } = body;

  if (name == undefined || address == undefined || phone == undefined || image == undefined || description == undefined || name == "" || address == "" || phone == "")
  {
    console.error("Invalid estabelecimento");
    return 701;
  }

  if (containsSQLCode(name) || containsSQLCode(image) || containsSQLCode(description))
  {
    console.error(`SQL injection detected: ${name} ${address} ${phone} ${image} ${description}`);
    return 702;
  }


  try
  {
    await db.add_estabelecimento(name, address, phone, image, description);
    console.log(`Estabelecimento ${name} added`);
  } catch (err)
  {
    console.log(`Error adding estabelecimento ${name}: ${err}`);
    console.error(`Error adding estabelecimento ${name}: ${err}`);
    return 500;
  }
  return 200;

}


async function delete_estabelecimento(id)
{
  if (id == undefined || id == "")
  {
    console.log("id invalido");
    return 701;
  }
  const existingEstabelecimento = await db.get_estabelecimento_by_id(id);

  if (!existingEstabelecimento[0] || existingEstabelecimento[0].id != id)
  {
    console.log(`Estabelecimento ${id} does not exist`);
    return 703;
  }

  try
  {
    await db.remove_estabelecimento(id);
    console.log(`Estabelecimento ${id} removed`);
  } catch (err)
  {
    console.log(`Error removing estabelecimento ${id}: ${err}`);
    console.error(`Error removing estabelecimento ${id}: ${err}`);
    return 500
  }
  return 200;
}


async function edit_estabelecimento(body)
{
  const { id, name, address, phone, image, description } = body;

  if (id == undefined || name == undefined || address == undefined || phone == undefined || image == undefined || description == undefined || id == "" || name == "" || address == "" || phone == "")
  {
    console.log("estabelecimento invalido");
    return 701;
  }
  if (containsSQLCode(name) || containsSQLCode(image) || containsSQLCode(description))
  {
    console.error(`SQL injection detected: ${name} ${address} ${phone} ${image} ${description}`);
    return 702;
  }

  const existingEstabelecimento = await db.get_estabelecimento_by_id(id);

  if (!existingEstabelecimento[0] || existingEstabelecimento[0].id != id)
  {
    console.log(`Estabelecimento ${id} does not exist`);
    return 703;
  }


  try
  {
    await db.edit_estabelecimento(id, name, address, phone, image, description);
    console.log(`Estabelecimento ${id} edited`);
  } catch (err)
  {
    console.log(`Error editing estabelecimento ${id}: ${err}`);
    console.error(`Error editing estabelecimento ${id}: ${err}`);
    return 500;
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
  set_horario,
  get_horario,
  set_bloqueio,
  get_bloqueio,
  delete_bloqueio,
  create_new_estabelecimento,
  delete_estabelecimento,
  edit_estabelecimento,
};
