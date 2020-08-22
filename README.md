# CloudFront Resize on the Fly

This deployment/process ensures that cloudfront can deliver images on the fly which are resized based on the given dimensions, and in the format needed.
For now, this supports only `webp` or `png` format. 

## Usage

1. Say there is an image in your S3 bucket, at address `s3://folder/image.jpg`, then it'll be available on cloudfront at `CLOUDFRONT_URL/folder/image.jpg`
2. To get a resized image, go to `CLOUDFRONT_URL/{width}x{height}/folder/image.jpg` 
3. To get a resized imagedd, in webp format, go to `CLOUDFRONT_URL/webp/{width}x{height}/folder/image.jpg`
4. To get a resized image with only one dimension, say height, pass the other as 0. This would always maintain the aspect ratio
5. To convert an image to webp, without resizing it, pass both height and width as 0.


## Architecture:

The broad flow is as follows:
1. User requests an image from cloudfront, passing paramters for width, height and format in the URL
2. Cloudfront, delivers image if it has it in cache, else goes to step 3
3. Cloufront, looks up a S3 bucket to check if resource is available
4. If resource available in S3, with the same size/format, cloudfront would return that. Else, step 4.
5. If S3 does not have that resource, then using S3 Website Hosting, and Rerouting Rules, the 404 URL is redirected an an `API Gateway`
6. The API Gateway, invokes a Lambda, which would read the height, width and format, and create the resource on S3, and redirect back to that URL

## Setup and Installation

### Prerequisites
1. [aws-cli](https://aws.amazon.com/cli/)
2. [Serverless](https://www.serverless.com/)
3. [Node.js](https://nodejs.org/en/)

### Setup
1. Once `aws-cli` is installed, ensure it's configured with the right access keys using `aws configure`. Ensure that the user here, has permission to:
    a. Create Lambda Functions, API Gateway
    b. Read/Write from S3 Buckets (at lease the one you are operating with)
    c. Can create Cloudwatch Log Groups (Optional: So that you can see logs)
2. Create S3 bucket, if not already. Let's call it `SOURCE_BUCKET`. Ensure you don't `Block Public Access` as well as use the Policy from the appendix to make items public.
3. Set up `Static Website Hosting` for it, and note the Hosted URL. Let's call that `SOURCE_BUCKET_HOSTED_URL`
4. Create Cloudfront Distribution with `SOURCE_BUCKET_HOSTED_URL` as the `ORIGIN`. Once done, note the URL of the distribution. Let's call that `CLOUDFRONT_URL`
5. (Optional) You can map a custom domain to this `CLOUDFRONT_URL`
6. Open the Repo, and via shell, head to `resizer` folder
7. Configure Lambda method by editing the `serverless.yml`. Things to configure:
    a. `BUCKET`: Name of `SOURCE_BUCKET`
    b. `URL`: `CLOUDFRONT_URL` 
8. Run `npm install` (This would install all needed packages)
9. This would install the wrong version of `sharp` the library used to resize images. Since you most likely aren't using the same OS as Lambda. To fix this, refer to appendix.
10. Run `sls deploy`
11. Once the deploy is done, this would also create an API Endpoint. Note that URL. Let's call that `API_GATEWAY_URL`. This would of the form `https://{some_id}.execute-api.{aws-region}.amazonaws.com/{stage}/resizer`. Let's split this into two parts. Let's call them:
    a. `API_GATEWAY_HOST`: `{some_id}.execute-api.{aws-region}.amazonaws.com` (Note, no `https`)  
    a. `API_GATEWAY_PATH`: `{stage}/resizer`
12. From the appendix, copy the `S3 Routing Rules Template` and replace these two variables. This can be pasted in the `S3 Static Website Hosting` section on S3, under Rewriting Rules
13. To avoid Cloudfront from caching the redirect, we have to set custom TTL on cloudfront. Set Minimum and Default to 0. (Since the assets added via this lambda automatically have a TTL/Max-age, those would get overwritten, just not for the redirects)
14. Please note, that if you are pushing images to this S3 bucket, make sure you explicitly set a max-age

## Appendix

### Sharp for Lambda
Run the following two commands:
1. `rm -rf node_modules/sharp`
2. `npm install --arch=x64 --platform=linux sharp`

### S3 Public Bucket Policy
Don't forget to replace `BUCKET_NAME` with your `BUCKET_NAME`

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::{{BUCKET_NAME}}/*"
        }
    ]
}
``` 


### S3 Routing Rules Template

```xml
<RoutingRules>
  <RoutingRule>
    <Condition>
      <KeyPrefixEquals/>
      <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals>
    </Condition>
    <Redirect>
      <Protocol>https</Protocol>
      <HostName>{{API_GATEWAY_HOST}}</HostName>
      <ReplaceKeyPrefixWith>{{API_GATEWAY_PATH}}?key=</ReplaceKeyPrefixWith>
      <HttpRedirectCode>307</HttpRedirectCode>
    </Redirect>
  </RoutingRule>
</RoutingRules>
```



## Credits
1. To [@pavangowdasu](https://github.com/pavangowdasu) with a lot of JS code! And in general, helping me with code always! 
2. This is based on [this hackernoon post](https://hackernoon.com/image-resizing-after-upload-with-amazon-s3-aws-lambda-and-cloudfront-for-ssl-loce3y0h) by [@manjillama](https://github.com/manjillama)

## How to contribute
Feel free to fork the repo and submit a pull request. I'm fairly novice at Javascript so I'm pretty sure someone else can seriously improve this.
