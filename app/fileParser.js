'use strict';

var formidable = require('formidable'),
    gm = require('gm'),
    fs = require('fs-extra'),
    async = require('async');


exports.parseAndSaveImages = function (files, folders, masterCallback) {

    //L,M,S,XS
    var imageDimensions = [
        {
            description: 'L',
            width: 1280,
            height: 1024
        },
        {
            description: 'M',
            width: 1024,
            height: 768
        },
        {
            description: 'S',
            width: 800,
            height: 600
        },
        {
            description: 'XS',
            width: 640,
            height: 480
        }
    ];


    var numOfFiles = files.length;
    var fileCounter = 0;

    var parseImage = function (file) {

        var image = gm(file.path),
            asyncTasks = [];
        imageDimensions.forEach(function (item, index) {
            asyncTasks.push(function (callback) {
                var newPathName = folders[index + 1] + "/" + file.name;
                image
                    .resize(item.width, item.height, '^')
                    .gravity('Center')
                    .crop(item.width, item.height)
                    .write(newPathName, function (error) {
                        if (error) {
                            callback(error);
                        } else {
                            callback();
                        }
                    });
            });
        });

        async.parallel(asyncTasks, function (error) {

            if (error) {
                masterCallback(error);
            } else {
                ++fileCounter;
                if (fileCounter < numOfFiles) {
                    parseImage(files[fileCounter]);
                } else {
                    masterCallback();
                }
            }
        });


    }(files[fileCounter]);


};

