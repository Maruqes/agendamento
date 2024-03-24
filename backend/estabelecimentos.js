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
        await db.remove_estabelecimento_from_horario(id)
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

module.exports = { create_new_estabelecimento, delete_estabelecimento, edit_estabelecimento, does_estabelecimento_exist };