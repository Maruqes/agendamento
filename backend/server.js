const { query } = require("express");
var db = require("./db.js");
var sms = require("./sms.js");
var auth = require("./auth.js");

function containsSQLCode(str) {
    try {
        const sqlKeywords = ["SELECT", "UPDATE", "DELETE", "INSERT", "CREATE", "DROP", "ALTER", "TRUNCATE", "REPLACE"];

        return sqlKeywords.some((keyword) => str.toUpperCase().includes(keyword));
    } catch (err) {
        return false;
    }
}

function isValidPhoneNumber(user_number) {
    try {
        if (user_number[0] === "+" && user_number[1] === "3" && user_number[2] === "5" && user_number[3] === "1" && user_number.length === 13) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error(`Error in isValidPhoneNumber: ${err}`);
        return false;
    }
}

function order_errors(err, order, ip) {
    console.error(`ip = ${ip}`);
    console.error(`Erro na venda para ${order.email} de ${order.product.name} err ${err}`);
    console.log(`Erro na venda para ${order.email} de ${order.product.name}`);
}

async function create_order(order, date, ip) {
    //add db
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
            order.user
        );
        console.log("Venda para " + order.email + " de '" + order.product.name + "' finalizada");
        sms.send_sms("Your order has been created", order.user_number);
    } catch (err) {
        order_errors(err, order, ip);
    }
}

async function new_order_test(body, ip) {
    const { user_number, email, name, date, complete_name, user } = body;

    var data = await db.search_for_user(user);

    try {
        if (user != data[0].user) return 705;
    } catch (err) {
        return 705;
    }

    try {
        if (containsSQLCode(user_number) || containsSQLCode(email) || containsSQLCode(name)) {
            console.error(`Bad input: ${user_number} ${email} ${name} ${date}`);
            return 701;
        }
    } catch (err) {
        console.error(`Bad input: ${user_number} ${email} ${name} ${date}`);
        return 701;
    }

    try {
        if (!isValidPhoneNumber(user_number)) {
            console.error(`Numero de telefone invalido: ${user_number}`);
            return 702;
        }
    } catch (err) {
        console.error(`Bad input: ${user_number} ${email} ${name} ${date}`);
        return 702;
    }

    console.log(`Venda para ${email} de '${name}' inicializada`);

    try {
        const product = await db.get_product_on_db(name);
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

async function update_agendamentos_json(res, username, user) {
    if (username == "" || user == "") {
        console.error("username or user is NULL");
        res.sendStatus(401);
        return;
    }
    console.log(`username = ${username} user = ${user}`);
    if (username != user) {
        var data = auth.search_for_token(username); // search for login users
        if (data.admin == 0) {
            console.error("User not admin");
            console.log("User not admin");
            res.sendStatus(401);
            return;
        }
    }

    db.read_db(user)
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
    const { name, price, image, duration, description } = body;
    if (name == "" || price == "") {
        console.log("produto invalido");
        return;
    }
    if (containsSQLCode(name) || containsSQLCode(image) || containsSQLCode(description)) {
        console.error(`SQL injection detected: ${name} ${price} ${image} ${duration}`);
        return;
    }

    try {
        await db.create_new_product_on_db(name, price, image, duration, description);
        console.log(`Produto ${name} adicionado`);
    } catch (err) {
        console.log(`Erro ao adicionar produto ${name} err ${err}`);
        console.error(`Erro ao adicionar produto ${name} err ${err}`);
    }
}

async function edit_product(body) {
    const { name, price, image, duration, description } = body;
    if (name == "" || price == "") {
        console.log("produto invalido");
        return;
    }
    if (containsSQLCode(name) || containsSQLCode(image) || containsSQLCode(description)) {
        console.error(`SQL injection detected: ${name} ${price} ${image} ${duration}`);
        return;
    }

    const existingProduct = await db.get_product_on_db(name);

    if (!existingProduct[0]) {
        console.log(`Product ${name} does not exist`);
        return;
    }

    try {
        await db.edit_product_on_db(name, price, image, duration, description);
        console.log(`Produto ${name} editado`);
    } catch (err) {
        console.log(`Erro ao editar produto ${name} err ${err}`);
        console.error(`Erro ao editar produto ${name} err ${err}`);
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

module.exports = { new_order_test, update_agendamentos_json, create_new_product, update_products_json, delete_product, edit_product };
