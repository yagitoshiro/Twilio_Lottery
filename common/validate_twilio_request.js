var twilio = require('twilio');
var Lottery = require(__dirname + '/../models/lottery');
var format_phone_number = require(__dirname + '/../common/format_phone_number');
function validate(req, res, param, callback, error){
  Lottery.find({
    phone_number: format_phone_number(req.body[param].toString())
  }, function(err, doc){
    if(err || doc.length <= 0){
      if(error){
        error();
      }
    }else{
      var header = req.headers['x-twilio-signature'];
      var url = req.protocol + "://" + req.hostname + req.originalUrl;
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
