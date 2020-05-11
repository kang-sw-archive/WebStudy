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
    var forumName                             = req.url.split('/')[2];
    var q                                     = req.query;
    var {page, posts_per_page : postsPerPage} = q;
    var forumId                               = await forum.findForumIdByName(forumName);
    log(forumName, forumId);

    if (isNaN(postsPerPage) || postsPerPage < 0)
      postsPerPage = 50;

    if (isNaN(forumId) || isNaN(page))
      throw new Error("Invalid query parameters has delievered.");

    if (isNaN(await forum.isValidForumId(forumId))) {
      res.send(JSON.stringify(null));
      return;
    }

    var posts = await forum.fetchForumPosts(
      forumId,
      page * postsPerPage,
      postsPerPage);

    res.send(JSON.stringify(posts));
  }
  catch (err) {
    res.writeHead(404);
    res.end("404 Not Found:: " + err);
  }
});