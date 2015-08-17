'use strict';

var express = require('express'),
    imageUploader = require('./image-uploader/image-uploader.js'),
    app = express();


app.use(express.static('./public'));


app.get('/', function (req, res) {
    res.render('./public/index.html');
});


app.post('/upload', imageUploader.validateImageProperties, imageUploader.createDirectoryStructure, function (req, res) {





    console.log(" \nRecived files");
    console.log(JSON.stringify(req.files));

    console.log("\nRecived fields");
    console.log(JSON.stringify(req.fields));

    console.log("\nCreated direcotries");
    console.log(JSON.stringify(req.directories));

    imageUploader.convertAndSaveImages(req.files, req.directories, req.fields, function(err) {
       if(err) {
           console.log(err);
       }  else {
           console.log('All good');
       }

    });

    /*
    Ovdje imamo kreiranu folderstructure te su sve slike ispravne
    */

    /*
    Dodati brisanje temp file-ova nakon upload-a
     */






    res.end();

});




module.exports = app;

