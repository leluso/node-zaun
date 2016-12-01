#!/usr/bin/env node

'use strict';

// By Justin Barber

const SAVE_ROOT = '/var/www/html/';

const DEFAULT_PORT = 80;
const DEFAULT_LENGTH = 60 * 60;
const DEFAULT_PATH = '';

let http = require('http');
let fs = require('fs');
let program = require('commander');
let AWS = require('aws-sdk');
let async = require('async');

let s3 = new AWS.S3({
  params: {
    Bucket: 'ordio'
  }
});

program.arguments('<stream>')
  .option('-d, --path <path>', 'Path to collect stream from. Assumes /', DEFAULT_PATH)
  .option('-p, --port <port>', 'Port number. Assumes 80', DEFAULT_PORT)
  .option('-b, --brand <brand>')
  .option('-l, --length <length>', 'Length to record, in seconds. Defaults to an hour', DEFAULT_LENGTH)
  .action((stream) => {
    let options = {
      host: stream,
      port: program.port,
      path: '/' + program.path,
    }


    console.log('Picking up: ', options);
    http.get(options, (res) => {
      let date = new Date();
      let brand = program.brand ? program.brand + '-' : '';
      let fileName = brand + date.toDateString().replace(/\s/g, '-') + '-' + date.toTimeString().substring(0, 8).replace(/:/g, '-') + '.mp3';
      console.log(fileName);
      res.setEncoding('binary');
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      setTimeout(() => {
        console.log('Time\'s up', date);
        console.log('Uploading...');
        data = Buffer.from(data, 'binary');
        s3.upload({
          Key: fileName,
          Body: data,
          ContentType: 'audio/mpeg'
        }, function(err, data) {
          if (err) {
            console.error('Error uploading', err);
          }

          process.exit(err);
        });
      }, program.length * 1000)

      res.on('end', () => {
        console.log('Uploading...');
        console.log('Stream ended', data);
        data = Buffer.from(data, 'binary');
        s3.upload({
          Key: fileName,
          Body: data,
          ContentType: 'audio/mpeg'
        }, function(err, data) {
          if (err) {
            console.error('Error uploading', err);
          }

          process.exit(err);
        });
      });
    }).on('error', (e) => console.log(e));

  })
  .parse(process.argv);

function s3ListAll(params, callback) {
  let allKeys = [];
  console.log('listing...');
  listAllKeys(params.Bucket, params.Marker, function() {
    console.log('Got list');
    callback(allKeys);
  });

  function listAllKeys(bucket, marker, cb) {
    s3.listObjects({
      Bucket: bucket,
      Marker: marker
    }, function(err, data) {
      allKeys = allKeys.concat(data.Contents);
      console.log(data.IsTruncated, data.NextMarker);
      if (data.NextMarker)
        listAllKeys(bucket, data.NextMarker, cb);
      else
        cb();
    });
  }
}


