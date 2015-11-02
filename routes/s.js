var Lottery = require(__dirname + '/../models/lottery');
var Phone = require(__dirname + '/../models/phone');
var express = require('express');
var router = express.Router();

router.get('/:token', function(req, res, next){
  Lottery.find({token: req.params.token}, function(err, lotteries){
    if(!err){
      var lottery = lotteries[0];
      //Phone.where('token', req.param('token')).where({status: {'$ne': null}}).where({status: {'$ne': ""}}).exec(function(err, docs){
      Phone.where('token', req.params.token).where({status: 'won'}).exec(function(err, docs){
        var data = [];
        for(var i = 0, l = docs.length; i < l; i++){
          data.push({status: docs[i].status, phone_number: docs[i].phone_number, callstatus: docs[i].callstatus});
        }
        res.json({data: data, lottery: lottery});
      });
    }else{
      res.json({data: [], lottery: null});
    }
  });
});

module.exports = router;
