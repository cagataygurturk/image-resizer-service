'use strict';

//import aws from 'aws-sdk';
const aws = require("aws-sdk");
const s3 = new aws.S3();
const im = require('imagemagick');
const fs = require('fs');

const imageBucket = process.env.IMAGE_BUCKET;

const getFileFromBucket = (bucket, key) => {
    console.log(`INFO: Getting image from s3://${bucket}/${key}`);
    return s3.getObject({
        Bucket: bucket,
        Key: key
    }).promise();
};

const sendResponse = (callback, body, contentType, statusCode, errorMessage) => {
    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": contentType,
            "X-Error": errorMessage || null
        },
        body: body,
        isBase64Encoded: true
    };
    return callback(null, response);
};

const successResponse = (callback, body, contentType) => {
    return sendResponse(callback, body, contentType, 200);
};

const errorResponse = (callback, body, statusCode, err) => {

    console.log(`ERROR ${statusCode}`, err);

    const onePixelGif = [
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x04, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ];

    return sendResponse(callback, new Buffer(onePixelGif).toString('base64'), 'image/gif', statusCode, body);
};


const getOriginalFile = (bucket, key, callback) => {
    console.log(`INFO: Returning original`);

    getFileFromBucket(bucket, key)
        .then((data) => {
            successResponse(callback, data.Body.toString('base64'), 'image/jpeg');
        })
        .catch((err) => {
            return errorResponse(callback, null, 404, err)
        });
};

const postProcessResource = (resource, fn) => {
    let ret = null;
    if (resource) {
        if (fn) {
            ret = fn(resource);
        }
        try {
            fs.unlinkSync(resource);
        } catch (err) {
            // Ignore
        }
    }
    return ret;
};

const getResizedFile = (bucket, key, width, height, callback) => {
    console.log(`INFO: Returning resized version`);
    getFileFromBucket(bucket, key)
        .then((data) => {
            try {

                const resizedFile = `/tmp/resized.${bucket}.${key}.${width}.${height}`;

                const resizeCallback = (err) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log('INFO: Resize operation completed successfully');
                        im.identify(resizedFile, (err, result) => {
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
                            callback(null,
                                postProcessResource(resizedFile, (file) => {
                                    return successResponse(callback, new Buffer(fs.readFileSync(file)).toString('base64'), mimeType)
                                })
                            );
                        });
                    }
                };

                if (height) {
                    im.crop({
                        width: width,
                        height: height,
                        srcData: data.Body,
                        dstPath: resizedFile,
                        quality: 1,
                        gravity: "Center"
                    }, resizeCallback);
                } else {
                    im.resize({
                        width: width,
                        srcData: data.Body,
                        dstPath: resizedFile
                    }, resizeCallback);
                }
            } catch (err) {
                console.log('ERROR: Resize operation failed:', err);
                return errorResponse(callback, null, 500, err.message);
            }


        }).catch((err) => errorResponse(callback, err));
};


exports.handler = (event, context, callback) => {


    if (!imageBucket) {
        callback('Error: Set environment variable IMAGE_BUCKET');
        return;
    }

    const path = event.path;
    const objectKey = path.substr(1);
    const queryParameters = event.queryStringParameters || {};


    if (!queryParameters.width && !queryParameters.height) {
        return getOriginalFile(imageBucket, objectKey, callback);
    }

    const width = parseInt(queryParameters.width);
    const height = parseInt(queryParameters.height);


    if ((queryParameters.width && isNaN(width)) || (queryParameters.height && isNaN(height))) {
        return errorResponse(callback, "width and height parameters must be integer", 400);
    }

    return getResizedFile(imageBucket, objectKey, width, height, callback);
};