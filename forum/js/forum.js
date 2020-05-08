const fs         = require('fs');
const db         = require('./query');
const cm         = require('./common');
const util       = require('./utils');
const app        = cm.app;
const bodyParser = require('body-parser');

let xss = require('xss');

let numPosts = -1;
db.query(
  ` SELECT COUNT(*) FROM posts 
    WHERE author_if_valid IS NOT NULL 
      AND title IS NOT NULL 
    `,
  function(err, res, fld) {
    if (err)
      throw err;
    numPosts = res[0]['COUNT(*)'];
    console.log("Number of Posts: ", numPosts);
  });

// Assign forum event handler
cm.pageHandler['forum'] = buildForumContent;

function addNewPostPromise(newpost, query, response) {
  return new Promise((resolve, reject) => {
           newpost.content = xss.filterXSS(newpost.content, {css : false}).replaceAll("'", "&apos;");
           var values      = Object.values(newpost);
           values          = values.map(elem => `'${elem}'`);
           console.log(newpost);

           // TODO: Use DB
           db.query(
             `INSERT INTO posts (${Object.keys(newpost).join()}) 
        VALUES (${values.join()}) `,
             function(err, result, field) {
               if (err)
                 reject(err);
               else
                 resolve({result, field});
             });
         })
    .then(function(data) {
      cm.displayUrlContent(response, query, "");
    })
    .catch(function(err) {
      console.log(err);
      response.write(404);
      response.end("error 404");
    });
}

// Assign event for incoming post
// TODO: Change method to use DB
app.post('/add-post', function(request, response) {
  let query   = request.query;
  let post    = request.body;
  let address = cm.addressFromRequest(request);
  console.log("new-post post handler called from " + address)

  // Protect attack from same ip
  var time       = cm.users[address];
  var timediff   = new Number(Date.now()) - time;
  const minDelay = 1000;
  if (time && timediff < minDelay) {
    console.log("Too fast post blocked from" + address + "timespan = " + timediff);
    response.end(
      `<script>
        alert('Try after ${(minDelay - timediff) / 1000.0} seconds'); 
        window.location.href = '/?id=forum&page=1'
      </script> `);
    return;
  }
  cm.users[address] = new Number(Date.now());

  if (!post.title || post.title.length < 1) {
    response.end(
      `<script>
        alert('Invalid post request'); 
        window.location.href = '/?id=forum&page=1'
      </script> `);
    return;
  }
  console.log("title length", post.title);

  var newpost =
    {
      'issued' : new Date(Date.now()).toLocaleString(),
      'title' : util.toRawText(post.title).substr(0, 80),
      'author_if_valid' : util.toRawText(post.userid).substr(0, 16),
      'pw_if_annonymous' : post.password.substr(0, 64),
      'content' : post.content,
      'ipaddr' : cm.ipToBin(address),
      'post_number' : ++numPosts
    };

  // Apply xss guard
  console.log("content", post.content);
  addNewPostPromise(newpost, query, response)
    .then((data) => numPosts);
});

// Assign event for incoming reply
// TODO: Change method to use DB
app.post('/new-reply', function(request, response) {
  let query   = request.query;
  let post    = request.body;
  let address = cm.addressFromRequest(request);

  var newreply = {
    'issued' : new Date(Date.now()).toLocaleString(),
    'author_if_valid' : util.toRawText(post.userid).substr(0, 16),
    'pw_if_annonymous' : post.password.substr(0, 64),
    'content' : post.content,
    'ipaddr' : cm.ipToBin(address),
    'post_number' : query.index,
    'parent_id' : query.pnum
  };
  console.log(newreply);

  // Find parent id
  new Promise((resolve, reject) => {
                // db.query(
                //   `SELECT * FROM posts
                //     WHERE parent_id IS NULL
                //       AND post_number = ${query.index}`);
              });
  addNewPostPromise(newreply, query, response);
});

/**
 * @callback findForumPostsCallback
 * @param {Array<any>} posts
 * @param {Array<any>} replies
 */

/**
 * 
 * @param {number} fromIndex
 * @param {number} numPosts 
 * @param {findForumPostsCallback} onFoundCallback 
 */
