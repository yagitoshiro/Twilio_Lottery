var twilio = require('twilio');
var display_phone_number = require(__dirname + '/../common/display_phone_number');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next){
  // Auth Token、Account SID認証がOKなら
  try{
    var sid = req.body.account_sid;
    var auth_token = req.body.auth_token;
    var client = new twilio.RestClient(sid, auth_token);
    var account = client.accounts(sid).get(function(err, account){
      if(err){
        // 認証エラーはトップページを表示
        res.render('index', {title: 'Twilio抽選アプリ', csrf: req.csrfToken(), message: '認証エラー'});
      }else{
        if(account.type != 'Full'){
          //トライアルアカウントはメッセージを表示
          res.render('error', {title: 'Twilio抽選アプリ', message: 'トライアルアカウント'});
        }else{
          //アップグレードアカウントなら認証情報をセッションに
          req.session.sid = sid;
          req.session.auth_token = auth_token;
          res.redirect('/start');
        }
      }
    });
  }catch(e){
    console.log(e);
    res.render('index', {title: 'Twilio抽選アプリ', csrf: req.csrfToken(), message: '認証エラー'});
  }
});

router.get('/', function(req, res, next){
  //アップグレードアカウントなら利用可能な電話番号リストを作成
  var option_data = [];
  var sms_option_data = [];
  var sid = req.session.sid;
  var auth_token = req.session.auth_token;
  var client = new twilio.RestClient(sid, auth_token);
  client.incomingPhoneNumbers.list(function(err, numbers){
    if(!err){
      numbers.incomingPhoneNumbers.forEach(function(number){
        option_data.push('<option value="'+number.phone_number+'">' + display_phone_number(number.phone_number) + '</option>');
        if(number.capabilities.sms){
          sms_option_data.push('<option value="'+number.phone_number+'">' + display_phone_number(number.phone_number) + '</option>');
        }
      });
      var options = option_data.join('');
      var sms_options = sms_option_data.join('');
      res.render('start', {title: 'Twilio抽選アプリ', options: options, sms_options: sms_options, csrf: req.csrfToken()});
    }else{
      res.render('error', {title: 'Twilio抽選アプリ', message: err.message});
    }
  });
});

module.exports = router;
