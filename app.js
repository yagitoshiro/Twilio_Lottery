var express = require('express');
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var multer  = require('multer');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var ECT = require('ect');
//var twilio = require('twilio');
var csrf = require('csurf');
//var path = require('path');
//var fs = require('fs-extra');
//var Lottery = require(__dirname + '/models/lottery');
//var Phone = require(__dirname + '/models/phone');
//var History = require(__dirname + '/models/history');
//var display_phone_number = require(__dirname + '/common/display_phone_number');
//var update_voice_url = require(__dirname + '/common/update_voice_url');
//var save_and_redirect = require(__dirname + '/common/save_and_redirect');
//var format_phone_number = require(__dirname + '/common/format_phone_number');
var get_candidate_count = require(__dirname + '/common/get_candidate_count');
//var shuffle = require(__dirname + '/common/shuffle');
//var phone_call = require(__dirname + '/common/phone_call');
//var speak_error_message = require(__dirname + '/common/speak_error_message');
//var send_xml = require(__dirname + '/common/send_xml');
//var send_sms = require(__dirname + '/common/send_sms');
//var hangup = require(__dirname + '/common/hangup');
//var clear_all = require(__dirname + '/common/clear_all');
//var delete_mp3 = require(__dirname + '/common/delete_mp3');
//var start_ivr = require(__dirname + '/common/start_ivr');
//var create_conference_call = require(__dirname + '/common/create_conference_call');
//var validate_twilio_request = require(__dirname + '/common/validate_twilio_request');

/* configuration */
var app = express();

// Cookie
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// MongoDB
var connectionString = process.env.CUSTOMCONNSTR_MONGOLAB_URI;
mongoose.connect(connectionString);

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'what do you plan to do?',
  mongoose_connection: mongoose.connections[0],
  resave: false,
  saveUninitialized: false
}));

// CSRF
var csrfExc = ['/twilio', '/fallback', '/status', '/l', '/select', '/call', '/deb']; //API calls
app.use(function(req, res, next){
  if(csrfExc.indexOf(req.path) !== -1){
    next();
  }else if(req.path.match(/^\/(call|fallback|status|twilio\/cancel)\//)){
    next();
  }else{
    csrf()(req, res, next);
  }
});

// Views
app.engine('ect', ECT({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
app.set('view engine', 'ect');
app.use(express['static'](__dirname + '/public'));

// Logs
if (app.get('env') == 'production') {
  app.use(morgan("dev", {}));
} else {
  app.use(morgan("dev", { format: 'dev', immediate: true }));
}

// File upload
app.use(multer({
  dest: "./public/files/"
}).single('voice_file'));

/* configuration */

/* Application */

//Auth TokenやAccoutn SIDを入力するトップページ
app.get('/', function (req, res) {
  res.render('index', { title: 'Twilio抽選アプリ', csrf: req.csrfToken(), message: "" });
});

//汎用エラーページ
app.get('/error', function(req, res){
  res.render('error', {title: 'Twilio抽選アプリ', message: req.session.message});
  req.session.message = null;
});

// Routes
//電話番号を選択して利用開始するページ
var routes_start = require('./routes/start');
app.use('/start', routes_start);

//選択された電話番号から電話番号別抽選ページを作成してリダイレクト
//modeがtrialの場合はJSONを返す
var routes_number = require('./routes/number');
app.use('/number', routes_number);

// AjaxでCSRFトークンを返す
var routes_token = require('./routes/token');
app.use('/token', routes_token);

//電話番号別抽選ページ
var routes_l = require('./routes/l');
app.use('/l', routes_l);

//当選実行
var routes_select = require('./routes/select');
app.use('/select', routes_select);

//当選者をいったんクリア
var routes_clear = require('./routes/clear');
app.use('/clear/:token', routes_clear);

// 当選者に電話をかける
var routes_call = require('./routes/call');
app.use('/call', routes_call);

//Ajaxで当選者情報を受け取る
var routes_s = require('./routes/s');
app.use('/s', routes_s);

// 終了
var routes_destroy = require('./routes/destroy');
app.use('/destroy', routes_destroy);

//着電するとTwilioから呼び出される
//キャンセルのIVR
var routes_twilio = require('./routes/twilio');
app.use('/twilio', routes_twilio);

//応募者から受信した通話が異常終了した
app.post('/incoming/fallback/:token', function(req, res){

});

//応募者から受信した通話が終了した
app.post('/incoming/status/:token', function(req, res){

});

//システムから発信した通話がエラーになった
var routes_fallback = require('./routes/fallback');
app.use('/fallback', routes_fallback);

//システムから発信した通話が終了した
var routes_status = require('./routes/status');
app.use('/status', routes_status);

//通話を中止する
var routes_stop = require('./routes/stop');
app.use('/stop', routes_stop);

// 応募者数
app.get('/candidates', function(req, res){
  get_candidate_count({token: req.query.id}, function(num){
    res.json({num: num});
  });
});

//当選者数
app.get('/winners', function(req, res){
  get_candidate_count({status: 'won', token: req.query.id}, function(num){
    res.json({num: num});
  });
});

// Here we go!
app.listen(process.env.PORT || 3000);
