const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");
var auth = require("./auth.js");
var server = require("./server.js");
const crypto = require("crypto");
const { MissingJwtTokenError } = require("@shopify/shopify-api");
const { start } = require("repl");

function order_errors(err, order, ip)
{
  console.error(`ip = ${ip}`);
  console.error(`Erro na venda para ${order.email} de ${order.product.name} err ${err}`);
  console.log(`Erro na venda para ${order.email} de ${order.product.name}`);
}

async function create_order(order, date, ip)
{
  //add db
  let uuid = crypto.randomUUID();
  try
  {
    await db.add_db(
      order.product.name,
      order.email,
      order.user_number,
      date.ano,
      date.mes,
      date.dia,
      date.hora,
      date.minuto,
      order.product.duration,
      order.product.price,
      order.complete_name,
      order.user,
      uuid
    );
    console.log("Venda para " + order.email + " de '" + order.product.name + "' finalizada");
    sms.send_sms("Your order has been created", order.user_number);
  } catch (err)
  {
    order_errors(err, order, ip);
  }
}

async function can_marcacao_fit(date, duration, id, user)
{
  //outras marcacoes
  const cur_marcacao = await db.read_marcacao_on_specific_day(date[0].dia, date[0].mes, date[0].ano);
  const cur_bloqueio = await db.read_bloqueio_on_specific_day(date[0].dia, date[0].mes, date[0].ano);

  if (cur_marcacao.length == 0 && cur_bloqueio.length == 0) return true;

  var start_mins = parseInt(date[0].hora) * 60 + parseInt(date[0].minuto);
  var end_mins = start_mins + parseInt(duration);

  for (var i = 0; i < cur_marcacao.length; i++)
  {
    if (cur_marcacao[i].id == id) continue;

    var cur_start_mins = cur_marcacao[i].hora * 60 + cur_marcacao[i].minuto;
    var cur_end_mins = cur_start_mins + cur_marcacao[i].duration;

    if (start_mins >= cur_start_mins && start_mins < cur_end_mins)
    {
      return false;
    }
    if (end_mins > cur_start_mins && end_mins <= cur_end_mins)
    {
      return false;
    }
  }
  //////////////////////////
  console.log(date[0])
  var date = new Date(Date.UTC(date[0].ano, date[0].mes - 1, date[0].dia));
  const day1 = date.getDay();
  console.log("dia-> " + day1);
  const horario_on_day = await db.read_horario_on_specific_day(day1);

  if (horario_on_day.length == 0) return false;

  var horario_start_mins = parseInt(horario_on_day[0].comeco.split(":")[0]) * 60 + parseInt(horario_on_day[0].comeco.split(":")[1]);

  var horario_end_mins = parseInt(horario_on_day[0].fim.split(":")[0]) * 60 + parseInt(horario_on_day[0].fim.split(":")[1]);

  if (start_mins < horario_start_mins || end_mins > horario_end_mins)
  {
    return false;
  }


  //bloqueios
  for (var i = 0; i < cur_bloqueio.length; i++)
  {
    var hora_comeco = parseInt(cur_bloqueio[i].comeco.split(":")[0]) * 60 + parseInt(cur_bloqueio[i].comeco.split(":")[1]);
    var hora_fim = parseInt(cur_bloqueio[i].fim.split(":")[0]) * 60 + parseInt(cur_bloqueio[i].fim.split(":")[1]);

    if (start_mins >= hora_comeco && start_mins < hora_fim)
    {
      return false;
    }
    if (end_mins > hora_comeco && end_mins <= hora_fim)
    {
      return false;
    }
  }

  return true;
}

async function new_order_test(body, ip)
{
  const { user_number, email, name, date, complete_name, user } = body;
  console.log(complete_name);
  if (user_number == undefined || email == undefined || name == undefined || date == undefined || complete_name == undefined || user == undefined)
  {
    return 701;
  }

  const product = await db.get_product_on_db(name);

  if (product.length == 0)
  {
    return 703;
  }
  if ((await can_marcacao_fit(date, product[0].duration, 0, user)) == false)
  {
    return 704;
  }

  var data = await db.search_for_user(user);

  try
  {
    if (user != data[0].user) return 705;
  } catch (err)
  {
    return 705;
  }

  try
  {
    if (server.containsSQLCode(user_number) || server.containsSQLCode(email) || server.containsSQLCode(name))
    {
      console.error(`Bad input: ${user_number} ${email} ${name} ${date[0]}`);
      return 701;
    }
  } catch (err)
  {
    console.error(`Bad input: ${user_number} ${email} ${name} ${date[0]}`);
    return 701;
  }

  try
  {
    if (!server.isValidPhoneNumber(user_number))
    {
      console.error(`Numero de telefone invalido: ${user_number}`);
      return 702;
    }
  } catch (err)
  {
    console.error(`Bad input: ${user_number} ${email} ${name} ${date[0]}`);
    return 702;
  }

  console.log(`Venda para ${email} de '${name}' inicializada`);

  try
  {
    const new_order = {
      email,
      complete_name,
      user_number,
      product: product[0],
      user,
    };
    if (new_order.product.name != name)
    {
      throw new Error();
    }
    console.log(`Venda para ${email} de '${name}' em andamento`);
    create_order(new_order, date[0], ip);
    return 200;
  } catch (err)
  {
    console.error(`Cant find product "${name}" on db`);
    const new_order = {
      email,
      complete_name,
      user_number,
      product: { name: name, price: 0, image: "", duration: 0 },
      user,
    };
    order_errors(err, new_order, ip);
    return 500;
  }
}

async function delete_marcacao(uuid)
{
  if (uuid == undefined) return 701;
  const marcacao = await db.get_product_on_db_by_uuid(uuid);
  if (marcacao.length == 0) return 702;

  try
  {
    await db.delete_marcacao(uuid);
  } catch (err)
  {
    console.error(`Erro ao remover marcacao ${uuid} err ${err}`);
    return 500;
  }

  return 200;
}

async function edit_marcacao(body)
{
  const { uuid, date } = body;

  if (uuid == undefined || date == undefined)
  {
    return 701;
  }

  const marcacao = await db.get_product_on_db_by_uuid(uuid);

  if (marcacao.length == 0)
  {
    return 702;
  }

  if ((await can_marcacao_fit(date, marcacao[0].duration, marcacao[0].id, marcacao[0].user)) == false)
  {
    return 704;
  }
  try
  {
    await db.edit_marcacao(uuid, date[0].ano, date[0].mes, date[0].dia, date[0].hora, date[0].minuto);
  } catch (err)
  {
    console.error(`Erro ao editar marcacao ${uuid} err ${err}`);
    return 500;
  }
  return 200;
}

module.exports = {
  new_order_test,
  delete_marcacao,
  edit_marcacao,
};
