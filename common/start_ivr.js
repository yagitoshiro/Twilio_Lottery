var twilio = require('twilio');
module.exports = function(res, token){
  var resp = new twilio.TwimlResponse();
  res.writeHead(200, {'Content-Type': 'text/xml'});
  var xml = resp.gather({
    action: '/twilio/cancel/' + token,
    method: 'POST'
  }, function(node){
    node.say('抽選の応募をキャンセルされる場合は番号の１を押してください。', {language: 'ja-jp', loop: 3});
  }).toString();
  res.end(xml);
};

