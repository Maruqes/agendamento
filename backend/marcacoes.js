const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");
var auth = require("./auth.js");
var server = require("./server.js");
const estabelecimentos = require("./estabelecimentos.js");
const crypto = require("crypto");

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
      uuid,
      order.estabelecimento_id
    );
    console.log(" [+] Venda para " + order.email + " de '" + order.product.name + "' finalizada");
    sms.send_sms("Your order has been created", order.user_number);
  } catch (err)
  {
    order_errors(err, order, ip);
  }
}

async function check_user_estabelecimento(user, estabelecimento_id)
{
  const data = await db.search_for_user(user);
  if (data.length == 0) return false;
  const estabelecimentos = data[0].estabelecimento_id.split(",").map(Number);
  if (estabelecimentos.includes(estabelecimento_id)) return true;
  console.log("Users is not in the estebelcimento")
  return false;
}


async function can_marcacao_fit(date, duration, id, user, estabelecimento_id, product)
{

  if (await check_user_estabelecimento(user, estabelecimento_id) == false) return 801;

  //outras marcacoes
  const cur_marcacao = await db.read_marcacao_on_specific_day(date[0].dia, date[0].mes, date[0].ano, estabelecimento_id); //VER ESTAS FUNC
  const cur_bloqueio = await db.read_bloqueio_on_specific_day(date[0].dia, date[0].mes, date[0].ano, estabelecimento_id);


  var start_mins = parseInt(date[0].hora) * 60 + parseInt(date[0].minuto);
  var end_mins = start_mins + parseInt(duration);

  //verificar se a marcacao cabe
  console.log("Temos " + cur_marcacao.length + " marcacoes")
  console.log("Temos " + cur_bloqueio.length + " bloqueios")
  for (var i = 0; i < cur_marcacao.length; i++)
  {
    if (cur_marcacao[i].id == id) continue; // nao confilitir com a propria marcacao
    if (cur_marcacao[i].user != user) continue; // nao confilitir com marcacoes de outros usuarios

    var cur_start_mins = cur_marcacao[i].hora * 60 + cur_marcacao[i].minuto;
    var cur_end_mins = cur_start_mins + cur_marcacao[i].duration;

    if (start_mins >= cur_start_mins && start_mins < cur_end_mins)
    {
      console.log("Does not fit becouse of start_mins")
      return 802;
    }
    if (end_mins > cur_start_mins && end_mins <= cur_end_mins)
    {
      console.log("Does not fit becouse of end_mins")
      return 802;
    }
  }

  //horario
  var date = new Date(Date.UTC(date[0].ano, date[0].mes - 1, date[0].dia));
  const day1 = date.getDay();
  console.log("dia-> " + day1);
  const horario_on_day = await db.read_horario_on_specific_day(day1, estabelecimento_id);

  if (horario_on_day.length == 0) return 500;


  var horario_start_mins = parseInt(horario_on_day[0].comeco.split(":")[0]) * 60 + parseInt(horario_on_day[0].comeco.split(":")[1]);

  var horario_end_mins = parseInt(horario_on_day[0].fim.split(":")[0]) * 60 + parseInt(horario_on_day[0].fim.split(":")[1]);

  if (start_mins < horario_start_mins || end_mins > horario_end_mins)
  {
    console.log("Does not fit becouse of horario")
    return 803;
  }


  //bloqueios

  for (var i = 0; i < cur_bloqueio.length; i++)
  {
    var hora_comeco = parseInt(cur_bloqueio[i].comeco.split(":")[0]) * 60 + parseInt(cur_bloqueio[i].comeco.split(":")[1]);
    var hora_fim = parseInt(cur_bloqueio[i].fim.split(":")[0]) * 60 + parseInt(cur_bloqueio[i].fim.split(":")[1]);
    if (cur_bloqueio[i].user == user)
    {
      if (start_mins >= hora_comeco && start_mins < hora_fim)
      {
        console.log("Does not fit becouse of bloqueio")
        return 804;
      }
      if (end_mins > hora_comeco && end_mins <= hora_fim)
      {
        console.log("Does not fit becouse of bloqueio")
        return 804;
      }
    } else if (cur_bloqueio[i].user == '*')
    {
      if (start_mins >= hora_comeco && start_mins < hora_fim)
      {
        console.log("Does not fit becouse of bloqueio")
        return 804;
      }
      if (end_mins > hora_comeco && end_mins <= hora_fim)
      {
        console.log("Does not fit becouse of bloqueio")
        return 804;
      }
    }
  }

  const bloqueios_repeat = await db.read_bloqueios_repeat(day1, estabelecimento_id);
  console.log("Temos " + bloqueios_repeat.length + " bloqueios repeat")
  for (var i = 0; i < bloqueios_repeat.length; i++)
  {
    if (bloqueios_repeat[i].repeat == 0) continue;

    if (bloqueios_repeat[i].user == user)
    {
      var hora_comeco = parseInt(bloqueios_repeat[i].comeco.split(":")[0]) * 60 + parseInt(bloqueios_repeat[i].comeco.split(":")[1]);
      var hora_fim = parseInt(bloqueios_repeat[i].fim.split(":")[0]) * 60 + parseInt(bloqueios_repeat[i].fim.split(":")[1]);
      if (start_mins >= hora_comeco && start_mins < hora_fim)
      {
        console.log("Does not fit becouse of bloqueio repeat")
        return 804;
      }
      if (end_mins > hora_comeco && end_mins <= hora_fim)
      {
        console.log("Does not fit becouse of bloqueio repeat")
        return 804;
      }
    } else if (bloqueios_repeat[i].user == '*')
    {
      var hora_comeco = parseInt(bloqueios_repeat[i].comeco.split(":")[0]) * 60 + parseInt(bloqueios_repeat[i].comeco.split(":")[1]);
      var hora_fim = parseInt(bloqueios_repeat[i].fim.split(":")[0]) * 60 + parseInt(bloqueios_repeat[i].fim.split(":")[1]);
      if (start_mins >= hora_comeco && start_mins < hora_fim)
      {
        console.log("Does not fit becouse of bloqueio")
        return 804;
      }
      if (end_mins > hora_comeco && end_mins <= hora_fim)
      {
        console.log("Does not fit becouse of bloqueio")
        return 804;
      }
    }
  }

  //verifircar se produto existe na loja
  if (product.length == 0)
  {
    return 703;
  }

  var estabelecimentos_onde_existe = product[0].estabelecimento_id.split(",").map(Number);

  if (!estabelecimentos_onde_existe.includes(estabelecimento_id))
  {
    return 805;
  }

  return 200;
}

async function new_order_test(body, ip)
{
  const { user_number, email, name, estabelecimento_id, date, complete_name, user } = body;
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

  let mar_fit_err = (await can_marcacao_fit(date, product[0].duration, 0, user, estabelecimento_id, product));
  if (mar_fit_err != 200)
  {
    return mar_fit_err;
  }

  var data = await db.search_for_user(user);

  if (data.length == 0) return 705;

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

  if (await estabelecimentos.does_estabelecimento_exist(estabelecimento_id) == false)
  {
    return 706;
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
      estabelecimento_id,
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
    console.log(`[-] Marcacao ${uuid} removida para ` + marcacao[0].email);
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
    console.log(`[i] Marcacao ${uuid} editada para ` + marcacao[0].email)
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
