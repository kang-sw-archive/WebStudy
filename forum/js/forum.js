let fs    = require('fs');
let cm    = require('./common');
let util  = require('./utils');
let posts = [];

// Load database
if (true) {
  let postsArchive = fs.readFileSync('archive/posts.json');
  posts            = JSON.parse(postsArchive);
  // console.log(posts);
  console.log(util.toRawText("<>''L>"));
}

// Assign forum event handler
cm.pageHandler['forum'] = buildForumContent;

// Assign event handler for new post incoming
cm.postHandler['add-post'] = function(query, post, address) {
  console.log("new-post post handler called from " + address)

  // Protect attack from same ip
  var time     = cm.users[address];
  var timediff = new Number(Date.now()) - time;
  if (time && timediff < 5000) {
    console.log("Too fast post blocked from" + address + "timespan = " + timediff);
    return;
  }
  cm.users[address] = new Number(Date.now());

  var newpost =
    {
      'date' : new Date(Date.now()).toLocaleString(),
      'title' : util.toRawText(post.title).substr(0, 255),
      'author' : util.toRawText(post.userid).substr(0, 24),
      'pw' : post.password,
      'content' : (post.content), //TODO: HTML verification required.
      'replies' : []
    };
  console.log(newpost);
  posts.push(newpost);

  fs.writeFile(
    'archive/posts.json',
    JSON.stringify(posts), (err) => {posts});
};

// Assign event for new reply incoming
cm.postHandler['new-reply'] = function(query, post, address) {
  var newreply = {
    'date' : new Date(Date.now()).toLocaleString(),
    'author' : util.toRawText(post.userid).substr(0, 24),
    'pw' : post.password,
    'content' : util.toRawText(post.content)
  };
  console.log(newreply);
  console.log("   from " + address);
  findForumPost(query.index).replies.push(newreply);

  fs.writeFile(
    'archive/posts.json',
    JSON.stringify(posts), (err) => {posts});
};

function findForumPost(index, bAddView = false) {
  if (bAddView) {
    if (posts[index].view == undefined)
      posts[index].view = 0;
    ++posts[index].view;
  }
  return posts[index];
}

function buildForumContent(query) {
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
          $('html, body').animate({scrollTop : offset.top}, 10); 
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