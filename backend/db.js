const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("../backend/base.db", sqlite3.OPEN_READWRITE, (err) =>
{
  if (err) return console.log(err.message);
});

function add_db(service, email, user_number, ano, mes, dia, hora, minuto, duration, price, complete_name, user, uuid, estabelecimento_id, dia_da_semana)
{
  return new Promise((resolve, reject) =>
  {
    db.run(
      "INSERT INTO marcacoes (id, email, user_number, service, duration, ano, mes, dia, hora, minuto, price_at_moment,complete_name, user, estabelecimento_id,dia_da_semana) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [uuid, email, user_number, service, duration, ano, mes, dia, hora, minuto, price, complete_name, user, estabelecimento_id, dia_da_semana],
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

async function read_marcacoes_on_dia_da_semana(dia_da_semana, estabelecimento_id, user)
{
  if (user == "*")
  {
    return new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM marcacoes WHERE dia_da_semana = ? AND estabelecimento_id = ?", [dia_da_semana, estabelecimento_id], function (err, data)
      {
        if (err)
        {
          reject(err);
        }
        resolve(data);
      });
    });
  } else
  {
    return new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM marcacoes WHERE dia_da_semana = ? AND estabelecimento_id = ? AND user = ?", [dia_da_semana, estabelecimento_id, user], function (err, data)
      {
        if (err)
        {
          reject(err);
        }
        resolve(data);
      });
    });

  }
}


