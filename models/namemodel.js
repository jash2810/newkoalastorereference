var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var NamemasterSchema = new Schema({
	name: String,
	category: String
}, {
	timestamps: true
});

module.exports = mongoose.model('Namemaster', NamemasterSchema);