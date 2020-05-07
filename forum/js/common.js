let fs           = require('fs');
const bodyParser = require('body-parser');

module.exports.express            = require('express');
module.exports.app                = module.exports.express();
module.exports.pageHandler        = {};
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
  if (fs.existsSync(contentFilePath)) {
    content = fs.readFileSync(contentFilePath);
    response.writeHead(200);
    response.end(content);
  }
  else {

    if (query.id != undefined) {
      path = 'public/html/' + query.id + '.html';
    }
    else {
      title = "home";
    }

    try {
      if (module.exports.pageHandler[query.id]) {
        content = module.exports.pageHandler[query.id](query);
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
