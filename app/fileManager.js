var fs = require('fs-extra'),
    async = require('async'),
    mainDirectoryPath = './public/img/';


//Middleware funkcija koja kreira sve potrebne direktorije
exports.createDirectoryStructure = function (req, res, next) {

    //Kreiranje dir-a
    //Iz requesta bi trebalo izvuci username i ime parrent direktorija
    //directories, definirati ranije sa tocno odredenim velicinama
    var username = 'Benjamin',
        parrentDir = 'vehicles',
        dirs = ['L', 'M', 'S', 'XS'],
        createdDirs = [],
        parrentDirPath = mainDirectoryPath + username + '/' + parrentDir;


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
                    //Ako folder vec postoji, vratit ce null
                    if (result !== null) {
                        createdDirs.push(result);
                    }
                    cb();
                }
            });
        });
    });
    async.parallel(asyncTasks, function (err) {
        if (err) {
            done(err);
        }
        else if (createdDirs.length < 1) {
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
        else {
            done();
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





