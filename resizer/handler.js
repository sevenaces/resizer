'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
    signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ALLOWED_RESOLUTIONS = process.env.ALLOWED_RESOLUTIONS ? new Set(process.env.ALLOWED_RESOLUTIONS.split(/\s*,\s*/)) : new Set([]);

module.exports.resizer = function (event, context, callback) {
    const key = event.queryStringParameters.key;

    // const match = key.match(/((\d+)x(\d+))\/(.*)/);

    //Check if requested resolution is allowed
    // if(0 != ALLOWED_RESOLUTIONS.size && !ALLOWED_RESOLUTIONS.has(match[1]) ) {
    //   callback(null, {
    //     statusCode: '403',
    //     headers: {},
    //     body: '',
    //   });
    //   return;
    // }

    const match = key.match(/\d+x\d+,.*\/.*/)
    let params = match[0].split(',');
    let originalKey = '';
    let args = [];
    let width = 0;
    let height = 0;

    originalKey = params[params.length - 1];

    log += "Original Key: " + originalKey + "\n";

    width = parseInt(params[0].split('x')[0]);
    height = parseInt(params[0].split('x')[1]);

    log += "Width: " + width + "\n";
    log += "Height: " + height + "\n";


    for (let i = 1; i < params.length; i++) {
        if (ALLOWED_PARAMS.includes(params[i])) {
            args.push(params[i]);
        }
    }

    for (let j = 0; j < args.length; i++) {
        log += "args: " + args[j] + "\n";
    }


    // const width = parseInt(match[2], 10);
    // const height = parseInt(match[3], 10);
    // const originalKey = match[4];

    if (args.include('webp')) {
        S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
            .then(data => Sharp(data.Body)
                .resize({width: width; height: height})
                .toFormat('webp')
                .webp({lossless: true})
                .toBuffer()
            )
            .then(buffer => S3.putObject({
                    Body: buffer,
                    Bucket: BUCKET,
                    ContentType: 'image/webp',
                    Key: key,
                }).promise()
            )
            .then(() => callback(null, {
                    statusCode: '301',
                    headers: {'location': `${URL}/${key}`},
                    body: '',
                })
            )
            .catch(err => callback(err))
    } else {
        S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
            .then(data => Sharp(data.Body)
                .resize({width: width; height: height})
                .toFormat('png')
                .webp({lossless: true})
                .toBuffer()
            )
            .then(buffer => S3.putObject({
                    Body: buffer,
                    Bucket: BUCKET,
                    ContentType: 'image/png',
                    Key: key,
                }).promise()
            )
            .then(() => callback(null, {
                    statusCode: '301',
                    headers: {'location': `${URL}/${key}`},
                    body: '',
                })
            )
            .catch(err => callback(err))
    }

}