const s3 = require("./s3");
const {successResponse, errorResponse} = require("../src/response");
const im = require('imagemagick');
const fs = require('fs');
const os = require('os');
const path = require('path');

const getFile = (imageBucket, objectKey, reject) => s3.getFileFromBucket(imageBucket, objectKey).catch(err => {
    reject(errorResponse(err.code, 404, err));
});


exports.original = (imageBucket, objectKey) => new Promise((resolve, reject) =>

    getFile(imageBucket, objectKey, reject)
        .then(data => resolve(successResponse(data.Body.toString('base64'), 'image/jpeg'))));

exports.autoOrient = (imageBucket, objectKey) => new Promise((resolve, reject) =>

    getFile(imageBucket, objectKey, reject).then(data => {

        const rotatedFile = `${os.tmpDir}/rotated.${imageBucket}.${objectKey}}`;

        const autoOrientCallback = (err, output, resolve, reject) => {
            if (err) {
                reject(errorResponse(null, 500, err));
            } else {
                console.log('INFO: Resize operation completed successfully');
                im.identify(rotatedFile, (err, result) => {
                    console.log('INFO: MIME type of thumbnail is being identified');
                    let mimeType;
                    switch (result.format) {
                        case 'GIF':
                            mimeType = 'image/gif';
                            break;
                        case 'PNG':
                            mimeType = 'image/png';
                            break;
                        default:
                            mimeType = 'image/jpeg';
                    }

                    const response = successResponse(Buffer.from(fs.readFileSync(rotatedFile)).toString('base64'), mimeType);
                    fs.unlink(rotatedFile, () => console.log("INFO: Auto Oriented file cleaned up"));
                    resolve(response);
                });
            }
        };

        const tempFile = `${os.tmpDir}/${imageBucket}.${objectKey}`

        fs.writeFile(tempFile, data.Body, (err) => {
            // throws an error, you could also catch it here
            if (err) throw err;

            im.convert([tempFile, '-auto-orient', '-define', 'jpeg:extent=2000kb', rotatedFile], (err, output) => autoOrientCallback(err, output, resolve, reject));
        });
    }));