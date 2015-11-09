var Lottery = require(__dirname + '/../models/lottery');
var twilio = require('twilio');

function create_conference_call(req, lottery, callback){
  var client = new twilio.RestClient(lottery.account_sid, lottery.auth_token);
  client.makeCall({
    to: '+' + lottery.admin_phone_number,
    from: '+' + lottery.phone_number,
    url: req.protocol + "://" + req.hostname + '/call/admin/' + lottery.token,
    fallbackUrl: req.protocol + "://" + req.hostname + '/fallback/' + lottery.token,
    statusCallback: req.protocol + "://" + req.hostname + '/status/' + lottery.token
  }, function(err, call){
    if(err){
      console.log(err);
    }else{
      callback();
    }
  });
}

module.exports = create_conference_call;
