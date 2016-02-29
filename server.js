'use strict';

const SAVE_ROOT = '/var/www/html/';
const PORT = 8083;

const ZAUN_STREAM_HOST = '8663.live.streamtheworld.com';
const ZAUN_STREAM_PORT = 80;
const ZAUN_STREAM_PATH = '/WFANAM_SC'

let http = require('http');
let fs = require('fs');

function handleRequest(request, response){
    response.end('It Works!! Path Hit: ' + request.url);
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});

let options = {
    host: ZAUN_STREAM_HOST,
    port: ZAUN_STREAM_PORT,
    path: ZAUN_STREAM_PATH,
}

let request = http.get(options, (res) => {
    res.setEncoding('binary');
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    setInterval(() => {console.log('writign');
        let date = new Date()
        fs.writeFile(SAVE_ROOT+'WFAN-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getFullYear()+'-'+(date.getHours()-1)+'.mp3', data, 'binary', (err) => {
            if(err) console.error('Ain\'t nothing I can do about it.', err);
            data = '';
        })
    }, 60*60*1000)

    res.on('end', () => {
        let date = new Date()
        fs.writeFile(SAVE_ROOT+'WFAN-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getFullYear()+'-'+(date.getHours()-1)+'.mp3', data, 'binary', (err) => {
            if(err) console.error('Ain\'t nothing I can do about it.', err)
        })
    })
})
