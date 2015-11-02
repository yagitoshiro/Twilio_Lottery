var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  if(req.xhr){
    res.json({csrf: req.csrfToken()});
  }
});

module.exports = router;
