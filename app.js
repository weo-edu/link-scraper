var express = require('express')
  , cheerio = require('cheerio')
  , request = require('superagent')
  , _ = require('lodash')
  , app = module.exports = express();

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});


function parse(html, url) {
  var $ = cheerio.load(html)
    , data = {};

  $('meta[property^=og]').each(function(i, el) {
    data[el.attribs.property] = el.attribs.content;
  });

  data.title = data['og:title'] || $('title').text();
  data.image = data['og:image'] || $('img').eq(0).attr('src');
  if(data.image)
    data.image = require('url').resolve(url, data.image);
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
  var url = normalize(req.param('url'));
  retrieve(url, function(err, response) {
    if(err) return res.send(err);

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

app.listen(5000);