'use strict';

var express = require('express'),
    formidable = require('formidable'),
    util = require('util'),
    app = express();

app.use(express.static('./public'));


app.get('/', function(req, res) {
    res.render('./public/index.html');
});

app.post('/upload', function (req, res) {

    var form = new formidable.IncomingForm();

    //Temp folder gdje sprema datoteke prije parsiranja
    form.uploadDir = "temp";

    //Ako je false, spremit ce bez ekstenzije u uploadDir
    form.keepExtensions = true;

    //Kolicina memorije u bajtovima za sve fields zajedno, default je 2MB
    form.maxFieldsSize = 2 * 1024 * 1024;

    form.on('progress',function(recived, total) {
            console.log(recived +' from total '+ total);
    });


    form.parse(req, function(err, fields, files) {

        console.log('Parsing');

        res.status(200).send("Success");

    });




});




module.exports = app;