function read_marcacao_on_specific_day(dia, mes, ano, estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM marcacoes WHERE dia = ? AND mes = ? AND ano = ? AND estabelecimento_id = ?", [dia, mes, ano, estabelecimento_id], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function read_marcacoes_from_estabelecimento(estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM marcacoes WHERE estabelecimento_id = ?", [estabelecimento_id], function (err, data)
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
    db.all("SELECT name,estabelecimento_id,price,image,duration, description FROM products", function (err, data)
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

function create_new_product_on_db(name, estabelecimento_id, price, image, duration, description)
{
  estabelecimento_id = estabelecimento_id.join(",");
  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO products (name,estabelecimento_id,price,image,duration, description) VALUES(?,?,?,?,?,?)", [name, estabelecimento_id, price, image, duration, description], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

function edit_product_on_db(name, estabelecimento_id, price, image, duration, description)
{
  estabelecimento_id = estabelecimento_id.join(",");
  return new Promise((resolve, reject) =>
  {
    db.run(
      "UPDATE products SET estabelecimento_id = ?, price = ?, image = ?, duration = ?, description = ? WHERE name = ?",
      [estabelecimento_id, price, image, duration, description, name],
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

function get_product_with_estabelecimento_id(estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    //estabelecimento_id=3 we need to find it in a string stored in db like1,2,3
    db.all("SELECT * FROM products WHERE estabelecimento_id LIKE ?", ["%" + estabelecimento_id + "%"], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function change_product_estabelecimento(name, estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE products SET estabelecimento_id = ? WHERE name = ?", [estabelecimento_id, name], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });

}


/////USERS
function add_user(user, password, estabelecimento_id, admin, email, phone_number, full_name, image)
{
  estabelecimento_id = estabelecimento_id.join(",");
  return new Promise((resolve, reject) =>
  {
    db.run(
      "INSERT INTO users (user,password, estabelecimento_id, admin, email, phone_number, full_name, image) VALUES(?,?,?,?,?,?,?,?)",
      [user, password, estabelecimento_id, admin, email, phone_number, full_name, image],
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

function edit_user(user, estabelecimento_id, email, phone_number, full_name, image)
{
  estabelecimento_id = estabelecimento_id.join(",");
  return new Promise((resolve, reject) =>
  {
    db.run(
      "UPDATE users SET estabelecimento_id = ?, email = ?, phone_number = ?, full_name = ?, image = ? WHERE user = ?",
      [estabelecimento_id, email, phone_number, full_name, image, user],
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
    db.all("SELECT user, estabelecimento_id, admin, email, phone_number, full_name, image FROM users", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function get_users_by_name(user)
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

async function get_user_with_estabelecimento_id(estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    //estabelecimento_id=3 we need to find it in a string stored in db like1,2,3
    db.all("SELECT * FROM users WHERE estabelecimento_id LIKE ?", ["%" + estabelecimento_id + "%"], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}


function change_user_estabelecimento(user, estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE users SET estabelecimento_id = ? WHERE user = ?", [estabelecimento_id, user], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });

}

///////HORARIOS
function set_horario(estabelecimento_id, dia, comeco, fim)
{
  //dia -> 0->domingo 1->segunda 2->terca 3->quarta 4->quinta 5->sexta 6->sabado
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE horarios SET comeco = ?, fim = ? WHERE dia = ? AND estabelecimento_id = ?", [comeco, fim, dia, estabelecimento_id], (err) =>
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

function read_horario_on_specific_day(dia, estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM horarios WHERE dia = ? AND estabelecimento_id = ?", [dia, estabelecimento_id], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function set_bloqueio(estabelecimento_id, dia, mes, ano, comeco, fim, uuid, user, repeat, dia_da_semana)
{
  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO bloqueios (uuid, estabelecimento_id, user, comeco, fim, dia, mes, ano,repeat,dia_da_semana) VALUES(?,?,?,?,?,?,?,?,?,?)", [uuid, estabelecimento_id, user, comeco, fim, dia, mes, ano, repeat, dia_da_semana], (err) =>
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

function read_bloqueio_on_specific_day(dia, mes, ano, estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM bloqueios WHERE dia = ? AND mes = ? AND ano = ? AND estabelecimento_id = ?", [dia, mes, ano, estabelecimento_id], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function read_bloqueios_repeat(dia_da_semana, estabelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM bloqueios WHERE dia_da_semana = ? AND estabelecimento_id = ?", [dia_da_semana, estabelecimento_id], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });

}

async function edit_password(email, password)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE users SET password = ? WHERE email = ?", [password, email], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function get_users_by_email(email)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM users WHERE email=?", [email], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function change_user_permission(user, admin)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE users SET admin = ? WHERE user = ?", [admin, user], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function get_all_db_data()
{
  return new Promise((resolve, reject) =>
  {
    let responder = [];

    const usersPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM users", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          data.forEach((element) =>
          {
            delete element.password;
          });
          resolve(data);
        }
      });
    });

    const productsPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM products", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          resolve(data);
        }
      });
    });

    const marcacoesPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM marcacoes", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          resolve(data);
        }
      });
    });

    const horariosPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM horarios", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          resolve(data);
        }
      });
    });

    const bloqueiosPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM bloqueios", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          resolve(data);
        }
      });
    });

    const estabelecimentosPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM estabelecimentos", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          resolve(data);
        }
      });
    });

    const chat_logsPromise = new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM chat", function (err, data)
      {
        if (err)
        {
          reject(err);
        } else
        {
          resolve(data);
        }
      }
      );
    });


    Promise.all([usersPromise, productsPromise, marcacoesPromise, horariosPromise, bloqueiosPromise, estabelecimentosPromise, chat_logsPromise])
      .then(([users, products, marcacoes, horarios, bloqueios, estabelecimentos, chat_logs]) =>
      {
        responder.push({ "users": users });
        responder.push({ "products": products });
        responder.push({ "marcacoes": marcacoes });
        responder.push({ "horarios": horarios });
        responder.push({ "bloqueios": bloqueios });
        responder.push({ "estabelecimentos": estabelecimentos });
        responder.push({ "chat_logs": chat_logs });
        resolve(responder);
      })
      .catch(reject);
  });

}

async function save_message_on_chat(user, message)
{
  let date_ob = new Date();
  let date = date_ob.toISOString().split(".")[0];

  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO chat (user, message,date) VALUES(?,?,?)", [user, message.toString(), date], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });

}

async function get_chat_msg(message_number)
{
  if (message_number == '*')
  {
    return new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM chat", function (err, data)
      {
        if (err)
        {
          reject(err);
        }
        resolve(data);
      });
    });

  } else
  {
    return new Promise((resolve, reject) =>
    {
      db.all("SELECT * FROM chat ORDER BY date DESC LIMIT ?", [message_number], function (err, data)
      {
        if (err)
        {
          reject(err);
        }
        resolve(data);
      });
    });
  }

}


