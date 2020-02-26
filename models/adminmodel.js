var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var AdminmasterSchema = new Schema({
	name: String,
	adminname: String,
	password: String
}, {
	timestamps: true
});

module.exports = mongoose.model('Adminmaster', AdminmasterSchema);