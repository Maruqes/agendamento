const { query } = require("express");
const { containsSQLCode } = require("./server.js");
var db = require("./db.js");
const crypto = require("crypto");
const estabelecimentos = require("./estabelecimentos.js");

async function set_horario(estabelecimento_id, dia, comeco, fim)
{
    if (dia == undefined || comeco == undefined || fim == undefined)
    {
        console.log("undefined");
        return 400;
    }

    if (dia < 0 || dia > 6 || comeco < 0 || comeco > 24 || fim < 0 || fim > 24)
    {
        console.log("invalid dia/comeco/fim");
        return 400;
    }

    if (comeco.length != 5 || fim.length != 5)
    {
        return 400;
    }
    if (await estabelecimentos.does_estabelecimento_exist(estabelecimento_id) == false)
    {
        console.log("estabelecimento nao existe")
        return 703;
    }

    var comeco_hora = parseInt(comeco.split(":")[0]);
    var comeco_minuto = parseInt(comeco.split(":")[1]);
    var fim_hora = parseInt(fim.split(":")[0]);
    var fim_minuto = parseInt(fim.split(":")[1]);
    if (comeco_hora * 60 + comeco_minuto > fim_hora * 60 + fim_minuto)
    {
        return 400;
    }
    console.log(`[+] SETADO NOVO HORARIO dia = ${dia} comeco = ${comeco} fim = ${fim} no establecimento ${estabelecimento_id}`);
    db.set_horario(estabelecimento_id, dia, comeco, fim);
    return 200;
}

async function get_horario(res)
{
    db.get_horario()
        .then((result) =>
        {
            res.send(result);
        })
        .catch((err) =>
        {
            console.error(err);
            res.sendStatus(500);
        });
}

async function check_if_bloqueio_fit(estabelecimento_id, dia, mes, ano, comeco_hora, comeco_minuto, fim_hora, fim_minuto, user, repeat, dia_da_semana)
{
    if (repeat == 0)
    {
        const marcacoes_exist = await db.read_marcacao_on_specific_day(dia, mes, ano, estabelecimento_id); // ver caso seja repeat
        let comeco_do_bloqueio = comeco_hora * 60 + comeco_minuto;
        let fim_do_bloqueio = fim_hora * 60 + fim_minuto;
        for (let i = 0; i < marcacoes_exist.length; i++)
        {
            if (marcacoes_exist[i].user != user)
            {
                if (user != '*')
                    continue;
            }
            let comeco_da_marcacao_existente = marcacoes_exist[i].hora * 60 + marcacoes_exist[i].minuto;
            let fim_da_marcacao_existente = comeco_da_marcacao_existente + marcacoes_exist[i].duration;
            if (comeco_do_bloqueio >= comeco_da_marcacao_existente && comeco_do_bloqueio < fim_da_marcacao_existente ||
                fim_do_bloqueio > comeco_da_marcacao_existente && fim_do_bloqueio <= fim_da_marcacao_existente ||
                comeco_do_bloqueio <= comeco_da_marcacao_existente && fim_do_bloqueio >= fim_da_marcacao_existente ||
                comeco_do_bloqueio >= comeco_da_marcacao_existente && fim_do_bloqueio <= fim_da_marcacao_existente)
            {
                console.log("ja existe marcacao nao foi possivel marcar bloqueio");
                return 702;
            }
        }
    } else
    {
        const marcacoes_exist = await db.read_marcacoes_on_dia_da_semana(dia_da_semana, estabelecimento_id, user); // ver caso seja repeat
        let comeco_do_bloqueio = comeco_hora * 60 + comeco_minuto;
        let fim_do_bloqueio = fim_hora * 60 + fim_minuto;
        for (let i = 0; i < marcacoes_exist.length; i++)
        {
            //continue on marcacoes that already passed the day of the bloqueio



            if (marcacoes_exist[i].user != user)
            {
                if (user != '*')
                    continue;
            }
            let comeco_da_marcacao_existente = marcacoes_exist[i].hora * 60 + marcacoes_exist[i].minuto;
            let fim_da_marcacao_existente = comeco_da_marcacao_existente + marcacoes_exist[i].duration;
            if (comeco_do_bloqueio >= comeco_da_marcacao_existente && comeco_do_bloqueio < fim_da_marcacao_existente ||
                fim_do_bloqueio > comeco_da_marcacao_existente && fim_do_bloqueio <= fim_da_marcacao_existente ||
                comeco_do_bloqueio <= comeco_da_marcacao_existente && fim_do_bloqueio >= fim_da_marcacao_existente ||
                comeco_do_bloqueio >= comeco_da_marcacao_existente && fim_do_bloqueio <= fim_da_marcacao_existente)
            {
                console.log("ja existe marcacao nao foi possivel marcar bloqueio repeat");
                return 702;
            }
        }
    }
}


