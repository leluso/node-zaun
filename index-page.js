#!/usr/bin/env node

'use strict';

const AWS = require('aws-sdk');
const rssGenerator = require('./podcastrss');
const async = require('async');

let s3 = new AWS.S3({
  params: {
    Bucket: 'ordio'
  }
});

console.log('Uploaded media');
s3ListAll({
  Bucket: 'ordio'
}, function(results) {
  results.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
  console.log('Listed');
  let tableBody = results.reduce((t, o) => {
    //console.log(o.Key);
    return t + (o.Key.endsWith('.html') ? '' : `<tr>
      <td><a href="${'/' + o.Key}">${o.Key}</a></td>
      <td><a href="http://cdn.leluso.com/al?u=http://ordio.s3-website-sa-east-1.amazonaws.com/${o.Key}">al</a></td>
      <td>${o.LastModified}</td>
      <td>${o.Size}</td>
      </tr>`);
  }, '')
  let index = `<head><title>wfan.leluso</title>${ style() }</head>
  <h2>wfan.leluso</h2>
  <table>
  <tr>
  <th>URL</th>
  <th>AL</th>
  <th>Date Created</th>
  <th>Size</th>
  </tr>
  ${ tableBody }
  </table>`;

  s3.upload({
    Key: 'index.html',
    Body: index,
    ContentType: 'text/html',
  }, function(err, data) {
    console.log('Uploaded index');
    let feeds = rssGenerator(results.map(r => `http://ordio.s3-website-sa-east-1.amazonaws.com/${r.Key}`));
    async.forEachOf(feeds, (xml, feed, cb) => {
      console.log('Uploading', `${feed}.rss.xml`);
      s3.upload({
        Key: `${feed}.rss.xml`,
        Body: feeds[feed],
        ContentType: 'text/xml',
      }, (err, data) => {
        console.log('Uploaded feed');
        cb(err);
      });
    }, (err) => {
      console.log('Done recording');
      process.exit(err);
    });
  });
});

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
      Marker: marker,
    }, function(err, data) {
      allKeys = allKeys.concat(data.Contents);
      if (data.Contents.length === data.MaxKeys) {
        const lastMarker = data.Contents[data.Contents.length-1].Key;
        listAllKeys(bucket, lastMarker, cb);
      }
      else
        cb();
    });
  }
}

function style() {
  return `<style>
  @import 'https://fonts.googleapis.com/css?family=Roboto:300,400,500';
  body {
    margin: 0 auto;
    max-width: 50em;
    font-family: Roboto, "Helvetica", "Arial", sans-serif;
    line-height: 1.5;
    padding: 2em 1em;
    color: #555;
  }

  table { border: none; border-collapse: collapse; }
  /*        table td { border-left: 1px solid #000; }*/
  /*        table td:first-child{ border-left: none; }*/

  table tr:first-child { border-bottom: 1px solid #000; }

  table tr td:last-child:after {
    content: ' bytes';
  }

  td, th {
    padding: 5px;
    /*
    border-left-color: black;
    border-left-style: solid;
    border-left-width: 1px;

    border-right-color: black;
    border-right-style: solid;
    border-right-width: 1px;
    */
  }

  h2 {
    margin-top: 1em;
    padding-top: 1em;
  }

  h1,
  h2,
  strong {
    color: #333;
  }

  a {
    color: #582c83;
    text-decoration: none;
  }

  a:hover {
    border-bottom-color: #582c83;
    border-bottom-style: solid;
    border-bottom-width: 1px;
  }
  </style>`;
}
