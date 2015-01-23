var http = require('supertest');
var express = require('express');
var HTTPTables = require('httptables');
var httptablesMiddle = require('../lib/express-httptables');
var app = null;
var server = null;

var OKMsg = 'OK';
var OKUrl = '/test';
var KOMsg = 'KO';
var KOUrl = '/blop';

var allRules = [{
  policy : HTTPTables.policies.DROP,
  conditions : {
    'url' : OKUrl
  }
}, {
  policy : HTTPTables.policies.ACCEPT,
  conditions : {
    'url' : OKUrl
  }
}];

var rulesToTestCustomAccessor = [{
  policy : HTTPTables.policies.DROP,
  conditions : {
    'url' : OKUrl,
    'Method' : 'GET',
    'Accept-Encoding' : /.*/
  }
}];

function setRulesOnProperty(prop, rules) {
  return function (req, res, next) {
    req[prop] = rules;
    next();
  };
}

function setTestRouteOnApp(app) {
  app.get('/test', function(req, res, next) {
    res.send(OKMsg);
  });
  app.get('/blop', function(req, res, next) {
    res.send(OKMsg);
  });
  app.use(function (err, req, res, next) {
    var httpCode = (res.statusCode !== 200) ? res.statusCode : 500;
    res.send(KOMsg);
  });
  return app;
}

describe('Express/HTTPTables', function() {
  beforeEach(function () {
    app = express();
  });

  afterEach(function () {
    try {
      server.close();
    } catch(err) {}
    server = null;
    app = null;
  });

  it('should let through non matching request by default', function (done) {
    app.use(setRulesOnProperty('rules', [allRules[0]]));
    app.use(httptablesMiddle());
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(KOUrl).expect(200, OKMsg, done);
  });

  it('should apply correct policy', function (done) {
    app.use(setRulesOnProperty('rules', [allRules[0]]));
    app.use(httptablesMiddle({rulesOptions : {defaultPolicy : HTTPTables.policies.DROP}}));
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(OKUrl).expect(403, KOMsg, done);
  });

  it('should have "rules" as the default property', function (done) {
    app.use(setRulesOnProperty('rules', allRules));
    app.use(httptablesMiddle());
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(OKUrl).expect(403, KOMsg, done);
  });

  it('should be possible to change the rules default property', function (done) {
    app.use(setRulesOnProperty('_rules', allRules));
    app.use(httptablesMiddle({rulesPropertyName : '_rules'}));
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(OKUrl).expect(403, KOMsg, done);
  });

  it('should be possible to change internal HttpTable instance', function (done) {
    app.use(setRulesOnProperty('rules', [allRules[1]]));
    app.use(httptablesMiddle({rulesOptions : {defaultPolicy : HTTPTables.policies.DROP}}));
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(KOUrl).expect(403, KOMsg, done);
  });

  it('should be able to change HTTP error code', function (done) {
    app.use(setRulesOnProperty('rules', [allRules[0]]));
    app.use(httptablesMiddle({errorStatus : 401}));
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(OKUrl).expect(401, KOMsg, done);
  });

  it('should be able to access all headers', function (done) {
    app.use(setRulesOnProperty('rules', rulesToTestCustomAccessor));
    app.use(httptablesMiddle());
    app = setTestRouteOnApp(app);
    server = app.listen();
    http(app).get(OKUrl).expect(403, KOMsg, done);
  });
});
