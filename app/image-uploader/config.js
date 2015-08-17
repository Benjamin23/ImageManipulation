var configData = {
    imageSizes: {
        'XL': {
            'width': '1600',
            'height': '1280'
        },
        'L': {
            'width': '1280',
            'height': '1024'
        },
        'M': {
            'width': '1024',
            'height': '768'
        },
        'S': {
            'width': '800',
            'height': '600'
        },
        'XS': {
            'width': '600',
            'height': '480'
        }
    },
    directories: ['L', 'M', 'S', 'XS'],
    imageNameRegEx: new RegExp(/^([a-z0-9]|\.|-|_){3,100}.(png|jpg|jpeg|bmp|tiff)$/i),
    minWidth: 1280,
    minHeight: 1024,
    maxSize: 8 * 1024 * 1024,
    tempDir:'temp',
    mainDir:'./public/img',
    maxFields: 20

};

module.exports = configData;