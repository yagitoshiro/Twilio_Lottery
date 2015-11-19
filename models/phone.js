var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var expire = 24 * 60 * 60;

var PhoneSchema = new Schema({
  phone_number: { type: String },
  token: { type: String },
  status: { type: String },
  callstatus: { type: String },
  callsid: { type: String },
  //createdAt: { type: Date, expires: '7200s' }
  createdAt: { type: Date, expires: '14400s'}//TODO
});

module.exports = mongoose.model('PhoneModel', PhoneSchema);

