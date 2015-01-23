var debug = require('debug')('Express/HTTPTables');
var HTTPTables = require('httptables');

/*
**
**  Middleware options :
**    rulesPropertyName   The name to look up for rules in the request object
**    errorConstructor    An error constructor which an instance of will be passed to next
**    errorStatus         Which HTTP code to return on error
**    rulesOptions        HttpTables config object
**
*/
function ExpressHTTPTablesMiddleware(options) {
  options = options || {};
  var prop = options.rulesPropertyName || 'rules';
  var httptables = HTTPTables(options.rulesOptions);
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
      var msg = '[EXPRESS/HTTPTables] : Not sufficient rights for url ' + req.url;
      res.status(defaultErrorStatus);
      return next(new Error(msg));
    }
  };
}

module.exports = ExpressHTTPTablesMiddleware;