let express = require('express');
let app     = express();
let log = (...args) => { console.log(new Date(Date.now()).toLocaleTimeString(), ":: ", args); };

app.listen(3000, () => log("Server listen successful"));
