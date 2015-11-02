var twilio = require('twilio');
var Lottery = require(__dirname + '/../models/lottery');
var format_phone_number = require(__dirname + '/../common/format_phone_number');
function validate(req, res, param, callback, error){
console.log("===end===");
console.log(req.body);
console.log(format_phone_number(req.body[param]));
console.log("===end===");
  Lottery.find({
    phone_number: format_phone_number(req.body[param].toString())
  }, function(err, doc){
console.log(err);
console.log(doc.length);
console.log(doc[0].auth_token);
    if(err || doc.length <= 0){
      if(error){
        error();
      }
    }else{
      var header = req.headers['x-twilio-signature'];
      var url = req.protocol + "://" + req.hostname + req.originalUrl;
console.log(header);
console.log(url);
      if(twilio.validateRequest(doc[0].auth_token, header, url, req.body)){
        callback();
      }else{
        if(error){
          error();
        }
      }
    }
  });
//  callback();
}

module.exports = validate;
