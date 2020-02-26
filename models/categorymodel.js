var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var CategorymasterSchema = new Schema({
	name: String
}, {
	timestamps: true
});

module.exports = mongoose.model('Categorymaster', CategorymasterSchema);