async function set_bloqueio(estabelecimento_id, dia, mes, ano, comeco, fim, user, repeat)
{
    //dia -> xx/xx/xxxx
    if (dia == undefined || mes == undefined || ano == undefined || comeco == undefined || fim == undefined || user == undefined || repeat == undefined)
    {
        return 400;
    }

    if (user != '*')
    {
        const existingUser = await db.search_for_user(user);

        if (!existingUser[0] || existingUser[0].user != user)
        {
            console.log(`User ${user} does not exist`);
            return 701;
        }
    }


    if (dia < 1 || dia > 31 || mes < 1 || mes > 12)
    {
        return 400;
    }

    if (comeco.length != 5 || fim.length != 5)
    {
        return 400;
    }

    if (await estabelecimentos.does_estabelecimento_exist(estabelecimento_id) == false)
    {
        return 703;
    }

    if (repeat != 0 && repeat != 1)
    {
        return 704;
    }



    var comeco_hora = parseInt(comeco.split(":")[0]);
    var comeco_minuto = parseInt(comeco.split(":")[1]);
    var fim_hora = parseInt(fim.split(":")[0]);
    var fim_minuto = parseInt(fim.split(":")[1]);

    if (comeco_hora * 60 + comeco_minuto > fim_hora * 60 + fim_minuto)
    {
        return 400;
    }

    var date = new Date(Date.UTC(ano, mes - 1, dia));
    const day1 = date.getDay();
    console.log("dia-> " + day1);

    if (await check_if_bloqueio_fit(estabelecimento_id, dia, mes, ano, comeco_hora, comeco_minuto, fim_hora, fim_minuto, user, repeat, day1) == 702)
    {
        return 702;
    }




    console.log(`[+] SETADO NOVO BLOQUEIO dia = ${dia} comeco = ${comeco} fim = ${fim} user = ${user}`);
    let uuid = crypto.randomUUID();
    db.set_bloqueio(estabelecimento_id, dia, mes, ano, comeco, fim, uuid, user, repeat, day1);
    return 200;

}

async function get_bloqueio(res)
{
    db.get_bloqueio()
        .then((result) =>
        {
            res.send(result);
        })
        .catch((err) =>
        {
            console.error(err);
            res.sendStatus(500);
        });
}

async function delete_bloqueio(uuid)
{
    if (uuid == undefined || uuid == "")
    {
        console.log("uuid invalido");
        return 701;
    }
    const existingBloqueio = await db.get_bloqueio_uuid(uuid);

    if (!existingBloqueio[0] || existingBloqueio[0].uuid != uuid)
    {
        console.log(`Bloqueio ${uuid} does not exist`);
        return 703;
    }

    try
    {
        await db.delete_bloqueio_on_db(uuid);
        console.log(`[-] Bloqueio ${uuid} removed`);
    } catch (err)
    {
        console.log(`Error removing bloqueio ${uuid}: ${err}`);
        console.error(`Error removing bloqueio ${uuid}: ${err}`);
        return 500
    }
    return 200;

}

module.exports = { set_horario, get_horario, set_bloqueio, get_bloqueio, delete_bloqueio };