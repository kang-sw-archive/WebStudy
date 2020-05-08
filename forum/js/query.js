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
console.log(db.state);
db.connect();
console.log(db.state);

console.log("Database connected.");
