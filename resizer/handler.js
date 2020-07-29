"use strict";

const AWS = require("aws-sdk");
const S3 = new AWS.S3({
    signatureVersion: "v4"
});
const Sharp = require("sharp");

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ALLOWED_RESOLUTIONS = process.env.ALLOWED_RESOLUTIONS
    ? new Set(process.env.ALLOWED_RESOLUTIONS.split(/\s*,\s*/))
    : new Set([]);
const maxAge = 14 * 24 * 60 * 60

module.exports.resizer = function (event, context, callback) {
    const key = event.queryStringParameters.key;
    const match = key.match(/(?<webpsupport>webp)?\/?(?<dimensions>(?<width>\d+)x(?<height>\d+))\/(?<originalKey>.*)/);

    // Check if requested resolution is allowed
    if (0 != ALLOWED_RESOLUTIONS.size && !ALLOWED_RESOLUTIONS.has(match.groups.dimensions)) {
        callback(null, {
            statusCode: "403",
            headers: {},
            body: ""
        });
        return;
    }

    const width = parseInt(match.groups.width, 10);
    const height = parseInt(match.groups.height, 10);
    const originalKey = match.groups.originalKey;

    let webpSupport = match.groups.webpsupport;

    S3.getObject({Bucket: BUCKET, Key: originalKey})
        .promise()
        .then(function (data) {
            let image = Sharp(data.Body).resize(width, height)

            if (webpSupport) {
                image = image.toFormat("webp")
            } else {
                image = image.toFormat("png")
            }
            return image.toBuffer()
        })
        .then(function (buffer) {
            let contentType = 'image/png'
            if (webpSupport) {
                contentType = 'image/webp'
            }
             S3.putObject({
                    Body: buffer,
                    Bucket: BUCKET,
                    ContentType: contentType,
                    CacheControl: `max-age=${maxAge}`,
                    Key: key
                }).promise()
        })
        .then(() =>
            callback(null, {
                statusCode: "301",
                headers: {location: `${URL}/${key}`},
                body: ""
            })
        )
        .catch(err => callback(err));
};
