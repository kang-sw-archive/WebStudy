const mysql = require('mysql');
const db    = mysql.createConnection(
  {
    host : 'localhost',
    user : 'root',
    password : '123574',
    port : 3306,
    database : 'forum'
  });

module.exports = db;
