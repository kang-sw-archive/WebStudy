const fs         = require('fs');
const bodyParser = require('body-parser');
const util       = require('./utils');

/** 
 * @callback contentGenerationDoneCallback
 * @param {string} content
 */
/**
 * @callback pageHandlerCallback
 * @param {ParsedUrlQuery} query
 * @param {contentGenerationDoneCallback} onFinish
 */
/**
 * @type {Map<string, pageHandlerCallback>}
 */
module.exports.pageHandler = {};

module.exports.express            = require('express');
module.exports.app                = module.exports.express();
module.exports.users              = {};
module.exports.numVisit           = {};
module.exports.addressFromRequest = (request) => { return request.headers['x-forwarded-for'] || request.connection.remoteAddress; };

var app = module.exports.app;
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : true}))

module.exports.displayUrlContent = displayUrlContent;
function displayUrlContent(response, query, contentFilePath) {
  let title   = query.id;
  let content = new String();
  let path    = 'public/html/home.html';

  // If given file exists, simply load it.
  fs.exists(contentFilePath, function(exists) {
    if (exists) {
      fs.readFile(contentFilePath, function(err, Buffer) {
        if (err)
          throw err;
        response.writeHead(200);
        response.end(Buffer);
      });
    }
    else {
      if (query.id != undefined) {
        path = 'public/html/' + query.id + '.html';
      }
      else {
        title = "home";
      }

      if (module.exports.pageHandler[query.id]) {
        module.exports.pageHandler[query.id](query, function(content) {
          showContent(response, title, content);
        });
      }
      else {
        fs.readFile(path, 'utf8', function(err, data) {
          if (err) {
            console.log(err);
            return;
          }

          showContent(response, title, data);
        });
      }
    }
  });
}

const top = fs.readFileSync('public/html/top.html', 'utf8');
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
        <div style="margin:10pt; padding: 10pt; margin-top:30pt; border-top: solid 1pt; color:gray; font-size:xx-small">
          Total Visitors: ${module.exports.numVisit}<br>
          <a href=https://github.com/kang-sw/WebStudy/tree/master/forum>Github: kang-sw</a>
        </div>
    </body>

    </html>`;

  response.writeHead(200);
  response.end(template);
}

module.exports.ipToBin =
  function(ipStr) {
  var s = new String(ipStr);
  s     = s.slice(s.lastIndexOf(':') + 1);

  var shift  = 0;
  var result = 0;
  s.split('.').forEach(
    function(str) {
      result += Math.abs(new Number(str) << shift);
      shift += 8;
    });

  return result;
};

module.exports.binToIp =
  function(ipBin) {
  var shift  = 0;
  var result = [];

  for (var i = 0; i < 4; ++i) {
    var value = (ipBin & (0xff << shift)) >> shift;
    result.push(`${value}`);
    shift += 8;
  }

  return result.join('.');
}