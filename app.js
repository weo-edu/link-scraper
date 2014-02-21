var express = require('express')
  , cheerio = require('cheerio')
  , request = require('superagent')
  , _ = require('lodash')
  , cors = require('cors')
  , app = module.exports = express();

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.use(cors());

var parsers = [
  function openGraph($, data, url) {
    $('meta[property^=og]').each(function(i, el) {
      data[el.attribs.property] = el.attribs.content;
    });
  },
  function meta($, data, url) {
    $('meta[itemprop]').each(function(i, el) {
      data['meta:' + el.attribs.itemprop] = el.attribs.content;
    });
  },
  function firstImgTag($, data, url) {
    data.firstImage = $('img').eq(0).attr('src');
  },
  function titleTag($, data, url) {
    data.titleTag = $('title').text();
  }
];

var transforms = [
  function(data, url) {
    data.image = data['og:image'] || data['meta:image'] || data.firstImage;
  },
  function(data, url) {
    data.title = data['og:title'] || data.titleTag;
  },
  function(data, url) {
    data.image = require('url').resolve(url, data.image);
  }
];

function parse(html, url, cb) {
  var $ = cheerio.load(html)
    , data = {};

  _.each(parsers, function(fn) {
    fn($, data, url);
  });

  _.each(transforms, function(fn) {
    fn(data, url);
  });

  return data;
}

function retrieve(url, cb) {
  request
    .get(url)
    .end(function(err, res) {
      if(err) return cb(err, null);
      cb(null, res);
    });
}

function normalize(url, protocol) {
  protocol = protocol || 'http';
  if(! /^https?\:\/\/.*/.test(url))
    url = protocol + '://' + url;
  return url;
}

app.get('/', function(req, res) {
  console.log('req', req.headers);
  function fail() {
    res.json(404, {error: 'Failed to fetch url'});
  }

  var url = normalize(req.param('url'));
  if(! url) return fail();

  retrieve(url, function(err, response) {
    if(err || response.status !== 200) return fail();

    var parts = response.type.split('/')
      , data = {title: url, url: url, content: parts[0]};

    switch(parts[0]) {
    case 'text':
    if(parts[1] === 'html')
      _.extend(data, parse(response.text, url));
    break;
    case 'image':
      data.image = url;
    break;
    case 'video':
      data.image = ''; // Default video icon?
    break;
    case 'audio':
      data.image = ''; // Default audio icon?
      break;
    }

    res.json(data);
  });
});

var port = process.env.PORT || 5000;
app.listen(port);
console.log('listening on port', port);