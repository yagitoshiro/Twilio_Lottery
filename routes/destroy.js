var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var delete_mp3 = require(__dirname + '/../common/delete_mp3');
var express = require('express');
var router = express.Router();

router.post('/:token', function(req, res, next){
  // 抽選データ削除
  Lottery.find({token: req.params.token}, function(err, docs){
    if(!err){
      for(var i = 0, len = docs.length; i < len; i++){
        delete_mp3(docs[i]);
        docs[i].remove();
      }
    }
  });
  // 番号データ削除
  Phone.find({token: req.params.token}, function(err, docs){
    if(!err){
      for(var i = 0, len = docs.length; i < len; i++){
        docs[i].remove();
      }
    }
  });
  res.json({success: true});
});

module.exports = router;
