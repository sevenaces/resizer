'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
    signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ALLOWED_RESOLUTIONS = process.env.ALLOWED_RESOLUTIONS ? new Set(process.env.ALLOWED_RESOLUTIONS.split(/\s*,\s*/)) : new Set([]);
const ALLOWED_PARAMS = ['webp']

module.exports.resizer = function (event, context, callback) {
    const key = event.queryStringParameters.key;
    const match = key.match(/\d+x\d+,.*\/.*/)
    let params = match[0].split(',');
    params[params.length-1] = params[params.length-1].split('/')[0]
    params[params.length] = params[params.length-1].split('/')[1]
    let originalKey = '';
    let args = [];
    let width = 0;
    let height = 0;

    let log = "";

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


    if (args.includes('webp'))
    {
        S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
            .then(data => Sharp(data.Body)
                .resize({width: width, height: height})
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
            .catch(err => callback(err, {
                statusCode: '404',
                body: err
            }))
    } else {
        S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
            .then(data => Sharp(data.Body)
                .resize({width: width, height: height})
                .toFormat('png')
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
            .catch(err => callback(err, {
                statusCode: '404',
                body: err
            }));
    }
}