/**
 * @file migrate.js
 * @summary data migration process for instant use
 */
const fs    = require('fs');
const mysql = require('mysql');

const db = mysql.createConnection(
  {
    host : 'localhost',
    user : 'root',
    password : '123574',
    port : 3306,
    database : 'forum'
  });

db.connect();

/* SQL table initialization ... verify this!
If password is null, author info will be used to identify signed user.
If author is null, that post is removed one.

CREATE TABLE posts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  parent_id BIGINT DEFAULT NULL,
  post_number INT NOT NULL,
  ipaddr BINARY(16) NOT NULL,
  issued DATETIME NOT NULL,
  author VARCHAR(24) DEFAULT NULL,
  pw_if_annonymous CHAR(32) DEFAULT NULL,
  content MEDIUMTEXT NOT NULL,
  PRIMARY KEY(id)
);
*/

// Firstly read all posts from .json
var archive   = fs.readFileSync('archive/posts.json');
var arch_json = JSON.parse(archive);

arch_json.forEach(function(post) {

});
db.end();