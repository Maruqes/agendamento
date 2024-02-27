const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("../backend/base.db", sqlite3.OPEN_READWRITE, (err) =>
{
  if (err) return console.log(err.message);
});

function add_db(service, email, user_number, ano, mes, dia, hora, minuto, duration, price, complete_name, user, uuid)
{
  return new Promise((resolve, reject) =>
  {
    db.run(
      "INSERT INTO marcacoes (id, email, user_number, service, duration, ano, mes, dia, hora, minuto, price_at_moment,complete_name, user) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [uuid, email, user_number, service, duration, ano, mes, dia, hora, minuto, price, complete_name, user],
      (err) =>
      {
        if (err)
        {
          reject(err);
        }
        resolve();
      }
    );
  });
}

function delete_marcacao(uuid)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM marcacoes WHERE id = ?", [uuid], (err, data) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function edit_marcacao(uuid, ano, mes, dia, hora, minuto)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE marcacoes SET ano = ?, mes = ?, dia = ?, hora = ?, minuto = ? WHERE id = ?", [ano, mes, dia, hora, minuto, uuid], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function get_product_on_db_by_uuid(uuid)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM marcacoes WHERE id=?", [uuid], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_db(user)
{
  if (user == "*")
  {
    return new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM marcacoes", function (err, data)
      {
        if (err)
        {
          reject(err);
        }
        resolve(data);
      });
    });
  }
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM marcacoes WHERE user = ?", [user], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_marcacao_on_specific_day(dia, mes, ano)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM marcacoes WHERE dia = ? AND mes = ? AND ano = ?", [dia, mes, ano], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_db_products()
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT name,price,image,duration, description FROM products", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_db_sms()
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT user_number, ano,mes,dia,hora,minuto,duration FROM marcacoes", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function get_product_on_db(name)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM products WHERE name=?", [name], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function create_new_product_on_db(name, price, image, duration, description)
{
  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO products (name,price,image,duration, description) VALUES(?,?,?,?,?)", [name, price, image, duration, description], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function edit_product_on_db(name, price, image, duration, description)
{
  return new Promise((resolve, reject) =>
  {
    db.run(
      "UPDATE products SET price = ?, image = ?, duration = ?, description = ? WHERE name = ?",
      [price, image, duration, description, name],
      (err) =>
      {
        if (err)
        {
          reject(err);
        }
        resolve();
      }
    );
  });
}

function delete_product_on_db(product)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM products WHERE name = ?", [product], (err, data) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function add_user(user, password, admin, email, phone_number, full_name, image)
{
  return new Promise((resolve, reject) =>
  {
    db.run(
      "INSERT INTO users (user,password, admin, email, phone_number, full_name, image) VALUES(?,?,?,?,?,?,?)",
      [user, password, admin, email, phone_number, full_name, image],
      (err) =>
      {
        if (err)
        {
          reject(err);
        }
        resolve();
      }
    );
  });
}

function edit_user(user, email, phone_number, full_name, image)
{
  return new Promise((resolve, reject) =>
  {
    db.run(
      "UPDATE users SET email = ?, phone_number = ?, full_name = ?, image = ? WHERE user = ?",
      [email, phone_number, full_name, image, user],
      (err) =>
      {
        if (err)
        {
          reject(err);
        }
        resolve();
      }
    );
  });
}

function delete_user(user)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM users WHERE user = ?", [user], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function search_for_user(user)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM users WHERE user=?", [user], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_db_users()
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT user, admin, email, phone_number, full_name, image FROM users", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function set_horario(dia, comeco, fim)
{
  //dia -> 0->domingo 1->segunda 2->terca 3->quarta 4->quinta 5->sexta 6->sabado
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE horarios SET comeco = ?, fim = ? WHERE dia = ?", [comeco, fim, dia], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function get_horario()
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM horarios", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_horario_on_specific_day(dia)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM horarios WHERE dia = ?", [dia], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function set_bloqueio(dia, mes, ano, comeco, fim, uuid, user)
{
  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO bloqueios (uuid, user, comeco, fim, dia, mes, ano) VALUES(?,?,?,?,?,?,?)", [uuid, user, comeco, fim, dia, mes, ano], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function get_bloqueio()
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM bloqueios", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function get_bloqueio_uuid(uuid)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM bloqueios WHERE uuid=?", [uuid], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function delete_bloqueio_on_db(uuid)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM bloqueios WHERE uuid = ?", [uuid], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function read_bloqueio_on_specific_day(dia, mes, ano)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM bloqueios WHERE dia = ? AND mes = ? AND ano = ?", [dia, mes, ano], function (err, data)
    {
      if (err)
      {
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
  read_db_users,
  edit_product_on_db,
  edit_user,
  delete_marcacao,
  edit_marcacao,
  read_marcacao_on_specific_day,
  get_product_on_db_by_uuid,
  set_horario,
  get_horario,
  read_horario_on_specific_day,
  set_bloqueio,
  get_bloqueio,
  get_bloqueio_uuid,
  delete_bloqueio_on_db,
  read_bloqueio_on_specific_day,
};
