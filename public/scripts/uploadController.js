//document.getElementById('file-input').addEventListener('change', function () {
//
//    var file = this.files[0],
//        url = '/upload/html5',
//        xhr = new XMLHttpRequest(),
//        fd = new FormData();
//
//    xhr.open("POST", url, true);
//    xhr.onreadystatechange = function() {
//        if (xhr.readyState == 4 && xhr.status == 200) {
//            console.log(xhr.responseText);
//        }
//    };
//    fd.append("file", file);
//    xhr.send(fd);
//}, false);

var app = angular.module('imageUploadApp', ['ngFileUpload']);

app.controller('UploadController', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {

    $scope.$watch('files', function () {
        $scope.upload($scope.files);
    });

    $scope.log = '';
    $scope.errors = [];

    $scope.upload = function (files) {
        if (files && files.length) {


            //Debugging-ispis prihvacenih i odbijenih datoteka
            var numberOfFiles = files.length;
            console.log("Accepted files");
            for (var i = 0; i < numberOfFiles; i++) {
                console.log(files[i].name);
            }

            var numberOfFilesRejected = $scope.rejectedFiles.length || undefined;
            console.log("Rejected files");
            if(numberOfFilesRejected === undefined) {
                console.log("No rejected files");
            } else {
                for (var i = 0; i < numberOfFilesRejected; i++) {
                    console.log($scope.rejectedFiles[i].name);
                    console.log("reason for rejection:" + $scope.rejectedFiles[i].$error);
                }
            }

            //Moguce je i array slati, ali zbog obrade na serveru je jednostavnije ovako
            for (var i = 0; i < numberOfFiles; i++) {

                var file = files[i];
                //Moguce i drugacije uploadati, ovo je nacin preko kontolera, a drugi je preko servisa
                Upload.upload({
                    url: '/upload',
                    method: 'POST',
                    fields: {
                        'username': 'BenjaminFields',
                        'password': 'Benjamin Pass',
                        'nekaTrecaVar':'Neka treca'
                    },

                    file: file
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $scope.log = 'progress: ' + progressPercentage + '% ' +
                        evt.config.file.name + '\n' + $scope.log;
                }).success(function (data, status, headers, config) {
                    $timeout(function () {
                        $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
                    });
                }).error(function (data, status, headers, config) {
                    $scope.errors.push(data);
                }).xhr(function (xhr) {

                    xhr.addEventListener("loadend", function () {
                      //  alert("Upload done");
                    }, false);

                });
            }
        }
    };


}]);