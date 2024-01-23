const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");

function containsSQLCode(str) {
    try {
        const sqlKeywords = ["SELECT", "UPDATE", "DELETE", "INSERT", "CREATE", "DROP", "ALTER", "TRUNCATE", "REPLACE"];

        return sqlKeywords.some((keyword) => str.toUpperCase().includes(keyword));
    } catch (err) {
        return false;
    }
}
function isValidPhoneNumber(user_number) {
    return user_number[0] === "+" && user_number[1] === "3" && user_number[2] === "5" && user_number[3] === "1" && user_number.length === 13;
}

function order_errors(err, order, ip) {
    console.error(`ip = ${ip}`);
    console.error(`Erro na venda para ${order.email} de ${order.product.name} err ${err}`);
    console.log(`Erro na venda para ${order.email} de ${order.product.name}`);
}

async function create_order(order, date, ip) {
    //add db
    try {
        await db.add_db(order.product.name, order.email, order.user_number, date.ano, date.mes, date.dia, date.hora, date.minuto, order.product.duration);
        console.log("Venda para " + order.email + " de '" + order.product.name + "' finalizada");
        sms.send_sms("Your order has been created", order.user_number);
    } catch (err) {
        order_errors(err, order, ip);
    }
}

async function new_order_test(body, ip) {
    const { user_number, email, name, date } = body;

    try {
        if (containsSQLCode(user_number) || containsSQLCode(email) || containsSQLCode(name)) {
            console.error(`Bad input: ${user_number} ${email} ${name} ${date}`);
            return 701;
        }
    } catch (err) {
        console.error(`Bad input: ${user_number} ${email} ${name} ${date}`);
        return 701;
    }

    if (!isValidPhoneNumber(user_number)) {
        console.error(`Numero de telefone invalido: ${user_number}`);
        return 702;
    }

    console.log(`Venda para ${email} de '${name}' inicializada`);

    try {
        const product = await db.get_product_on_db(name);
        const new_order = {
            email,
            user_number,
            product: product[0],
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
            user_number,
            product: { name: name, price: 0, image: "", duration: 0 },
        };
        order_errors(err, new_order, ip);
        return 703;
    }
}

async function update_agendamentos_json(res) {
    db.read_db()
        .then((result) => {
            res.send(result);
        })
        .catch((err) => {
            console.error(err);
        });
}

async function update_products_json(res) {
    db.read_db_products()
        .then((result) => {
            res.send(result);
        })
        .catch((err) => {
            console.error(err);
        });
}

async function create_new_product(body) {
    const { name, price, image, duration } = body;
    if (name == "" || price == "") {
        console.log("produto invalido");
        return;
    }
    if (containsSQLCode(name) || containsSQLCode(image)) {
        console.error(`SQL injection detected: ${name} ${price} ${image} ${duration}`);
        return;
    }

    try {
        await db.create_new_product_on_db(name, price, image, duration);
        console.log(`Produto ${name} adicionado`);
    } catch (err) {
        console.log(`Erro ao adicionar produto ${name} err ${err}`);
        console.error(`Erro ao adicionar produto ${name} err ${err}`);
    }
}

async function delete_product(product) {
    const existingProduct = await db.get_product_on_db(product);

    if (!existingProduct[0]) {
        console.log(`Product ${product} does not exist`);
        return;
    }

    try {
        await db.delete_product_on_db(product);
        console.log(`Product ${product} removed`);
    } catch (err) {
        console.log(`Error removing product ${product}: ${err}`);
        console.error(`Error removing product ${product}: ${err}`);
    }
}

function runAtSpecificTimeOfDay(hour, minutes, func) {
    const twentyFourHours = 86400000;
    const now = new Date();
    let eta_ms = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, 0, 0).getTime() - now;
    if (eta_ms < 0) {
        eta_ms += twentyFourHours;
    }
    setTimeout(function () {
        //run once
        func();
        // run every 24 hours from now on
        setInterval(func, twentyFourHours);
    }, eta_ms);
}

function start_sheculer() {
    console.log("Sheculer running");
    runAtSpecificTimeOfDay(17, 44, sms.daily_sms);
}
start_sheculer();

module.exports = { new_order_test, update_agendamentos_json, create_new_product, update_products_json, delete_product };
