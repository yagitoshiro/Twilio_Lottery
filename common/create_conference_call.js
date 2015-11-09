var Lottery = require(__dirname + '/../models/lottery');
var twilio = require('twilio');

var i = 0;

function create_conference_call(req, lottery){
  var client = new twilio.RestClient(lottery.account_sid, lottery.auth_token);
  client.makeCall({
    to: '+' + lottery.admin_phone_number,
    from: '+' + lottery.phone_number,
    url: req.protocol + "://" + req.hostname + '/call/admin/' + lottery.token + "/" + req.body.num + "/" + req.body.no_dup,
    fallbackUrl: req.protocol + "://" + req.hostname + '/fallback/' + lottery.token,
    statusCallback: req.protocol + "://" + req.hostname + '/status/' + lottery.token
  }, function(err, call){
    if(err !== null){
      //i++;
      //if(i > 2){
      //  create_conference_call(req, lottery);
      //}
    }//else{
    //  callback();
    //}
  });
}

module.exports = create_conference_call;
