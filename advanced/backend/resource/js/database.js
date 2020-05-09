var mysql      = require('mysql');
var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '1q2w3e4r',
  port : 3031,
  database : 'my_db'
});