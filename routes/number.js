var Lottery = require(__dirname + '/../models/lottery');
var save_and_redirect = require(__dirname + '/../common/save_and_redirect');
var format_phone_number = require(__dirname + '/../common/format_phone_number');
var fs = require('fs-extra');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next){
console.log(req.body);
  var sid = req.session.sid;
  var auth_token = req.session.auth_token;
  var number = req.body.phone_number;
  var voice_text = req.body.voice_text;
  var admin_phone_number = req.body.admin_phone_number;
  var phone_enabled = req.body.phone_enabled;
  var sms_text = req.body.sms_text;
//  var voice_file = req.param('voice_file');
  var mode = req.body.mode;
  var generated_token;

  if(!number || (!voice_text && !req.file)){
    var message = "電話番号とテキストまたはMP3は必須項目です。";
    if(mode == "trial"){
      res.json({error: true, message: message});
    }else{
      req.session.message = message;
      res.redirect('/error');
    }
  }else if(phone_enabled && !admin_phone_number){
    req.session.message = "当選者に電話する場合は主催者の電話番号を入力してください。";
    res.redirect('/error');
  }else{
    function random(){
      return Math.random().toString(32).substr(4);
    }
    function generate(){
      //var token = random() + random();
      var token = random();
      Lottery.where({token: token}).count(function(err, count){
        if(!err && count > 0){
          generate();
          return;
        }else{
          generated_token = token;
          //MongoDBに登録
          var save_path = "";
          save_path = __dirname + "files";
          //if(req.files.voice_file){
          if(req.file){
            fs.exists(req.file.path, function(exists){
              if(exists){
                fs.move(req.file.path, req.file.path + ".mp3", function(err){
                  if(!err){
                    save_and_redirect(req, res, sid, auth_token, number, generated_token, voice_text, req.file.path + '.mp3', mode);
                  }else{
                    res.json({success: false, message: 'データを保存できませんでした'});
                  }
                });
              }else{
                //res.json({success: false, message: 'データを保存できませんでした'});
                save_and_redirect(req, res, sid, auth_token, number, generated_token, voice_text, null, mode);
              }
            });
          }else{
              save_and_redirect(req, res, sid, auth_token, number, generated_token, voice_text, null, mode);
          }
        }
      });
    }
    //同じ電話番号が登録されていたらTrialなら消して本番ならエラー
    Lottery.find({phone_number: format_phone_number(number)}, function(err, docs){
      var data =[];
      if(docs.length > 0){
        for(var i = 0, len = docs.length; i < len; i++){
          if(docs[i].mode === "trial"){
            docs[i].remove();
          }else{
            data.push(docs[i]);
          }
        }
        if(data.length > 0){
          //同じ番号で本番データがある
          res.json({error: true, message: "この番号は現在既に利用されています"});
        }else{
          generate();
        }
      }else{
        generate();
      }
    });
  }
});

module.exports = router;
