'use strict';

let config = require('./podcast.config.json');

module.exports = (urls) => {
  let feeds = Object.keys(config);
  let xmls = {};

  for(let i = 0; i < feeds.length; i++) {
    let feedName = feeds[i];

    if(feedName !== "all") {
      xmls[feedName] = generateFeed(feedName, urls);
    }
  }

  return xmls;
}

function generateFeed(feed, urls) {
  console.log(urls.filter(url => url.indexOf(feed) > -1));
  let items = urls.filter(url => url.indexOf(feed) > -1).map(generateItem.bind(0, feed)).join('\n');
  let feedInfo = config[feed];
  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
    <channel>

      <title>${feedInfo.title}</title>
      <description>${feedInfo.description}</description>
      <link>${feedInfo.link}</link>

      <itunes:image href="${feedInfo.itunes.image}" />
      ${items}

    </channel>
  </rss>`
}

function generateItem(feed, url) {
  console.log('url', url);
  let name = url.replace(`http://ordio.s3-website-sa-east-1.amazonaws.com/{$feed}-`, '').replace('.mp3', '');
  return `<item>
  <title>${name}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <description>${name} edition of ${feed}.</description>
  <enclosure url="${url}" type="audio/mpeg" />
  <category>Ordios</category>
  <pubDate>${name}</pubDate>
</item>`
}
