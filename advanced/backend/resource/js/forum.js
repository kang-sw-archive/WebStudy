var db  = require('./database');
var log = require('./timelog');
var xss = require('xss');

const forums        = 'posts_old';
const tbl_post      = 'posts';
const tbl_reply     = 'replies';
const tbl_forum     = 'forums';
let forumPostCounts = [];

module.exports = {
  asyncQuery,
  searchForumPosts,
  addPosts,
  updateForumPostCounts,
  numPostsOfForum : function(index) { return forumPostCounts[index]; },
  addRepliesOnPost
};

/**
 * 
 * @param {string} queryStr 
 * @returns {Promise<{results: Array<any>, fields: Array<db.FieldInfo>}}
 */
function asyncQuery(queryStr)
{
  return new Promise(
    (resolve, reject) => {db.query(
      queryStr,
      function(err, results, fields) {
        if (err)
          reject(err);
        else
          resolve({results, fields});
      })});
}

/**
 * 
 * @param {number} forumIndex Identifier of forum to search
 * @param {number} postIndex Index of post to start read
 * @param {number} numPosts Number of posts to read out.
 * @returns {Promise<{posts:Array<any>, replies: Array<any>}}
 * @todo Impelment usage of forumIndex
 */
async function searchForumPosts(
  forumIndex,
  postIndex,
  numPosts)
{

  try {
    // Gather posts
    var postQueryResult = await asyncQuery(
      `SELECT * FROM ${forums} 
        WHERE title IS NOT NULL
          AND author_if_valid IS NOT NULL
          AND parent_id IS NULL
        ORDER BY post_number DESC
        LIMIT ${postIndex}, ${numPosts}`);
    let posts = postQueryResult.results;

    // Gather post indices
    let idxtbl = new Map();
    let idxstr = [];
    let idx    = 0;

    posts.forEach(
      e => { idxtbl[e.post_number] = ++idx, idxstr.push(e.post_number); });

    // Gather comments
    var replyQueryResult = await asyncQuery(
      `SELECT * FROM ${forums}
        WHERE title IS NULL
          AND author_if_valid IS NOT NULL
          AND parent_id IS NOT NULL
          AND post_number IN(${idxstr.join()})`);

    var replies = new Array(posts.length).fill(0).map(e => new Array());

    replyQueryResult.results.forEach(
      e => {
        var mappedIdx = idxtbl[e.post_number];
        if (mappedIdx > replies.length) {
          //! @todo. Implement entry removal
          log("Invalid reply is detected. Removing from entry ...");
          return;
        }
        replies[mappedIdx].push(e);
      });

    return {posts, replies};
  }
  catch (err) {
    throw err;
  }
}

/**
 * @typedef {[{ 
      author:!string,
      pw_if_anonym:?string,
      title:!string,
      content:!string,
      date:Date
    }]} PostArgArray
 */

/**
 * 
 * @param {number} forumIdx 
 * @param {?number} parentIfExist 
 * @param {PostArgArray} argArray 
 */
async function addPosts(
  forumIdx,
  argArray,
  parentIfExist = null)
{
  if (forumPostCounts[forumIdx] == null)
    forumPostCounts[forumIdx] = 0;

  var qryValues = [];

  for (var arguments of argArray) {
    var data = {
      author : arguments.author,
      pw_if_anonym : arguments.pw_if_anonym,
      title : arguments.title,
      content : xss(arguments.content),
      date : arguments.date.toLocaleString(),
      forum_number : (forumIdx).toString()
    };

    if (parentIfExist) {
      data.parent_id_if_exists = parentIfExist.toString();
    }
    else {
      data.forum_post_number = (forumPostCounts[forumIdx]++).toString();
    }

    // Make arguments query-safe
    for (var key in data) {
      var value = data[key];
      data[key] = `'${value.replaceAll(`'`, `&apos;`)}'`;
    }

    qryValues.push(`(${Object.values(data).join()})`);
  }

  // Generate query string
  var qry =
    ` INSERT INTO ${tbl_post}(${Object.keys(data).join()}) 
      VALUES ${qryValues.join()}`;

  try {
    var {results, fields} = await asyncQuery(qry);
  }
  catch (err) {
    // Role back post count
    forumPostCounts[forumIdx]--;
  }
}

/**
 * @typedef {[{
      post_id: number,
      author: string,
      pw_if_anonym: string,
      content: string,
      date: Date
    }]} ReplyDescArray
 */

/**
 *  
 * @param {ReplyDescArray} replyArray 
 */
async function addRepliesOnPost(replyArray)
{
  var valueArgs = [];
  var keystr    = 'post_id, author, pw_if_anonym, content, date';

  replyArray.forEach(
    e => {
      var arg = [
        e.post_id,
        e.author,
        e.pw_if_anonym,
        e.content,
        e.date.toLocaleString()
      ];

      arg = Object.values(arg).map(
        e => `'${e.toString().replaceAll('\'', '&apos;')}'`);
      valueArgs.push(`(${arg.join()})`);
    });

  var qry =
    ` INSERT INTO ${tbl_reply} (${keystr})
      VALUES ${valueArgs.join()}`;

  asyncQuery(qry);
}

/**
 * Initialize number of postings for each forums, which can be accessd by index
 * @returns {Promise<void>}
 */
async function updateForumPostCounts()
{
  var queryRes = await asyncQuery(
    ` SELECT  forum_number    AS bucket,
              COUNT(*)        AS COUNT
      FROM    ${tbl_post}
      GROUP   BY bucket`);

  queryRes.results
    .forEach(e => { forumPostCounts[e.bucket] = e.COUNT; });
}

(async function() {
  await updateForumPostCounts();
  log("Initialized forum post count ... Num Forums: ", forumPostCounts.length);
})();

/*
// Temporary code ... remove this later!
(async function() {
  await updateForumPostCounts();

  var {posts, replies} = await searchForumPosts(0, 0, 1000);
  if (posts.length != replies.length)
    throw new Error('Invalid search function output params');

  var args = [];
  for (let index = 0; index < posts.length; index++) {
    var post  = posts[index];
    var reply = replies[index];

    // argPosts.push({
    //   author : post.author_if_valid,
    //   pw_if_anonym : post.pw_if_annonymous,
    //   content : post.content,
    //   date : post.issued,
    //   title : post.title
    // });
    reply.forEach(
      e => {
        args.push({
          post_id : index,
          author : e.author_if_valid,
          pw_if_anonym : e.pw_if_annonymous,
          content : e.content,
          date : e.issued
        })});
  }

  addRepliesOnPost(args);
  log("Data migration process finished, post count: ", forumPostCounts);
})();
//*/