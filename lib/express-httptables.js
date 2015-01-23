var debug = require('debug')('Express/HTTPTables');
var HTTPTables = require('httptables');

function ExpressHTTPTablesMiddleware(options) {
  options = options || {};
  var prop = options.rulesPropertyName || 'rules';
  var errorConstructor = options.errorConstructor || Error;
  var httptables = HTTPTables(options);
  var defaultErrorStatus = options.errorStatus || 403;
  httptables.setAccessFieldFunction(function expressHeaderAccess(req, field) {
    var _field = (field || "").toUpperCase();
    if(_field === 'URL') {
      return req.url;
    } else if(_field === 'METHOD') {
      return req.method;
    } else {
      return req.get(field);
    }
  });
  debug('Express Middleware initialized');
  return function (req, res, next) {
    var policy = httptables.applyRules(req, req[prop]);
    if(policy === HTTPTables.policies.ACCEPT) {
      return next();
    } else {
      var msg = '[EXPRESS/HTTPTables] : Not sufficient rights for url ' +
        req.url;
      res.status(defaultErrorStatus);
      return next(new (errorConstructor)(msg));
    }
  };
}

module.exports = ExpressHTTPTablesMiddleware;