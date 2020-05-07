//! @todo. Implement Posting
//! @todo. Implement Post View
require('./forum');

const ut   = require('./utils');
const cm   = require('./common');
const http = require('http');
const fs   = require('fs');
const url  = require('url');
const qs   = require('querystring');
const top  = fs.readFileSync('html/top.html', 'utf8');

console.log("loading main module");

let app = http.createServer(function(request, response) {
  let _url  = request.url;
  let query = url.parse(_url, true).query;
  let path  = 'html/home.html';
  let title = query.id;
  var content;
  let address = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

  if (request.method == 'POST') {
    let body = '';
    console.log("Receiving post " + query.postid);

    request.on('data', function(data) {
      body += data;
      if (body.length > 1e6)
        request.connection.destroy();
    });

    request.on('end', function() {
      var post     = qs.parse(body);
      var url_post = query.postid;

      if (cm.postHandler[url_post]) {
        cm.postHandler[url_post](query, post, address);
      }
    });
  }

  {
    // Tries read content by url
    try {
      content = fs.readFileSync(_url.substr(1))
      response.writeHead(200);
      response.end(content);
    }
    catch (err) {
      console.log("Accessing " + _url + " ... from  " + address);

      if (_url != '/') {
        path = 'html/' + query.id + '.html';
      }
      else {
        title = "home";
      }

      try {
        if (cm.pageHandler[query.id]) {
          content = cm.pageHandler[query.id](query);
        }
        else {
          content = fs.readFileSync(path, 'utf8');
        }
      }
      catch (err) {
        console.log(err);
        content = 'ERROR 404';
      }
    }

    showContent(response, title, content);
  }
});

// Start listening
app.listen(3000);

/////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////
function showContent(response, title, content) {
  let template = /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="style/general.css">
        <title>${title}</title>
    </head>

    <body>
        ${top}
        <div id="content">
          ${content}
        </div>
    </body>

    </html>`;

  response.writeHead(200);
  response.end(template);
}