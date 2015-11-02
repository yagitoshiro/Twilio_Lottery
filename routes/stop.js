var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var twilio = require('twilio');
var express = require('express');
var router = express.Router();

router.post('/:token', function(req, res, next){
  Lottery.find({token: req.params.token}, function(e, ls){
    if(!e && ls.length > 0){
      var client = new twilio.RestClient(ls[0].account_sid, ls[0].auth_token);
      Phone.find({token: req.params.token}, function(err, docs){
        if(!err){
          var sids = "";
          for(var i = 0, l = docs.length; i < l; i++){
            var p = docs[i];
            if(p.callsid){
              sids += ":" + p.callsid;
              client.calls(p.callsid).update({status: 'completed'}, function(err, call){
                if(!err){
                  p.callstatus = 'canceled';
                  p.save();
                }
              });
            }
          }
          res.json({error: false, message: sids});
        }else{
          res.json({error: true, message: "該当する番号が見つかりませんでした"});
        }
      });
    }else{
      res.json({error: true, message: "該当する抽選が見つかりませんでした"});
    }
  });
});

module.exports = router;
