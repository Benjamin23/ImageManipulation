var express = require('express'),
    app = express();

var port = process.env.NODE_ENV || 3000;

app.get('/', function(req, res) {

    console.log('request on root route');
    res.end('You have requested the main route');



});




app.listen(port, function() {
console.log('App listening on port %d', port);
});


