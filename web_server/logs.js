const fs = require("fs");
const util = require("util");
const fileLog = fs.createWriteStream(__dirname + "/server.log", { flags: "w" });
const ErrorLog = fs.createWriteStream(__dirname + "/Error.log", { flags: "w" });
const logOutput = process.stdout;

// the flag 'a' will update the stream log at every launch
console.log = (e) =>
{
  let date_time = new Date();
  var date =
    date_time.getHours() +
    ":" +
    date_time.getMinutes() +
    ":" +
    date_time.getSeconds() +
    " " +
    date_time.getDate() +
    "-" +
    (date_time.getMonth() + 1) +
    "-" +
    date_time.getFullYear() +
    " -> ";
  fileLog.write(date + util.format(e) + "\n");
  logOutput.write(date + util.format(e) + "\n");
};

console.error = (e) =>
{
  let date_time = new Date();
  var date =
    date_time.getHours() +
    ":" +
    date_time.getMinutes() +
    ":" +
    date_time.getSeconds() +
    " " +
    date_time.getDate() +
    "-" +
    (date_time.getMonth() + 1) +
    "-" +
    date_time.getFullYear() +
    " -> ";
  ErrorLog.write(date + util.format(e) + "\n");
};

module.exports = { console };
