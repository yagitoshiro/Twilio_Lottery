var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var format_phone_number = require(__dirname + '/../common/format_phone_number');
var hangup = require(__dirname + '/../common/hangup');
var express = require('express');
var router = express.Router();

router.post('/:token', function(req, res, next){
  Phone.find({phone_number: format_phone_number(req.body.To), token: req.param.token}, function(err, docs){
    if(!err && docs.length > 0){
      docs[0].callstatus = req.body.CallStatus;
      docs[0].status = 'error';
      docs[0].save();
    }
  });
  Lottery.find({token: req.params.token}, function(err, docs){
    docs[0].call_session = docs[0].call_session - 1;
    docs[0].save();
  });
  hangup(res);
});


module.exports = router;
