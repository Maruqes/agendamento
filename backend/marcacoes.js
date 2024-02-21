const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");
var auth = require("./auth.js");
var server = require("./server.js");
const crypto = require("crypto");
const { MissingJwtTokenError } = require("@shopify/shopify-api");
const { start } = require("repl");

function order_errors(err, order, ip) {
    console.error(`ip = ${ip}`);
    console.error(`Erro na venda para ${order.email} de ${order.product.name} err ${err}`);
    console.log(`Erro na venda para ${order.email} de ${order.product.name}`);
}

async function create_order(order, date, ip) {
    //add db
    let uuid = crypto.randomUUID();
    try {
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
    } catch (err) {
        order_errors(err, order, ip);
    }
}

async function can_marcacao_fit(date, duration) {
    const cur_marcacao = await db.read_marcacao_on_specific_day(date[0].dia, date[0].mes, date[0].ano);

    var start_mins = parseInt(date[0].hora) * 60 + parseInt(date[0].minuto);
    var end_mins = start_mins + parseInt(duration);

    for (var i = 0; i < cur_marcacao.length; i++) {
        var cur_start_mins = cur_marcacao[i].hora * 60 + cur_marcacao[i].minuto;
        var cur_end_mins = cur_start_mins + cur_marcacao[i].duration;

        if (start_mins >= cur_start_mins && start_mins < cur_end_mins) {
            return false;
        }
        if (end_mins > cur_start_mins && end_mins <= cur_end_mins) {
            return false;
        }
    }
    return true;
}

async function new_order_test(body, ip) {
    const { user_number, email, name, date, complete_name, user } = body;

    const product = await db.get_product_on_db(name);

    if ((await can_marcacao_fit(date, product[0].duration)) == false) {
        return 704;
    }

    var data = await db.search_for_user(user);

    try {
        if (user != data[0].user) return 705;
    } catch (err) {
        return 705;
    }

    try {
        if (server.containsSQLCode(user_number) || server.containsSQLCode(email) || server.containsSQLCode(name)) {
            console.error(`Bad input: ${user_number} ${email} ${name} ${date[0]}`);
            return 701;
        }
    } catch (err) {
        console.error(`Bad input: ${user_number} ${email} ${name} ${date[0]}`);
        return 701;
    }

    try {
        if (!server.isValidPhoneNumber(user_number)) {
            console.error(`Numero de telefone invalido: ${user_number}`);
            return 702;
        }
    } catch (err) {
        console.error(`Bad input: ${user_number} ${email} ${name} ${date[0]}`);
        return 702;
    }

    console.log(`Venda para ${email} de '${name}' inicializada`);

    try {
        const new_order = {
            email,
            complete_name,
            user_number,
            product: product[0],
            user,
        };
        if (new_order.product.name != name) {
            throw new Error();
        }
        console.log(`Venda para ${email} de '${name}' em andamento`);
        create_order(new_order, date[0], ip);
        return 200;
    } catch (err) {
        console.error(`Cant find product "${name}" on db`);
        const new_order = {
            email,
            complete_name,
            user_number,
            product: { name: name, price: 0, image: "", duration: 0 },
            user,
        };
        order_errors(err, new_order, ip);
        return 703;
    }
}

async function delete_marcacao(uuid) {
    try {
        await db.delete_marcacao(uuid);
    } catch (err) {
        console.error(`Erro ao remover marcacao ${uuid} err ${err}`);
    }
}

async function edit_marcacao(body) {
    const { uuid, date } = body;

    const marcacao = await db.get_product_on_db_by_uuid(uuid);

    if ((await can_marcacao_fit(date, marcacao[0].duration)) == false) {
        return 704;
    }
    try {
        await db.edit_marcacao(uuid, date[0].ano, date[0].mes, date[0].dia, date[0].hora, date[0].minuto);
    } catch (err) {
        console.error(`Erro ao editar marcacao ${uuid} err ${err}`);
    }
    return 200;
}

module.exports = {
    new_order_test,
    delete_marcacao,
    edit_marcacao,
};
