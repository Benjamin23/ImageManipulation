"use strict";

var formidable = require('formidable'),
    gm = require('gm'),
    config = require('./image-uploader/config.js'),
    async = require('async');

//Rijesiti konfiguraciju preko konstruktora
var imageConfiguration = config.imageSizes;
//var imageConfiguration = {
//    'L': {
//        'width': '1280',
//        'height': '1024'
//    },
//    'M': {
//        'width': '1024',
//        'height': '768'
//    },
//    'S': {
//        'width': '800',
//        'height': '600'
//    },
//    'XS': {
//        'width': '600',
//        'height': '480'
//    }
//};

//Middleware koji provjerava ispravnost primljenih slika
exports.validateImageProperties = function (req, res, next) {

    //Definiranje parametara koje funkcija treba provjeriti
    var form = new formidable.IncomingForm(),
        imgRegExp = new RegExp(/^([a-z0-9]|\.|-|_){3,50}.(png|jpg|jpeg|bmp|tiff)$/i),
        minImageWidth = 1280,
        minImageHeight = 1024,
        maxImageSize = 8 * 1024 * 1024;

    form.uploadDir = "temp";
    form.keepExtensions = true;
    form.maxFields = 20;
    form.multiples = true;


    //Trenutno parsira samo file-ove, potrebno parsirati i fields
    form.parse(req, function (err, fields, files) {

        var recivedFiles,
            asyncCheckingTasks = [];

        /*
         Ukoliko je files.file array, spremi u varijablu recivedFiles, ako je samo files,
         inicijaliziraj recivedFiles kao array i ubaci u njega files.file
         */
        (files.file.length > 1) ? recivedFiles = files.file : (recivedFiles = [], recivedFiles.push(files.file));

        //Ovdje se zapravo ne izvrsavaju funkcije, vec samo stavljaju u array.
        recivedFiles.forEach(function (item) {

            //Task koji provjerava format datoteke
            asyncCheckingTasks.push(function (callback) {
                item.name.match(imgRegExp) ? callback() : callback({
                    code: 400,
                    message: "File " + item.name + " has wrong file format"
                });
            });

            //Tasko koji provjerava velicinu slike
            asyncCheckingTasks.push(function (callback) {
                (item.size < maxImageSize) ? callback() : callback({
                    code: 400,
                    message: item.name + " is to big, max allowed file size is " + maxImageSize
                });
            });

            //Task koji ce provjeriti dimenzije slike
            asyncCheckingTasks.push(function (callback) {
                gm(item.path)
                    .size(function (err, dimensions) {
                    if (!err && dimensions.height >= minImageHeight && dimensions.width >= minImageWidth) {
                        callback();

                    } else {
                        callback({
                            code: 400,
                            message: "File " + item.name + " is to small, minimal allowed is: " + minImageWidth + "x" +
                            minImageHeight + ", and current size is:" + dimensions.width + "x" + dimensions.height
                        });


                    }
                });
            });

            /*
             Ukoliko je potrebno, moguce je ubaciti i dodatne provjere
             */

        });

        /*
         Izvrsava array taskova "paralelno" i kada su svi gotovi, poziva callback funkciju
         */
        async.parallel(asyncCheckingTasks, function (error) {

            if (error) {
                res.status(error.code).send(error.message);
                res.end();
            } else {
                //Ukoliko su sve datoteke ispravne, pridruzi ih requestu i nastavi dalje
                req.files = recivedFiles;
                req.fields = fields;
                next();
            }
        });
    });
};

exports.convertAndSaveImages = function (images, directories, fields, masterCallback) {

   var numOfFiles = images.length,
    imgCounter = 0,
    parseImage = function (img) {

        var image = gm(img.path),
            asyncTasks = [];
        //Za svaki direktorij potrebno je pretvoriti u odgovarajucu velicinu,
        //velicine su predefinirane
        directories.forEach(function (newPathName) {
            asyncTasks.push(function (callback) {

                var currentDirSize = newPathName.substring(newPathName.lastIndexOf('/')+1),
                    dimension = imageConfiguration[currentDirSize];

                image
                    .resize(dimension.width, dimension.height, '^')
                    .gravity('Center')
                    .crop(dimension.width, dimension.height)
                    .write(newPathName+'/'+img.name, function (error) {
                        if (error) {
                            callback(error);
                        } else {
                            callback();
                        }
                    });
            });

        });

        async.parallel(asyncTasks, function (err) {
            if (err) {
                masterCallback(err);
            } else {
                ++imgCounter;
                if (imgCounter < numOfFiles) {
                    parseImage(images[imgCounter]);
                } else {
                    masterCallback();
                }
            }

        });
    };

    parseImage(images[0]);

};

