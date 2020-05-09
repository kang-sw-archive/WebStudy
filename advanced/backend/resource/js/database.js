var mysql      = require('mysql');
var fs         = require('fs');
var connection = mysql.createConnection(
    JSON.parse(fs.readFileSync('.connection.json')));