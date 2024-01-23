const accountSid = "AC84c432dc9a2f75f287fe5630f3745303";
const authToken = "95eb49525dde3d75389428d509f62cc9";
const client = require("twilio")(accountSid, authToken);
var db = require("./db.js");

function send_sms(body, to) {
    console.log("SMS enviado para " + to + " com o texto: " + body);
    //   client.messages
    //     .create({
    //       body: body,
    //       from: "+19255237185",
    //       to: to,
    //     })
    //     .then((message) => console.log(message.sid));
}

async function daily_sms() {
    var date = new Date();
    var marcacoes = await db.read_db_sms();
    var i = 0;
    while (marcacoes[i] != undefined) {
        if (marcacoes[i].dia == date.getDate() && marcacoes[i].mes == date.getMonth() + 1 && marcacoes[i].ano == date.getFullYear()) {
            send_sms("Não se esqueça da sua marcação hoje pelas " + marcacoes[i].hora + ":" + +marcacoes[i].minuto, marcacoes[i].user_number);
        }
        i++;
    }
}

module.exports = { send_sms, daily_sms };
