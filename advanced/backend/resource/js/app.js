let express    = require('express');
let app        = express();
let log        = require('./timelog');
let forum      = require('./forum');
module.exports = app;

app.use(express.static('../front/dist'));
app.listen(3000, () => log("Server listen successful"));

app.get(/\/forum\/*/, (req, res) => {
  var query = req.query;

  var sendstr = JSON.stringify(`Queries: K [${Object.keys(query).join()}] V [${Object.values(query).join()}]`);
  log(sendstr);
  res.end(sendstr);
});
