"use strict";

var formidable = require('formidable'),
    gm = require('gm'),
    config = require('./config.js'),
    fs = require('fs-extra'),
    async = require('async');


//Middleware za provjeru slika
exports.validateImageProperties = function (req, res, next) {

    //Provjeri dali postoji temp folder
    fs.ensureDir(config.tempDir, function (err) {
        if (err) {
            res.status(500).send('Temp folder error');
        }
    });

    var form = new formidable.IncomingForm(),
        imgRegExp = config.imageNameRegEx,
        minImageWidth = config.minWidth,
        minImageHeight = config.minHeight,
        maxImageSize = config.maxSize;

    form.uploadDir = config.tempDir;
    form.maxFields = config.maxFields;
    form.multiples = true;
    form.keepExtensions = true;


    //Parsiranje slika i polja primljenih uz slike
    form.parse(req, function (err, fields, files) {

        var recivedFiles,
            asyncCheckingTasks = [];

        //Radi podrske multiple upload-a kao i single upload-a
        /*
         Ukoliko je files.file array, spremi u varijablu recivedFiles, ako je samo files,
         inicijaliziraj recivedFiles kao array i ubaci u njega files.file
         */
        (files.file.length > 1) ? recivedFiles = files.file : (recivedFiles = [], recivedFiles.push(files.file));

        //Ovdje se zapravo ne izvrsavaju funkcije, vec samo stavljaju u array.
        recivedFiles.forEach(function (item) {

            //Provjerava formata datoteke
            asyncCheckingTasks.push(function (callback) {
                item.name.match(imgRegExp) ? callback() : callback({
                    code: 400,
                    message: "File " + item.name + " has wrong file format"
                });
            });

            //Provjera velicine slike
            asyncCheckingTasks.push(function (callback) {
                (item.size < maxImageSize) ? callback() : callback({
                    code: 400,
                    message: item.name + " is to big, max allowed file size is " + maxImageSize
                });
            });

            //Provjera dimenzije slike
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
             Ovdje dodati taskove za provjeru primljenih fields-a
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


/**
 * Primljene slike pretvara u predefinirane dimenzije te ih sprema u pripadne direktorije
 *
 * @param images Slike koje je potrebno spremiti
 * @param masterPath Master putanja na koju spremamo
 * @param fields Dodatna polja koja dolaze uz datoteku
 * @param masterCallback
 */
exports.convertAndSaveImages = function (images, masterPath, fields, masterCallback) {

    var numOfFiles = images.length,
        imgCounter = 0,
        imageConfiguration = config.imageSizes,
        directories = config.directories,
        mainDir = config.mainDir,
        createdImagePaths = [],
        parseImage = function (img) {

            var image = gm(img.path),
                asyncTasks = [];

            //Za svaki direktorij potrebno je pretvoriti u odgovarajucu velicinu,
            //velicine su predefinirane
            directories.forEach(function (dirName) {
                var newPathName = mainDir + '/' + masterPath + '/' + dirName;
                var dimension = imageConfiguration[dirName];

                asyncTasks.push(function (callback) {

                    //Kreiraj potreban direktorij
                    fs.ensureDir(newPathName, function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            //Dodavanje kreiranih lokacija u response object
                            var newLocation = newPathName + '/' + img.name;
                            createdImagePaths.push(newLocation);

                            //Ako je direktorij uspjesno kreiran, konvertiraj sliku i spremi
                            image
                                .resize(dimension.width, dimension.height, '^')
                                .gravity('Center')
                                .crop(dimension.width, dimension.height)
                                .write(newLocation, function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        //Slika uspjesno spremljena
                                        callback();
                                    }
                                });
                        }
                    });
                });

            });

            async.parallel(asyncTasks, function (err) {
                if (err) {
                    masterCallback(err);
                } else {
                    //Uspjesno obavljeni svi taskovi za sliku, obrisi temp file slike
                    fs.remove(images[imgCounter].path, function (err) {
                        err ? console.log('Err') : console.log('Ok');
                    });

                    //Provjera dali ima jos slika
                    ++imgCounter;
                    if (imgCounter < numOfFiles) {
                        parseImage(images[imgCounter]);
                    } else {
                        masterCallback(null, createdImagePaths);
                    }
                }

            });
        };

    parseImage(images[0]);

};






