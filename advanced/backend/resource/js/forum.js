/**
 * @todo these APIs should be able to handle cluster ... thus the global variable forumPostCounts must be removed, and replaced into corresponding shared resource APIs.
 */
var db   = require('./database');
var log  = require('./timelog');
var util = require('./utility');
var xss  = require('xss');

const forums        = 'posts_old';
const tbl_post      = 'posts';
const tbl_reply     = 'replies';
const tbl_forum     = 'forums';
let forumPostCounts = [];

module.exports = {
  asyncQuery,
  fetchForumPosts,
  addPosts,
  updateForumPostCounts,
  getForumPostCount,
  addRepliesOnPost
  // modifyPost
  // modifyReply
};

/**
 * Initialize number of postings for each forums, which can be accessd by index
 * @todo Make this fit with clustering to not to refresh repeatedly on shared resources
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

/** 
 * Get number of forum posts 
 * @param {number} index
 */
async function getForumPostCount(index)
{
  var val = forumPostCounts[index];
  return val ? val : 0;
}

/**
 * @param {Array<int>} indices 
 * @returns {[{forumIdx:number, postCnt: number}]}
 */
async function getForumPostCounts(indices)
{
  return indices.map(key => ({forumIdx : key, postCnt : getForumPostCount(key)}));
}

/**
 * Increment number of forum post
 */
async function increaseForumPostCount(index)
{
  forumPostCounts[index] = forumPostCounts[index] ? forumPostCounts[index] + 1 : 1;
  return forumPostCounts[index] - 1;
}

/**
 * Decrement count of forum post
 */
async function decreaseForumPostCount(index)
{
  forumPostCounts[index]--;
}

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

/** @typedef {{
      id:number,
      parent_id_if_exists: ?number,
      forum_number: number,
      forum_post_number: number,
      title: string,
      author: string,
      pw_if_anonym: string,
      content:string,
      date:string,
      num_replies: number
    }} PostDescriptor */

/**
 * 
 * @param {number} forumIndex Identifier of forum to search
 * @param {number} postIndex Index of post to start read
 * @param {number} numPosts Number of posts to read out.
 * @returns {Promise<{posts:Array<PostDescriptor>}}
 * @todo Impelment usage of forumIndex
 */
async function fetchForumPosts(
  forumIndex,
  postIndex,
  numPosts,
  bShouldIncludePw = false)
{

  try {
    // Gather posts
    var qryRes = await asyncQuery(
      `SELECT 
            ${bShouldIncludePw ? 'pw_if_anonym,' : ''}
            id, parent_id_if_exists, forum_number,
            forum_post_number,
            title,
            author,
            content,
            date,
            num_replies 
        FROM ${tbl_post} 
        WHERE is_removed = 0
          AND parent_id_if_exists IS NULL
        ORDER BY forum_post_number DESC
        LIMIT ${postIndex}, ${numPosts}`);
    return qryRes.results;
  }
  catch (err) {
    throw err;
  }
}

/**
 * 
 * @param {Array<number>} postIdArray 
 * @param {Array<string>} excludeColumns columns to exclude from result
 * @returns {Promise<Array<any>>}
 */
async function fetchForumReplies(postIdArray, excludeColumns = [ 'pw_if_anonym' ])
{
  var columns =
    [ 'id', 'post_id', 'author', 'pw_if_anonym', 'content', 'date' ]
      .filter(e => excludeColumns.includes(e) == false);

  var qry = `
    SELECT ${columns.join()} FROM ${tbl_reply}
      WHERE post_id IN(${postIdArray.join()})
        AND is_removed=0`;

  try {
    var replies = (await asyncQuery(qry)).results;
  }
  catch (err) {
    throw err;
  }

  return replies;
}

/**
 * @typedef {{
      author:!string,
      pw_if_anonym:?string,
      title:!string,
      content:!string,
      date:Date
    }} PostArg
 */

/**
 * 
 * @param {number} forumIdx 
 * @param {?number} parentIfExist 
 * @param {Array<PostArg>} argArray 
 */
async function addPosts(
  forumIdx,
  argArray,
  parentIfExist = null)
{
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
      data.forum_post_number = (await increaseForumPostCount(forumIdx)).toString();
    }

    // Make arguments query-safe
    for (var key in data) {
      var value = data[key];
      data[key] = `'${util.replaceAll(value, `'`, `&apos;`)}'`;
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
    decreaseForumPostCount(forumIdx);
    throw err;
  }
}

/**
 * @typedef {{
      post_id: number,
      author: string,
      pw_if_anonym: string,
      content: string,
      date: Date
    }} ReplyDesc
 */

/**
 *  
 * @param {Array<ReplyDesc>} replyArray 
 */
async function addRepliesOnPost(replyArray)
{
  var valueArgs = [];
  /** @type { Map<number, any> } */
  var replyCnt = new Map();
  var keystr   = 'post_id, author, pw_if_anonym, content, date';

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

      var searched = replyCnt.get(e.post_id);
      if (searched)
        replyCnt.set(e.post_id, searched + 1);
      else
        replyCnt.set(e.post_id, 1);

      valueArgs.push(`(${arg.join()})`);
    });

  var qry =
    ` INSERT INTO ${tbl_reply} (${keystr})
      VALUES ${valueArgs.join()}`;
  await asyncQuery(qry);

  var qry = [];
  for (var pair of replyCnt) {
    var key   = pair[0];
    var value = pair[1];
    asyncQuery(
      ` UPDATE ${tbl_post} 
        SET num_replies = num_replies + ${value}
        WHERE id = ${key};`);
  }
}