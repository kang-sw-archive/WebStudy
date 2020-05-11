var mysql      = require('mysql');
var log        = require('./timelog');
var fs         = require('fs');
var connection = mysql.createConnection(
  JSON.parse(fs.readFileSync('.connection.json')));
module.exports = connection;

log("Starting connection to DB ...");
connection.connect((err) => {
  if (err)
    throw err;
  log("DB Connected");
});