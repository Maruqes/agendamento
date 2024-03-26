const { query } = require("express");
var db = require("./db.js");
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

async function does_estabelecimento_exist(id)
{
    if (id == '*')
    {
        return true;
    }
    const existingEstabelecimento = await db.get_estabelecimento_by_id(id);
    if (!existingEstabelecimento[0] || existingEstabelecimento[0].id != id || existingEstabelecimento[0] == undefined)
    {
        console.log(`Estabelecimento ${id} does not exist`)
        return false;
    }
    return true;

}

async function is_user_on_estabelecimento(user, estabelecimento_id)
{
    if (user == "*")
    {
        return true;
    }

    const db_user = await db.get_users_by_name(user);
    if (!db_user[0] || db_user[0].user != user || db_user[0] == undefined)
    {
        console.log(`User ${user} does not exist`)
        return false;
    }

    // Check if user is on estabelecimento db_users.estabelecimento_id -> 1,2,3
    const user_estabelecimento = db_user[0].estabelecimento_id.split(",");
    for (var i = 0; i < user_estabelecimento.length; i++)
    {
        if (user_estabelecimento[i] == estabelecimento_id)
        {
            return true;
        }
    }


    return false;
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
        await db.add_horario_estabelecimento(name);
        console.log(`[+] Estabelecimento ${name} added`);
    } catch (err)
    {
        console.log(`Error adding estabelecimento ${name}: ${err}`);
        console.error(`Error adding estabelecimento ${name}: ${err}`);
        return 500;
    }
    return 200;

}

async function can_remove_estabelecimento(id)
{
    const existingEstabelecimento = await db.get_estabelecimento_by_id(id);
    if (!existingEstabelecimento[0] || existingEstabelecimento[0].id != id || existingEstabelecimento[0] == undefined)
    {
        console.log(`Estabelecimento ${id} does not exist`)
        return false;
    }

    const existingUserEstabelecimento = await db.read_marcacoes_from_estabelecimento(id);
    if (existingUserEstabelecimento[0] != undefined)
    {
        console.log(`Estabelecimento ${id} has users`)
        return false;
    }

    const cur_date = new Date();

    for (var i = 0; i < existingUserEstabelecimento.length; i++)
    {
        if (existingUserEstabelecimento[i].ano > cur_date.getFullYear() ||
            (existingUserEstabelecimento[i].ano == cur_date.getFullYear() && existingUserEstabelecimento[i].mes > cur_date.getMonth()) ||
            (existingUserEstabelecimento[i].ano == cur_date.getFullYear() && existingUserEstabelecimento[i].mes == cur_date.getMonth() && existingUserEstabelecimento[i].dia > cur_date.getDate()))
        {
            console.log(`Estabelecimento ${id} has future marcacoes`)
            return false;
        }
    }

    return true;

}

async function change_user_estabelecimento(estabelecimento_id)
{
    const db_user = await db.get_user_with_estabelecimento_id(estabelecimento_id);

    //get all estabelecimento_id from user 1,2,3 and remove estabelecimento_id from user

    for (var i = 0; i < db_user.length; i++)
    {
        var new_estabelecimento_id = "";
        const user_estabelecimento = db_user[i].estabelecimento_id.split(",");
        for (var j = 0; j < user_estabelecimento.length; j++)
        {
            if (user_estabelecimento[j] != estabelecimento_id)
            {
                new_estabelecimento_id += user_estabelecimento[j] + ",";
            }
        }
        new_estabelecimento_id = new_estabelecimento_id.slice(0, -1);
        await db.change_user_estabelecimento(db_user[i].user, new_estabelecimento_id);
    }

    return 704;
}

async function change_product_estabelecimento(estabelecimento_id)
{
    const db_product = await db.get_product_with_estabelecimento_id(estabelecimento_id);

    //get all estabelecimento_id from product 1,2,3 and remove estabelecimento_id from product
    for (var i = 0; i < db_product.length; i++)
    {
        var new_estabelecimento_id = "";
        const product_estabelecimento = db_product[i].estabelecimento_id.split(",");
        for (var j = 0; j < product_estabelecimento.length; j++)
        {
            if (product_estabelecimento[j] != estabelecimento_id)
            {
                new_estabelecimento_id += product_estabelecimento[j] + ",";
            }
        }
        new_estabelecimento_id = new_estabelecimento_id.slice(0, -1);
        await db.change_product_estabelecimento(db_product[i].name, new_estabelecimento_id);
    }

    return 704;

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

    if (!await can_remove_estabelecimento(id))
    {
        console.log(`Estabelecimento ${id} cannot be removed`);
        return 704;
    }

    try
    {
        await db.remove_estabelecimento_from_horario(id)
        await db.remove_estabelecimento_from_bloqueio(id)
        await change_user_estabelecimento(id);
        await change_product_estabelecimento(id);
        await db.remove_estabelecimento(id);
        console.log(`[-] Estabelecimento ${id} removed`);
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
        console.log(`[i] Estabelecimento ${id} edited`);
    } catch (err)
    {
        console.log(`Error editing estabelecimento ${id}: ${err}`);
        console.error(`Error editing estabelecimento ${id}: ${err}`);
        return 500;
    }
    return 200;

}

module.exports = { create_new_estabelecimento, is_user_on_estabelecimento, delete_estabelecimento, edit_estabelecimento, does_estabelecimento_exist };