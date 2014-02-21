var _ = require('lodash')
  , app = require('../')
  , request = require('supertest');

function scrape(url) {
  return request(app)
    .get('/?url=' + url)
    .expect('Content-Type', /json/);
}

describe('link-scraper', function() {
  it('should parse google.com', function(done) {
    scrape('google.com')
      .expect(200)
      .expect(function(res) {
        if(res.body.title !== 'Google')
          return 'Bad title: ' + res.body.title;
      })
      .expect(function(res) {
        // They might change their image url, but it seems
        // reasonable to assume we should always be able to
        // find one
        if(! res.body.image)
          return "No image found on google.com";
      })
      .end(function(err, res) {
        if(err) throw err;
        done();
      });
  });

  it('should parse github.com', function(done) {
    scrape('github.com')
      .expect(200)
      .expect(function(res) {
        if(! res.body.title)
          return 'Bad title: ' + res.body.title;
      })
      .expect(function(res) {
        // They might change their image url, but it seems
        // reasonable to assume we should always be able to
        // find one
        if(! res.body.image)
          return "No image found on github.com";
      })
      .end(function(err, res) {
        if(err) throw err;
        done();
      });
  });

  it('should parse facebook.com', function(done) {
    scrape('facebook.com')
      .expect(200)
      .expect(function(res) {
        if(res.body.content !== 'text'
          || res.body['og:site_name'] !== 'Facebook')
          return 'Failed to parse facebook.com';
      })
      .end(function(err, res) {
        if(err) throw err;
        done();
      });
  });

  it('should scrape a youtube video', function(done) {
    scrape('https://www.youtube.com/watch?v=jr9kU1xDa9M')
      .expect(200)
      .expect(function(res) {
        if(res.body['og:site_name'] !== 'YouTube'
          || res.body['og:title'] !== 'Furmulation'
          || res.body['og:description'] !== 'Furman'
          || ! res.body['og:video'])
          return 'Failed to parse youtube video';
      })
      .end(function(err, res) {
        if(err) throw err;
        done();
      });
  });
});