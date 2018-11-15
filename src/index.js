const {errorResponse} = require("./response");
const url = require('url');
const { original, autoOrient } = require("./image");

exports.handler = (event) => new Promise((resolve, reject) => {
    const queryParameters = event.queryStringParameters || {};

    const imageBucket = queryParameters.bucket || process.env.IMAGE_BUCKET;

    if (!imageBucket) {
        return reject(`Error: Set environment variable IMAGE_BUCKET`);
    }

    const path = event.path;
    const objectKey = url.parse(path).pathname.replace(/^\/+/g, '');
    console.log('INFO: key: ' + objectKey);

    return autoOrient(imageBucket, objectKey)
        .then(resolve)
        .catch(reject);
});
