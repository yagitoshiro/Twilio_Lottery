var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var format_phone_number = require(__dirname + '/../common/format_phone_number');
var hangup = require(__dirname + '/../common/hangup');
var express = require('express');
var router = express.Router();

router.post('/:token', function(req, res, next){
  Phone.find({phone_number: format_phone_number(req.body.To), token: req.params.token}, function(err, docs){
    // TODO
    // 留守電になった場合の処理を考える
    // 不在着信となった場合はreq.body.CallDurationが1のように極端に短いので
    // その値で判定することも可能
    if(!err && docs.length > 0){
      docs[0].callstatus = req.body.CallStatus;
      docs[0].save();
    }
  });
  Lottery.find({token: req.params.token}, function(err, docs){
    docs[0].call_session = docs[0].call_session - 1;
    docs[0].save();
  });
  //Hangupを返す
  hangup(res);
});

module.exports = router;
