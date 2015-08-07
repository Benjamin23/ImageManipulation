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

app.controller('UploadController', ['$scope', 'Upload', '$timeout', function($scope, Upload, $timeout) {

    $scope.$watch('files', function () {
        console.log('Files changes, now uploading...');
        $scope.upload($scope.files);
    });

    $scope.log = '';

    $scope.upload = function (files) {
        if (files && files.length) {
            var numberOfFiles = files.length;
            for (var i = 0; i < numberOfFiles; i++) {
                var file = files[i];
                Upload.upload({
                    url: '/upload',
                    fields: {
                        'username': 'Benjamin'
                    },
                    file: file
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $scope.log = 'progress: ' + progressPercentage + '% ' +
                        evt.config.file.name + '\n' + $scope.log;
                }).success(function (data, status, headers, config) {
                    $timeout(function() {
                        $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
                    });
                });
            }
        }
    };




}]);