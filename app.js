'use strict';

var app = require('./app/server.js');

var port = process.env.NODE_ENV || 3000;


app.listen(port, function() {
console.log('App listening on port %d', port);
});


