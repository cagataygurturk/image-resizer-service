var fs = require('fs');

class S3 {

    getObject(params) {

        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    if (params.Key !== "test-notexisting.jpg") {
                        console.log(`Receiving mock image from filesystem`);
                        return resolve({Body: fs.readFileSync(`${__dirname}/puppy.jpg`)});
                    }

                    return reject({ErrorCode: "NotExisting"});
                });
            }
        }

    }
}

module.exports.S3 = S3;