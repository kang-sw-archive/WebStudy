let express = require('express');
let app     = express();
let log = (...args) => {
  console.log(
      [ new Date(Date.now()).toLocaleTimeString() ],
      ...args);
};

app.use(express.static('../public'));
app.listen(3000, () => log("Server listen successful"));

app.get('/posts', (req, res) => {
  var query = req.query;

  var sendstr = JSON.stringify(`Queries: K [${Object.keys(query).join()}] V [${Object.values(query).join()}]`);
  log(sendstr);
  res.end(sendstr);
});
