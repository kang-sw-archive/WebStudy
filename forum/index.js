//! @todo. Implement Posting
//! @todo. Implement Post View

const ut      = require('./js/utils');
const cm      = require('./js/common');
const http    = require('http');
const fs      = require('fs');
const url     = require('url');
const qs      = require('querystring');
const app     = cm.app;
const express = cm.express;

// Module sequential loading begins here
require('./js/forum');

// Open server
app.listen(3000, function() { console.log("listen() finished") });
app.use(express.static('public'));

// Visitor counter
var IPs     = {};
cm.numVisit = JSON.parse(fs.readFileSync('archive/records.json'));

if (!cm.numVisit) {
  cm.numVisit = 0;
}

app.get('/', function(request, response) {
  let _url    = request.url;
  let query   = url.parse(_url, true).query;
  let path    = 'html/home.html';
  let title   = query.id;
  let address = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  console.log("Accessing " + _url + " ... from  " + address);

  // Count number of visitors
  if (IPs[address] === undefined) {
    IPs[address] = address;
    ++cm.numVisit;
    console.log("New visitor " + address + " Now total visit: " + cm.numVisit);
    fs.writeFile(
      'archive/records.json',
      JSON.stringify(cm.numVisit),
      (err) => { if(err) console.log(err) });
  }

  // Tries read content by url
  const contentFilePath = _url.substr(1);
  cm.displayUrlContent(response, query, contentFilePath);
});

// let app = http.createServer(function(request, response) {
//   let _url    = request.url;
//   let query   = url.parse(_url, true).query;
//   let address = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

//   if (request.method == 'POST') {
//     let body = '';
//     console.log("Receiving post " + query.postid);

//     request.on('data', function(data) {
//       body += data;
//       if (body.length > 1e6)
//         request.connection.destroy();
//     });

//     request.on('end', function() {
//       var post     = qs.parse(body);
//       var url_post = query.postid;

//       // Only when postHandler exists...
//       if (cm.postHandler[url_post])
//         cm.postHandler[url_post](query, post, address);
//     });
//   }
// });

// Start listening
// app.listen(3000);

/////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////