const {handler} = require("./index");
const utils = require('aws-lambda-test-utils');
const mockContextCreator = utils.mockContextCreator;
const isBase64 = require('is-base64');

const eventWithNotExistingImage = {
    "body": "",
    "resource": "/{proxy+}",
    "queryStringParameters": {
        "width": "50",
        "height": "50"
    },
    "path": "/test-notexisting.jpg"
};

const eventWithInvalidSizes = {
    "body": "",
    "resource": "/{proxy+}",
    "queryStringParameters": {
        "width": "asd",
        "height": "50"
    },
    "path": "/test-eventWithInvalidSizes.jpg"
};

const eventWithValidImageAndSizes = {
    "body": "",
    "resource": "/{proxy+}",
    "queryStringParameters": {
        "width": "50",
        "height": "50"
    },
    "path": "/test-eventWithValidImageAndSizes.jpg"
};
const eventWithValidImageAndWithoutSizes = {
    "body": "",
    "resource": "/{proxy+}",
    "queryStringParameters": {},
    "path": "/test-eventWithValidImageAndWithoutSizes.jpg"
};

jest.mock('aws-sdk');


describe(`Failure cases`, () => {


    test(`Require environment variables`, done => {

        handler(eventWithValidImageAndSizes, mockContextCreator)

            .catch(e => {
                expect(e).toBe(
                    `Error: Set environment variable IMAGE_BUCKET`
                );
                done();
            });

    });

    test(`Fail with not integer width and height attributes`, done => {

        process.env.IMAGE_BUCKET = "TEST_BUCKET";

        handler(eventWithInvalidSizes, mockContextCreator)
            .catch(error => {
                expect(error.statusCode).toBe(
                    400
                );
                expect(error.headers["X-Error"]).toBe(
                    `width and height parameters must be integer`
                );
                done();
            });

    });

    test(`Not existing image`, done => {

        process.env.IMAGE_BUCKET = "TEST_BUCKET";

        handler(eventWithNotExistingImage, mockContextCreator)
            .catch(error => {
                expect(error.statusCode).toBe(
                    404
                );
                done();
            });

    });
});


describe(`Success cases`, () => {


    test(`Get resized image`, done => {


        process.env.IMAGE_BUCKET = "TEST_BUCKET";

        handler(eventWithValidImageAndSizes, mockContextCreator)
            .then(response => {
                expect(response.statusCode).toBe(
                    200
                );
                expect(isBase64(response.body)).toBeTruthy();
                done();
            });

    });

    test(`Get original image`, done => {


        process.env.IMAGE_BUCKET = "TEST_BUCKET";


        handler(eventWithValidImageAndWithoutSizes, mockContextCreator)
            .then(response => {
                expect(response.statusCode).toBe(
                    200
                );
                expect(isBase64(response.body)).toBeTruthy();
                done();
            });

    });

});