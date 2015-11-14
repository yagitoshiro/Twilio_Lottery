var format_phone_number = require(__dirname + '/format_phone_number');
var update_voice_url = require(__dirname + '/update_voice_url');
var display_phone_number = require(__dirname + '/display_phone_number');
var send_sms = require(__dirname + '/send_sms');
var Lottery = require(__dirname + '/../models/lottery');
//module.exports = function(req, res, sid, auth_token, number, generated_token, voice_text, file_path, mode){
module.exports = function(req, res, post){
  var lottery = new Lottery();
  lottery.account_sid = post.sid;
  lottery.auth_token = post.auth_token;
  lottery.createdAt = new Date();
  lottery.phone_number = format_phone_number(post.number);
  lottery.sms_phone_number = format_phone_number(post.sms_phone_number);
  lottery.token = post.generated_token;
  lottery.voice_file = post.file_path;
  lottery.voice_text = post.voice_text;
  lottery.mode = post.mode;
  lottery.call_session = 0;
  lottery.phone_enabled = post.phone_enabled ? true : false;
  lottery.sms_text = post.sms_text;
  lottery.submitted_voice = post.submitted_voice;
  lottery.notice_phone = post.notice_phone;
  lottery.admin_phone_number = format_phone_number(post.admin_phone_number).replace(/^0/, '81');
  lottery.save(function(err){
    if(err){
      res.json({success: false, message: 'データを保存できませんでした'});
    }else{
      update_voice_url(req, post.number, post.sid, post.auth_token, function(err, num){
        if(err){
          res.json({success: false, message: err.message});
        }else{
          switch(post.mode){
            case "trial":
              res.json({success: true, message: display_phone_number(post.number), debug: lottery});
              break;
            default:
              //管理者にSMS
              if(post.notice_phone){
                var url = url = req.protocol + "://" + req.hostname + '/l/' + post.generated_token;
                var sms_message = display_phone_number(post.number) + " / " + url;
                send_sms(post.sid, post.auth_token, sms_message, post.sms_phone_number, format_phone_number(post.notice_phone).replace(/^0/, '+81'));
              }
              res.json({success: true, message: display_phone_number(post.number), url: '/l/' + post.generated_token});
              break;
          }
        }
      });
    }
  });
};