async function add_estabelecimento(name, address, phone, image, description)
{
  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO estabelecimentos (name, address, phone, image, description) VALUES(?,?,?,?,?)", [name, address, phone, image, description], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function get_estabelecimentos()
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM estabelecimentos", function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function get_estabelecimento_by_id(id)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM estabelecimentos WHERE id=?", [id], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });

}

async function remove_estabelecimento(id)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM estabelecimentos WHERE id = ?", [id], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}
async function add_horario_estabelecimento(name)
{

  return new Promise((resolve, reject) =>
  {
    db.get("SELECT seq from sqlite_sequence WHERE name='estabelecimentos'", function (err, data)
    {
      if (err)
      {
        console.log(err);
        reject(err);
      } else
      {
        let id = data.seq;
        for (var i = 0; i < 7; i++)
        {
          db.run(
            "INSERT INTO horarios (estabelecimento_id, dia, comeco, fim) VALUES(?,?,?,?)",
            [id, i, "00:00", "00:01"],
            (err) =>
            {
              if (err)
              {
                console.log(err);
                reject(err);
              }
              resolve();
            }
          );
        }
      }
    });
  });
}


async function edit_estabelecimento(id, name, address, phone, image, description)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE estabelecimentos SET name= ?, address = ?, phone = ?, image = ?, description = ? WHERE id = ?", [name, address, phone, image, description, id], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function remove_estabelecimento_from_horario(estebelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM horarios WHERE estabelecimento_id = ?", [estebelecimento_id], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function remove_estabelecimento_from_bloqueio(estebelecimento_id)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM bloqueios WHERE estabelecimento_id = ?", [estebelecimento_id], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

//skills

async function create_skill(user, product, rating)
{
  return new Promise((resolve, reject) =>
  {
    db.run("INSERT INTO skills (user,product,rating) VALUES(?,?,?)", [user, product, rating], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function edit_skill(user, product, rating)
{
  return new Promise((resolve, reject) =>
  {
    db.run("UPDATE skills SET rating = ? WHERE user = ? AND product = ?", [rating, user, product], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function delete_skill(user, product)
{
  return new Promise((resolve, reject) =>
  {
    db.run("DELETE FROM skills WHERE user = ? AND product = ?", [user, product], (err) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve();
    });
  });
}

async function get_skills_by_user(user)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM skills WHERE user=?", [user], function (err, data)
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function get_skills_by_product(product)
{
  return new Promise((resolve, reject) =>
  {
    db.all("SELECT * FROM skills WHERE product=?", [product], function (err, data)
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
  get_all_db_data,
  add_db,
  read_db,
  read_marcacoes_on_dia_da_semana,
  get_product_on_db,
  read_db_sms,
  create_new_product_on_db,
  search_for_user,
  read_db_products,
  delete_product_on_db,
  get_product_with_estabelecimento_id,
  change_product_estabelecimento,
  add_user,
  delete_user,
  read_db_users,
  get_users_by_name,
  get_user_with_estabelecimento_id,
  change_user_estabelecimento,
  edit_product_on_db,
  edit_user,
  delete_marcacao,
  edit_marcacao,
  read_marcacao_on_specific_day,
  read_marcacoes_from_estabelecimento,
  get_product_on_db_by_uuid,
  set_horario,
  get_horario,
  read_horario_on_specific_day,
  set_bloqueio,
  get_bloqueio,
  get_bloqueio_uuid,
  delete_bloqueio_on_db,
  read_bloqueio_on_specific_day,
  read_bloqueios_repeat,
  edit_password,
  get_users_by_email,
  change_user_permission,
  save_message_on_chat,
  get_chat_msg,
  add_estabelecimento,
  get_estabelecimentos,
  get_estabelecimento_by_id,
  remove_estabelecimento,
  edit_estabelecimento,
  add_horario_estabelecimento,
  remove_estabelecimento_from_horario,
  remove_estabelecimento_from_bloqueio,
  create_skill,
  edit_skill,
  delete_skill,
  get_skills_by_user,
  get_skills_by_product,
};
