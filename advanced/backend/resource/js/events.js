let express    = require('express');
let app        = express();
let log        = require('./timelog');
let forum      = require('./forum');
let url        = require('url');
module.exports = app;

app.use(express.static('../front/dist'));
app.listen(3000, () => log("Server listen successful"));

app.get('/forum/', async function(req, res) {
  try {
    res.send(JSON.stringify(await forum.fetchForumList()));
  }
  catch (err) {
    res.writeHead(404);
    res.end("Internal error occured. Try after few seconds.");
  }
});

app.get(/\/forum\/\w+\//, async function(req, res) {
  try {
    // Query parameter check
    var forumName              = req.url.split('/')[2];
    var q                      = req.query;
    var {page, posts_per_page} = q;
    var forum_id               = await forum.findForumIdByName(forumName);
    log(forumName, forum_id);

    if (isNaN(posts_per_page) || posts_per_page < 0)
      posts_per_page = 50;

    if (isNaN(forum_id) || isNaN(page))
      throw new Error("Invalid query parameters has delievered.");

    if (isNaN(await forum.isValidForumId(forum_id))) {
      res.send(JSON.stringify(null));
      return;
    }

    var posts = await forum.fetchForumPosts(
      forum_id,
      page * posts_per_page,
      posts_per_page);

    res.send(JSON.stringify(posts));
  }
  catch (err) {
    res.writeHead(404);
    res.end("404 Not Found:: " + err);
  }
});