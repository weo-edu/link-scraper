var _ = require('lodash')
  , app = require('../')
  , request = require('supertest');

describe('link-scraper', function() {
  it('should parse google.com', function(done) {
    request(app)
      .get('/?url=google.com')
      .expect('Content-Type', /json/)
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
    request(app)
      .get('/?url=github.com')
      .expect('Content-Type', /json/)
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
});