'use strict';

// const Sharp = require('sharp');
var http = require("http");

const ALLOWED_PARAMS = ['webp']

http.createServer(function (request, response) {
    let log = "***\n\n\n";
    let key = 'https://cdn-1.b2brain.com/300x100,webp,asd/test.jpg'
    const match = key.match(/\d+x\d+,.*\/.*/)
    let params = match[0].split(',');
    let originalKey = '';
    let args = [];
    let width = 0;
    let height = 0;

    originalKey = params[params.length-1];

    log += "Original Key: " + originalKey + "\n";

    width = parseInt(params[0].split('x')[0]);
    height = parseInt(params[0].split('x')[1]);

    log += "Width: " + width + "\n";
    log += "Height: " + height + "\n";


    for(var i = 1; i < params.length; i++) {
        if (ALLOWED_PARAMS.includes(params[i])) {
            args.push(params[i]);
        }
    }

    for(var i = 0; i < args.length; i++) {
        log += "args: " + args[i] + "\n";
    }






    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(log)


}).listen(8081);