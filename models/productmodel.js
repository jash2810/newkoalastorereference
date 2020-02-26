var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var ProductmasterSchema = new Schema({
	details: {
		name: String,
		category: String
	},
	property: {
		image: String,
		color: String,
		size: String,
		quantity: Number
	},
	price: {
		originalprice: Number,
		finalprice: Number,
		discount: Number,
		saved: Number
	},
	description: {
		type: Array,
		title: String,
		content: String
	}
}, {
	timestamps: true
});

module.exports = mongoose.model('Productmaster', ProductmasterSchema);