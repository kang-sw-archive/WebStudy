//! @todo. Implement Posting
//! @todo. Implement Post View
let http        = require('http');
let fs          = require('fs');
let url         = require('url');
let qs          = require('querystring');
let posts       = [];
let top         = fs.readFileSync('html/top.html', 'utf8');
var postHandler = {};
var users       = [];

String.prototype.replaceAll = function(org, dest) {
  return this.split(org).join(dest);
}

if (true) {
  let postsArchive = fs.readFileSync('archive/posts.json');
  posts            = JSON.parse(postsArchive);
  // console.log(posts);
  console.log(toRawText("<>''L>"));
}

let app = http.createServer(function(request, response) {
  let _url  = request.url;
  let query = url.parse(_url, true).query;
  let path  = 'html/home.html';
  let title = query.id;
  var content;

  if (request.method == 'POST') {
    let body = '';

    request.on('data', function(data) {
      body += data;
      if (body.length > 1e6)
        request.connection.destroy();
    });

    request.on('end', function() {
      var post     = qs.parse(body);
      var url_post = query.postid;
      console.log("Receiving post " + query.postid);

      if (postHandler[url_post]) {
        postHandler[url_post](
          query, post,
          request.headers['x-forwarded-for'] || request.connection.remoteAddress);
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
      console.log("Accessing " + _url + "...");

      if (_url != '/') {
        path = 'html/' + query.id + '.html';
      }
      else {
        title = "home";
      }

      try {
        if (query.id == 'forum') {
          content = buildForumList(query);
        }
        else {
          content = fs.readFileSync(path, 'utf8');
        }
      }
      catch (err) {
        content = 'ERROR 404';
      }
    }

    showContent(response, title, content);
  }
});

// Assign post events
postHandler['add-post'] = function(query, post, address) {
  console.log("new-post post handler called from " + address);

  // Protect attack from same ip
  var time     = users[address];
  var timediff = new Number(Date.now()) - time;
  if (time && timediff < 5000) {
    console.log("Too fast post blocked from" + address + "timespan = " + timediff);
    return;
  }
  users[address] = new Number(Date.now());

  var newpost =
    {
      'date' : new Date(Date.now()).toLocaleString(),
      'title' : toRawText(post.title).substr(0, 255),
      'author' : toRawText(post.userid).substr(0, 24),
      'pw' : post.password,
      'content' : toRawText(post.content),
      'replies' : []
    };
  console.log(newpost);
  posts.push(newpost);

  fs.writeFile(
    'archive/posts.json',
    JSON.stringify(posts), (err) => {posts});
};

postHandler['new-reply'] = function(query, post, address) {
  var newreply = {
    'date' : new Date(Date.now()).toLocaleString(),
    'author' : toRawText(post.userid).substr(0, 24),
    'pw' : post.password,
    'content' : toRawText(post.content)
  };
  console.log(newreply);
  console.log("   from " + address);
  findForumPost(query.index).replies.push(newreply);

  fs.writeFile(
    'archive/posts.json',
    JSON.stringify(posts), (err) => {posts});
};

// Start listening
app.listen(3000);

///////////////////////////
///////////////////////////
// FUNCTIONS             //
///////////////////////////
///////////////////////////
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

function findForumPost(index, bAddView = false) {
  if (bAddView) {
    if (posts[index].view == undefined)
      posts[index].view = 0;
    ++posts[index].view;
  }
  return posts[index];
}

function buildForumList(query) {
  let content            = '';
  const postsPerPage     = 50;
  const pageDisplayRange = 7;
  const pageidx          = query.page;
  const lastidx          = posts.length - 1;
  const page             = pageidx - 1;
  const postidx          = query.index;

  content += /*html*/ `
    <div id="forum_contents"> 
      <div id="forum_text">
        <a href="/?id=new-post&page=${query.page}" 
         id="new-post">
          New Post
        </a>
        <span id="forum">FORUM</span>
      </div>`;

  // Build forum posts list
  for (let i = 0; i < postsPerPage; ++i) {
    const index = lastidx - page * postsPerPage - i;
    if (index < 0)
      break;

    const post = findForumPost(index);
    let date   = new Date(post.date);

    content += /*html*/ `
        <div class="forum_post">
          <span class="forum_post_index"> ${index + 1}</span>
          <a class="forum_post_title"
            href="/?id=forum&page=${pageidx}&index=${index}"
            onclick="sessionStorage.YScroll = document.scrollingElement.scrollTop;">
            ${post.title}
          </a>
          <span class="forum_post_author"> by ${post.author}
          </span>`

    if (post.replies.length > 0) {
      content += /*html*/ `
            <span class="forum_post_replies">
            [${post.replies.length}]</span>`
    }

    content += /*html */ `
            <span class="forum_post_date">
             ${post.view} views ... ${date.toLocaleString()}</span>
        </div>`

    if (postidx && index == postidx) {
      let post = findForumPost(postidx, true);
      content += /*html*/ ` <section id="f_post">
        <h3 id="f_post_title"> ${post.title} </h3>
        <p id="f_post_content"> ${post.content} </p>
        <span id="f_post_reply_marker">Replies</span>
        <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
        <script>
          document.scrollingElement.scrollTop = sessionStorage.YScroll;
		      var offset = $("#f_post_title").offset();
          $('html, body').animate({scrollTop : offset.top}, 400); 
        </script>
        <section id="f_post_replies">`;

      // Build post replies
      let replies = post.replies;
      for (let index = 0; index < replies.length; index++) {
        const reply = replies[index];
        content += /*html*/ `
        <div class="f_post_reply">
          <span class="f_post_reply_name">${reply.author}</span> 
          <span class="f_post_reply_content">${reply.content}</span>
        </div>`;
      }

      // End of reply section
      content += '</section>';

      // Comment append section
      content += fs.readFileSync('html/reply.html', 'utf8');

      // End of current posting section
      content += '</section>';
    }
  }

  // Add forum page indicator
  content += '<div class="forum_page_idx">';
  for (let index = Math.max(1, pageidx - pageDisplayRange),
           end   = Math.min(posts.length / postsPerPage + 1,
                          pageidx + pageDisplayRange + 1);
       index < end; ++index) {
    if (index == pageidx) {
      content += `
        <span class="forum_page_idx_current">[${index}]</span>`;
    }
    else {
      content += /*html*/ `
        <a  class="forum_page_idx_instance"
            href="/?id=forum&page=${index}">
        [${index}]
        </a>`;
    }
  }
  content += '</div>';

  // Close
  content += '</div>';
  return content;
}

function toRawText(str) {
  try {
    str = str.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("'", "&apos;").replaceAll('"', "&quot;").replaceAll("\n", "<br>");
  }
  catch (err) {
    console.log("Burnt: " + str);
    return "invalid";
  }
  return new String(str);
}