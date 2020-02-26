var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var CartmasterSchema = new Schema({
	details: {
		userid: String
	},
	productlist: {
		type: Array,
		productid: String,
		quantity: Number,
		originalprice: Number,
		discount: Number,
		finalprice: Number,
		name: String,
		category: String,
		color: String,
		size: String,
		image: String
	}
}, {timestamps: true});

module.exports = mongoose.model('Cartmaster', CartmasterSchema);