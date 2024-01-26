const sqlite3 = require("sqlite3").verbose();

const INSERT_QUERY =
    "INSERT INTO marcacoes (email, user_number, service, duration, ano, mes, dia, hora, minuto, price_at_moment,complete_name) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
const SELECT_ALL_QUERY = "SELECT email, user_number, service, ano,mes,dia,hora,minuto,duration FROM marcacoes";
const SELECT_ALL_QUERY_PRODUCTS = "SELECT name,price,image,duration FROM products";
const SELECT_ALLFOR_SMS_QUERY = "SELECT user_number, ano,mes,dia,hora,minuto,duration FROM marcacoes";
const SELECT_PRODUCT_QUERY = "SELECT * FROM products WHERE name=?";
const INSERT_QUERY_CREATE_PRODUCT = "INSERT INTO products (name,price,image,duration) VALUES(?,?,?,?)";
const DELETE_PRODUCT_QUERY = "DELETE FROM products WHERE name = ?";

const db = new sqlite3.Database("../backend/base.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.log(err.message);
});

function add_db(service, email, user_number, ano, mes, dia, hora, minuto, duration, price, complete_name) {
    return new Promise((resolve, reject) => {
        db.run(INSERT_QUERY, [email, user_number, service, duration, ano, mes, dia, hora, minuto, price, complete_name], (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function read_db() {
    return new Promise((resolve, reject) => {
        db.all(SELECT_ALL_QUERY, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

function read_db_products() {
    return new Promise((resolve, reject) => {
        db.all(SELECT_ALL_QUERY_PRODUCTS, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

function read_db_sms() {
    return new Promise((resolve, reject) => {
        db.all(SELECT_ALLFOR_SMS_QUERY, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

function get_product_on_db(name) {
    return new Promise((resolve, reject) => {
        db.all(SELECT_PRODUCT_QUERY, [name], function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

function create_new_product_on_db(name, price, image, duration) {
    return new Promise((resolve, reject) => {
        db.run(INSERT_QUERY_CREATE_PRODUCT, [name, price, image, duration], (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function delete_product_on_db(product) {
    return new Promise((resolve, reject) => {
        db.run(DELETE_PRODUCT_QUERY, [product], (err, data) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function add_user(user, password, admin) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO users (user,password, admin) VALUES(?,?,?)", [user, password, admin], (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function delete_user(user) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM users WHERE user = ?", [user], (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function search_for_user(user) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM users WHERE user=?", [user], function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

module.exports = {
    add_db,
    read_db,
    get_product_on_db,
    read_db_sms,
    create_new_product_on_db,
    search_for_user,
    read_db_products,
    delete_product_on_db,
    add_user,
    delete_user,
};
