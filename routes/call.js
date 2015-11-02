var validate_twilio_request = require(__dirname + '/../common/validate_twilio_request');
var twilio = require('twilio');
var Lottery = require(__dirname + '/../models/lottery');
var send_xml = require(__dirname + '/../common/send_xml');
var speak_error_message = require(__dirname + '/../common/speak_error_message');
var express = require('express');
var router = express.Router();

router.post('/:token', function(req, res, next){
  var resp = new twilio.TwimlResponse();
  validate_twilio_request(req, res, 'Caller', function(e){
    Lottery.find({token: req.params.token}, function(err, docs){
      if(err){
        speak_error_message(res, "エラーが発生しました。通話を終了します");
      }else{
        var l = docs[0];
        if(l.voice_file){
          send_xml(res, resp.play(req.protocol + "://" + req.hostname + "" + l.voice_file.replace(/public/, '').replace(/\\/g, '/')));
        }else{
          speak_error_message(res, l.voice_text);
        }
      }
    });
  });
});

router.post('/conference/user/:token', function(req, res, next){
  var resp = new twilio.TwimlResponse();
  validate_twilio_request(req, res, 'Caller', function(e){
    Lottery.find({token: req.params.token}, function(err, docs){
      if(err){
        speak_error_message(res, "エラーが発生しました。通話を終了します");
      }else{
        var l = docs[0];
        var xml;
        if(l.voice_file){
          xml = resp.say("主催者と電話をつなげます。お待ち下さい。", {language: 'ja-jp'}).play(req.protocol + "://" + req.hostname + "" + l.voice_file.replace(/public/, '').replace(/\\/g, '/')).dial({

          }, function(node){
            node.conference(l.token, {
              beep: false
            })
          });
          send_xml(res, xml);
        }else{
          //speak_error_message(res, l.voice_text);
          xml = resp.say("主催者と電話をつなげます。お待ち下さい。" + l.voice_text, {language: 'ja-jp'}).dial({}, function(node){
            node.conference(l.token, {beep: false})
          });
          send_xml(res, xml);
        }
      }
    });
  });
});

//主催者
router.post('/admin/:token', function(req, res, next){
  var resp = new twilio.TwimlResponse();
  validate_twilio_request(req, res, 'Caller', function(e){
    Lottery.find({token: req.params.token}, function(err, docs){
      if(err){
        speak_error_message(res, "エラーが発生しました。通話を終了します");
      }else{
        var l = docs[0];
        var xml = resp.say("当選者と電話をつなげます。お待ち下さい。", {language: 'ja-jp'}).dial({timeLimit: 15}, function(node){
          node.conference(l.token, {endConferenceOnExit: true, beep: false});
        });
        send_xml(res, xml);
      }
    });
  });
});

module.exports = router;
