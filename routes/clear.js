var Phone = require(__dirname + '/../models/phone');
var clear_all = require(__dirname + '/../common/clear_all');
var express = require('express');
var router = express.Router();

router.post('/clear/:token', function(req, res, next){
  Phone.find({token: req.param('token')}, function(err, docs){
    if(!err){
      clear_all(docs, function(){
        res.json({success: true});
      });
    }else{
      res.json({success: true});
    }
  });
});

module.exports = router;