function findForumPosts(fromIndex, numPosts, onFoundCallback) {
  db.query(
    ` SELECT * FROM posts 
      WHERE title IS NOT NULL 
      ORDER BY post_number DESC
      LIMIT ${fromIndex},${numPosts}`,
    function(err, results, fields) {
      if (err)
        throw err;

      var postidx  = [];
      var idxTable = new Map();
      var idx      = 0;
      var posts    = results;
      var replies  = [...Array(numPosts) ].map(x => Array(0));

      results.forEach(element => {
        postidx.push(`${element.post_number}`);
        idxTable[element.id] = idx++;
      });

      db.query(
        `SELECT * FROM posts 
         WHERE title IS NULL
           AND post_number IN(${postidx.join()})
         ORDER BY parent_id, issued`,
        function(err, results, fields) {
          if (err)
            throw err;

          //
          results.forEach(element => {
            var repliedMappedIdx = idxTable[element.parent_id];
            if (!replies[repliedMappedIdx]) {
              console.log("Removing invalid key ...", element);
              db.query(`DELETE FROM posts WHERE id=${element.id}`);
              return;
            }
            replies[repliedMappedIdx].push(element);
          });

          onFoundCallback(posts, replies);
        });
    });
}

// Test forum search
findForumPosts(0, 20, function(posts, replies) {
  console.log("Tried to read 20 posts, read", posts.length, "posts and", function() {
    var val = 0;
    replies.forEach(elem => {val += elem.length});
    return val;
  }(), "replies");
});

/**
 * 
 * @param {ParsedUrlQuery} query 
 * @param {cm.contentGenerationDoneCallback} OnFinishCallback 
 */
function buildForumContent(query, OnFinishCallback) {
  let content            = '';
  const postsPerPage     = 50;
  const pageDisplayRange = 7;
  const pageidx          = query.page;
  const postidx          = query.pnum;

  content += /*html*/ `
    <div id="forum_contents"> 
      <div id="forum_text">
        <a href="/?id=new-post&page=${query.page}" 
         id="new-post">
          New Post
        </a>
        <span id="forum">FORUM</span>
      </div>`;

  // Find posts
  findForumPosts((pageidx - 1) * postsPerPage, postsPerPage, function(posts, allreply) {
    // Build forum posts list
    for (let i = 0; i < posts.length; ++i) {
      var post    = posts[i];
      var replies = allreply[i];
      var index   = post.post_number;
      if (index < 0)
        break;

      let date = new Date(post.issued);

      // List of posts
      content += /*html*/ `
        <div class="forum_post" id="forum_post_${index}">
          <span class="forum_post_index"> ${index}</span>
          <a class="forum_post_title"
            href="/?id=forum&page=${pageidx}&index=${index}&pnum=${post.id}"
            onclick="sessionStorage.YScroll = document.scrollingElement.scrollTop;">
            ${post.title}
          </a>
          <span class="forum_post_author"> 
            by ${post.author} (${util.hideIpStr(cm.binToIp(parseInt(post.ipaddr, 10)))})
          </span>`

      // Show reply count only when it has comment
      if (replies.length > 0) {
        content += /*html*/ `
            <span class="forum_post_replies">
            [${replies.length}]</span>`
      }

      // Show date and view count
      content += /*html */ `
            <span class="forum_post_date">
             ${post.viewcnt ? post.viewcnt : 0} views ... ${date.toLocaleString()}</span>
        </div>`

      if (postidx && post.id == postidx) {
        content += /*html*/ ` <section id="f_post">
        <h3 id="f_post_title"> ${post.title} </h3>
        <p id="f_post_content"> 
          <script>
            String.prototype.replaceAll = function(org, dest) { return this.split(org).join(dest); };
            document.write(
              '${post.content}'
              .replaceAll("&apos;", "'")
              .replaceAll("&lt;", "<")
              .replaceAll("&gt;", ">"));
          </script>
        </p>
        <span id="f_post_reply_marker">Replies</span>
        <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
        <script>
          document.scrollingElement.scrollTop = sessionStorage.YScroll;
		      var offset = $("#forum_post_${index}").offset();
          $('html, body').animate({scrollTop : offset.top}, 10); 
        </script>
        <section id="f_post_replies">`;

        // Build post replies
        for (let index = 0; index < replies.length; index++) {
          const reply = replies[index];
          content += /*html*/ `
            <div class="f_post_reply">
              <span class="f_post_reply_name">
                ${reply.author} (${util.hideIpStr(cm.binToIp(parseInt(reply.ipaddr, 10)))})
              </span> 
              <span class="f_post_reply_content"> ${reply.content} </span>
              <span class="f_post_reply_args"> ${new Date(reply.issued).toLocaleString()} </span>
            </div>`;
        }

        // End of reply section
        content += '</section>';

        // Comment append section
        content += fs.readFileSync('public/html/reply.html', 'utf8');

        // End of current posting section
        content += '</section>';
      }
    }

    // Add forum page indicator
    content += '<div class="forum_page_idx">';
    for (let index = Math.max(1, pageidx - pageDisplayRange),
             end   = Math.min(numPosts / postsPerPage + 1,
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
    OnFinishCallback(content);
  });
}
