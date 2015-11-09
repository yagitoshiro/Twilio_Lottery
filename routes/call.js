var validate_twilio_request = require(__dirname + '/../common/validate_twilio_request');
var twilio = require('twilio');
var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var History = require(__dirname + '/../models/history');
var send_xml = require(__dirname + '/../common/send_xml');
var phone_call = require(__dirname + '/../common/phone_call');
var speak_error_message = require(__dirname + '/../common/speak_error_message');
var shuffle = require(__dirname + '/../common/shuffle');

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
          xml = resp.play(req.protocol + "://" + req.hostname + "" + l.voice_file.replace(/public/, '').replace(/\\/g, '/')).dial({
            timeout: 15
          }, function(node){
            node.conference(l.token, {
              beep: false
            });
          });
          send_xml(res, xml);
        }else{
          //speak_error_message(res, l.voice_text);
          xml = resp.say(l.voice_text, {language: 'ja-jp'}).dial({timeout: 15}, function(node){
            node.conference(l.token, {beep: false});
          });
          send_xml(res, xml);
        }
      }
    });
  });
});

//主催者
router.post('/admin/:token/:max/:no_dup', function(req, res, next){
  var resp = new twilio.TwimlResponse();
  validate_twilio_request(req, res, 'Caller', function(e){
    Lottery.find({token: req.params.token}, function(err, docs){
      if(err){
        speak_error_message(res, "エラーが発生しました。通話を終了します");
      }else{
        var l = docs[0];
        var xml = resp.say("当選者と電話をつなげます。お待ち下さい。", {language: 'ja-jp'}).dial({}, function(node){
          node.conference(l.token, {endConferenceOnExit: true, beep: true});
        });
        send_xml(res, xml);
        // 当選処理開始
        console.log("start calling to winners");
        do_lottery(req, l);
      }
    });
  });
});

function do_lottery(req, lottery){
  var args = {token: req.params.token};
  if(req.params.no_dup === "on"){
    args.status = {'$ne': 'won'};
  }
  Phone.find(args, function(err, docs){
    if(!err){
      if(!req.params.no_dup){
        clear_all(docs, function(){
          call_to_winners(lottery, docs, req.params.max);
        });
      }else{
        call_to_winners(lottery, docs, req);
      }
    }
  });
}

function call_to_winners(lottery, phones, req){
  var data = shuffle(phones);
  for(var i = 0, len = data.length; i < req.params.max; i++){
    data[i].status = 'calling';
    phone_call(req, {data: data[i], lottery: lottery});
  }
  var history = new History();
  history.numbers = len;
  history.save(function(e){});
}

module.exports = router;
