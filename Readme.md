# image-resizer-service

This serverless application deploys a Lambda function and API Gateway to your AWS account that reads images from a S3 bucket (whose name defined at deployment) and serves them through API Gateway.

The API Gateway respects the file organization on S3 bucket. For example, an image stored in s3://example-bucket/example-folder/example.jpg will be served from https://xxxxxx.execute-api.us-east-1.amazonaws.com/production/example-folder/example.jpg

To resize the same image, simply give dimensions as `width` and `height` GET parameters.

**IMPORTANT:** This application requires Imagick to be deployed in the Lambda runtime. The easiest way of accomplishing this is to deploy [this](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/create/app?applicationId=arn:aws:serverlessrepo:us-east-1:145266761615:applications/image-magick-lambda-layer) serverless application. After deploying it, please note down the ARN of the Lambda layer created since this application will require that ARN as a parameter.

After deploying the application, you are strongly recommended to deploy a CDN distribution in front of API Gateway, so your responses are cached and it will improve performance and reduce costs significantly.

## Release Notes

### 0.1.4

- Upgrade to Node 14.x runtime

### 0.1.3

- Upgrade to Node 10.x runtime (#9)
- Better handling of accents or special characters (#6)

### 0.1.2

- Bugfix (#3)

### 0.1.1

- Major refactor, increase test coverage, full ES6 migration.
- ability to adjust Lambda memmory size.

### 0.1

Initial version

## License

MIT License (MIT)
