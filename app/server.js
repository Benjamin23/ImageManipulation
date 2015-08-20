'use strict';

var express = require('express'),
    imageUploader = require('./image-uploader/image-uploader.js'),
    app = express();


app.use(express.static('./public'));


app.get('/', function (req, res) {
    res.render('./public/index.html');
});


app.post('/upload', imageUploader.validateImageProperties, function (req, res) {



    console.log(" \nRecived files");
    console.log(JSON.stringify(req.files));

    console.log("\nRecived fields");
    console.log(JSON.stringify(req.fields));

    /*
    Nako sto je middleware provjerio svojstva slika, mozemo ih spremiti
    Pomocu podataka iz requesta, pravimo main putanju
    */
    var userName = req.userName || 'Benjamin';
    var dirName = req.directory || 'vehicles';

    var currentUsersPath = userName.toLowerCase() + '/' + dirName.toLowerCase();

    imageUploader.convertAndSaveImages(req.files, currentUsersPath, req.fields, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('All good');
        }
    });

    res.end();

});


module.exports = app;

