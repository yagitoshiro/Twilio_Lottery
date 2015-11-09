var twilio = require('twilio');
var validate_twilio_request = require(__dirname + '/../common/validate_twilio_request');
var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var speak_error_message = require(__dirname + '/../common/speak_error_message');
var format_phone_number = require(__dirname + '/../common/format_phone_number');
var send_sms = require(__dirname + '/../common/send_sms');
var speak_error_message = require(__dirname + '/../common/speak_error_message');
var send_xml = require(__dirname + '/../common/send_xml');
var start_ivr = require(__dirname + '/../common/start_ivr');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next){
  validate_twilio_request(req, res, 'Called', function(e){
    //Toからアプリケーションとユーザを検索
    Lottery.find({phone_number: format_phone_number(req.body.To)}, function(err, docs){
      if(err || docs.length <= 0){
        //見つからなかったらエラー処理
        speak_error_message(res, 'おかけになった電話番号は既に抽選が終了しているか、登録されていないためご利用できません');
      }else{
        //見つかったら通話履歴チェック
        var lottery_data = docs[0];
        Phone.find({token: lottery_data.token, phone_number: format_phone_number(req.body.From)}, function(err, p_docs){
          if(err || p_docs.length <= 0){
            //履歴が見つからなければ履歴保存
            var phone = new Phone();
            phone.phone_number = format_phone_number(req.body.From);
            if(docs[0].mode == 'trial'){
              phone.status = 'trial';
            }else{
              //お試し以外は保存
              phone.token = lottery_data.token;
              phone.save();
            }
            //指定された方法で返信を開始
            var resp = new twilio.TwimlResponse();
            if(phone.status == 'trial'){
              //SMS送信
              var url = req.hostname + "/l/" + lottery_data.token;
              var body = "抽選アプリのURLは "+ url +" です。画面を閉じてしまった時にご利用下さい。";
              send_sms(lottery_data.account_sid, lottery_data.auth_token, body,  lottery_data.sms_phone_number, req.body.From);

              if(lottery_data.voice_file){
                send_xml(res, resp.play(req.protocol + "://" + req.hostname + "" + lottery_data.voice_file.replace(/public/, '').replace(/\\/g, '/'), {loop: 3}));
              }else{
                speak_error_message(res, lottery_data.voice_text);
                //send_xml(res, resp.say(lottery_data.voice_text));
              }
            }else{
              if(lottery_data.sms_phone_number){
                speak_error_message(res, 'お申し込みを受け付けました。ご契約キャリアおよび電波状況によりエスエムエスが到着しない場合がございます。');
              }else{
                speak_error_message(res, 'お申し込みを受け付けました');
              }
              //SMS送信
              var sms_text;
              if(lottery_data.sms_text){
                sms_text = lottery_data.sms_text;
              }else{
                sms_text = "抽選登録が終了いたしました。抽選開始までしばらくお待ちください。";
              }
              send_sms(lottery_data.account_sid, lottery_data.auth_token, sms_text,  lottery_data.sms_phone_number, req.body.From);
            }
          }else{
            //２回目ならキャンセル処理（過去の履歴は削除）
            //IVRに変更予定
            //for(var k = 0, l = p_docs.length; k < l; k++){
            //  p_docs[k].remove();
            //}
            //speak_error_message(res, 'お申し込みをキャンセルしました');
            //send_sms(lottery_data.account_sid, lottery_data.auth_token, "抽選登録を解除しました。",  lottery_data.sms_phone_number, req.body.From);
            start_ivr(req, res, lottery_data.token);
          }
        });
      }
    });
  }, function(e){
    speak_error_message(res, e);
  });
});

router.post('/cancel/:token', function(req, res, next){
  if(req.body.Digits == "1"){
    Phone.find({token: req.params.token, phone_number: format_phone_number(req.body.From)}, function(err, docs){
      for(var k = 0, l = docs.length; k < l; k++){
        docs[k].remove();
      }
      speak_error_message(res, 'お申し込みをキャンセルしました');
      Lottery.find({token: req.params.token}, function(err, lotteries){
        if(!err && lotteries.length > 0){
          var lottery_data = lotteries[0];
          send_sms(lottery_data.account_sid, lottery_data.auth_token, "抽選登録を解除しました。",  lottery_data.sms_phone_number, req.body.From);
        }else if(!err){
        }
      });
    });
  }else{
    hangup(res);
  }
});
module.exports = router;
