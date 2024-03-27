var db = require("./db.js");
var auth = require("./auth.js");
var server = require("./server.js");
const estabelecimentos = require("./estabelecimentos.js");

async function create_new_skill(body)
{
    const { user, product, rating } = body;

    if (rating < 0 || rating > 10)
        return 703;

    let check_user = await db.search_for_user(user);
    if (check_user[0] == undefined)
    {
        return 701;
    }

    let check_product = await db.get_product_on_db(product);

    if (check_product[0] == undefined)
    {
        return 702;
    }

    return db.create_skill(user, product, rating).then(() =>
    {
        console.log("[+] Skill created");
        return 200;
    }).catch((err) =>
    {
        console.log("Error creating skill: " + err);
        return 500;
    });
}

async function edit_skill(body)
{
    const { user, product, rating } = body;

    if (rating < 0 || rating > 10)
        return 703;

    let check_user = await db.search_for_user(user);
    if (check_user[0] == undefined)
    {
        return 701;
    }

    let check_product = await db.get_product_on_db(product);

    if (check_product[0] == undefined)
    {
        return 702;
    }

    return db.edit_skill(user, product, rating).then(() =>
    {
        console.log("[i] Skill edited");
        return 200;
    }).catch((err) =>
    {
        console.log("Error editing skill: " + err);
        return 500;
    });
}


async function delete_skill(body)
{
    const { user, product } = body;

    let check_user = await db.search_for_user(user);
    if (check_user == null || check_user[0].user != user)
    {
        return 701;
    }

    let check_product = await db.get_product_on_db(product);

    if (check_product[0] == undefined)
    {
        return 702;
    }

    return db.delete_skill(user, product).then(() =>
    {
        console.log("[-] Skill deleted");
        return 200;
    }).catch((err) =>
    {
        console.log("Error deleting skill: " + err);
        return 500;
    });
}

async function get_skill_by_user(user, res)
{
    let check_user = await db.search_for_user(user);
    if (check_user[0] == undefined)
    {
        res.send("User not found");
        return 701;
    }

    let skills = await db.get_skills_by_user(user);

    res.send(skills);
    return;
}

async function get_skill_by_product(product, res)
{

    let check_product = await db.get_product_on_db(product);

    if (check_product[0] == undefined)
    {
        res.send("Product not found");
        return 702;
    }

    let skills = await db.get_skills_by_product(product);

    res.send(skills);
    return;
}


module.exports = { create_new_skill, edit_skill, delete_skill, get_skill_by_user, get_skill_by_product };