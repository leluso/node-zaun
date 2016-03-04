#!/usr/bin/env /usr/local/bin/node
'use strict';

// By Justin Barber

const SAVE_ROOT = '/var/www/html/';

const DEFAULT_PORT = 80;
const DEFAULT_LENGTH = 60*60;
const DEFAULT_PATH = '';

let http = require('http');
let fs = require('fs');
let program = require('commander');

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
                   fs.writeFile(SAVE_ROOT+fileName, data, 'binary', (err) => {
                       if(err) console.error('Ain\'t nothing I can do about it.', err);
                       data = '';
                       process.exit();
                   })
               }, program.length*1000)

               res.on('end', () => {
                   let date = new Date()
                   fs.writeFile(SAVE_ROOT+fileName, data, 'binary', (err) => {
                       if(err) console.error('Ain\'t nothing I can do about it.', err)
                   })
               })


           })

       })
       .parse(process.argv);
