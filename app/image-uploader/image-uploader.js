"use strict";

var formidable = require('formidable'),
    gm = require('gm'),
    config = require('./config.js'),
    fs = require('fs-extra'),
    async = require('async');



//Middleware koji provjerava ispravnost primljenih slika
exports.validateImageProperties = function (req, res, next) {

    var form = new formidable.IncomingForm(),
        imgRegExp = config.imageNameRegEx,
        minImageWidth = config.minWidth,
        minImageHeight = config.minHeight,
        maxImageSize = config.maxSize;

    form.uploadDir = config.tempDir;
    form.keepExtensions = true;
    form.maxFields = config.maxFields;
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

//Middleware funkcija koja kreira sve potrebne direktorije
exports.createDirectoryStructure = function (req, res, next) {

    //Kreiranje dir-a
    //Iz requesta bi trebalo izvuci username i ime parrent direktorija
    //directories, definirati ranije sa tocno odredenim velicinama
    var username = 'Benjamin',
        parrentDir = 'vehicles',
        mainDirectoryPath = config.mainDir,
        dirs = config.directories,
        createdDirs = [],
        parrentDirPath = mainDirectoryPath +'/'+ username + '/' + parrentDir;


    /*
     Potvrda da postoje svi potrebni direktoriji,
     ukoliko ne postoje, kreirani su.
     */
    var asyncTasks = [];
    dirs.forEach(function (dirName) {
        asyncTasks.push(function (cb) {
            fs.mkdirs(parrentDirPath + '/' + dirName,  function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb();
                }
            });
        });
    });
    async.parallel(asyncTasks, function (err) {
        if (err) {
            done(err);
        }
        else {
            fs.readdir(parrentDirPath, function (err, files) {
                if (err) {
                    done(err);
                } else {
                    createdDirs = files.map(function (item) {
                        return (parrentDirPath + "/" + item);
                    });
                    done();
                }
            });
        }

    });

    var done = function (err) {


        //Ovdje su svi folderi kreirani
        if (err) {
            res.status(500).send('Error with directory manipulation, error code recived:' + err.code).end();
        } else {
            req.directories = createdDirs;
            next();
        }
    }


};

exports.convertAndSaveImages = function (images, directories, fields, masterCallback) {

    var numOfFiles = images.length,
        imgCounter = 0,
        imageConfiguration = config.imageSizes,
        parseImage = function (img) {

            var image = gm(img.path),
                asyncTasks = [];

            //Za svaki direktorij potrebno je pretvoriti u odgovarajucu velicinu,
            //velicine su predefinirane
            directories.forEach(function (newPathName) {
                asyncTasks.push(function (callback) {

                    var currentDirName = newPathName.substring(newPathName.lastIndexOf('/')+1);
                    var dimension = imageConfiguration[currentDirName];


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
