var Lottery = require(__dirname + '/../models/lottery');
var get_candidate_count = require(__dirname + '/../common/get_candidate_count');
var display_phone_number = require(__dirname + '/../common/display_phone_number');
var express = require('express');
var router = express.Router();

router.get('/:token', function(req, res, next){
console.log(req.params.token);
  var lottery = new Lottery();
  Lottery.find({token: req.params.token}, function(err, docs){
    var message;
    if(err || docs.length <= 0){
      message = "";
      req.session.message = "指定された抽選は受付期間が終了しました。";
      res.redirect('/error');
    }else{
      get_candidate_count({token: docs[0].token}, function(num){
        res.render('lottery', {title: 'Twilio抽選アプリ', number: display_phone_number('+'+docs[0].phone_number), message: message, num: num, token: docs[0].token, csrf: req.csrfToken(), finished: 0, phone_enabled: docs[0].phone_enabled});
      });
    }
  });
});

module.exports = router;
