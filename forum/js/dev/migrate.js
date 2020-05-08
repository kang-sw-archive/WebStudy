/**
 * @file migrate.js
 * @summary data migration process for instant use
 */
const fs    = require('fs');
const mysql = require('mysql');
const cm    = require('../common');

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
If password is null, author info will be used to identify signed user. If author is null, that post is removed one.  If title is null, it is reply.
*/

// Post has ...
/* 
    {
        "date": "2020-5-8 11:05:05",
        "title": "qwew",
        "author": "DD",
        "pw": "qqq",
        "content": "<p>dafe</p>",
        "replies": [
            {
                "date": "2020-5-8 11:05:08",
                "author": "DD",
                "pw": "qqq",
                "content": "bca",
                "address": "::ffff:172.30.1.254"
            },
            {
                "date": "2020-5-8 11:05:10",
                "author": "DD",
                "pw": "qqq",
                "content": "fferf",
                "address": "::ffff:172.30.1.254"
            }
        ],
        "address": "::ffff:172.30.1.254",
        "view": 2
    }
*/
// Firstly read all posts from .json
var archive     = fs.readFileSync('archive/posts.json');
var arch_json   = JSON.parse(archive);
var sha256      = require('sha256');
var post_number = 0;

arch_json.forEach(function(post) {
  ++post_number;
  var datapairs =
    [ [ 'post_number', post_number ],
      [ 'ipaddr', post.address ? cm.ipToBin(post.address) : '0' ],
      [ 'issued', post.date ],
      [ 'author_if_valid', (post.author ? post.author : "annonymous").substr(0, 16) ],
      [ 'pw_if_annonymous', sha256(post.password ? post.password : "undefined") ],
      [ 'content', (post.content ? post.content : " ") ],
      [ 'title', (post.title ? post.title : "undefined").substr(0, 80) ] ];

  var columns = [], values = [];
  datapairs.forEach(function(pair) {
    columns.push(pair[0]);
    values.push(`'${new String(pair[1]).replaceAll("'", '&apos;')}'`);
  });

  var inst = {postnum : post_number};

  db.query(
    `INSERT INTO posts(${columns.join()}) VALUES(${values.join()})`,
    function(err, result, field) {
      if (err)
        throw err;

      console.log("Insert post ", result.insertId, "postnum ", this[0][1]);
      if (post.replies) {
        var postid = result.insertId;
        post.replies.forEach(function(reply) {
          var postnum = this[0][1];
          var datapairs2 =
            [ [ 'post_number', postnum ],
              [ 'parent_id', postid ],
              [ 'ipaddr', reply.address ? cm.ipToBin(reply.address) : '0' ],
              [ 'issued', reply.date ],
              [ 'author_if_valid', (reply.author ? reply.author : "annonymous").substr(0, 16) ],
              [ 'pw_if_annonymous', sha256(reply.password ? reply.password : "undefined") ],
              [ 'content', reply.content ? reply.content : " " ] ];
          var columns = [], values = [];
          datapairs2.forEach(function(pair) {
            columns.push(pair[0]);
            values.push(`'${new String(pair[1]).replaceAll("'", '&apos;')}'`);
          });

          db.query(
            `INSERT INTO posts(${columns.join()}) VALUES(${values.join()})`,
            function(err, result, field) {
              if (err)
                throw err;

              console.log("Insert reply ", result.insertId, " --> ", this[0][1]);
            }.bind(datapairs2));
        }.bind(this));
      }
    }.bind(datapairs));
});