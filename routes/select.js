var Lottery = require(__dirname + '/../models/lottery');
var History = require(__dirname + '/../models/history');
var Phone = require(__dirname + '/../models/phone');
var phone_call = require(__dirname + '/../common/phone_call');
var clear_all = require(__dirname + '/../common/clear_all');
var shuffle = require(__dirname + '/../common/shuffle');
var create_conference_call = require(__dirname + '/../common/create_conference_call');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next){
  Lottery.find({token: req.body.token}, function(err, lotteries){
    if(!err && lotteries[0]){
      var num = parseInt(req.body.num, 10);
      if(num <= 0){
        res.json({success: false, message: '当選者数を1以上の数値で指定してください'});
      }else{
        var args = {token: req.body.token};
        if(req.body.no_dup){
          args.status = {'$ne': 'won'};
        }//else{
        //}
        Phone.find(args, function(err, docs){
          if(err){
            res.json({success: false, message: "データベースにエラーが発生しました"});
          }else{
            if(docs.length <= 0){
              res.json({success: false, message: "応募者が見つかりませんでした"});
            }else if(docs.length < num){
              res.json({success: false, message: "応募者数が当選者数より少ないため実行できません"});
            }else{
              // 当選やり直し処理
              // 当選処理開始
              lotteries[0].action_status = 'calling';
              lotteries[0].call_session = lotteries[0].call_session + docs.length;
              lotteries[0].save(function(e){
                if(e){
                  res.json({success: false, message: "データベースにエラーが発生しました"});
                }else{
                  // 機能追加 カンファレンスコールを作成して当選者を招待する
                  if(lotteries[0].phone_enabled){
                    create_conference_call(req, res, lotteries[0], function(){
                      res.json({success: true, message: "当選者に電話しています。しばらくお待ち下さい。"});
                    });//, function(){
                  }else{
                    var start_phone_call = function(){
                      var data = shuffle(docs);
                      var max = req.body.num;
                      for(var i = 0, len = data.length; i < max; i++){
                        data[i].status = 'calling';
                        phone_call(req, {data: data[i], lottery: lotteries[0]});
                      }
                      //DBに履歴保存
                      var history = new History();
                      history.numbers = len;
                      history.save(function(e){});
                    };
                    if(!req.body.no_dup){
                      clear_all(docs, start_phone_call);
                      res.json({success: true, message: "当選者に電話しています。しばらくお待ち下さい。"});
                    }else{
                      start_phone_call();
                      res.json({success: true, message: "当選者に電話しています。しばらくお待ち下さい。"});
                    }
                  }
                }
              });
            }
          }
        });
      }
    }else{
      res.json({success: false, message: '抽選は終了しています'});
    }
  });
});

module.exports = router;
