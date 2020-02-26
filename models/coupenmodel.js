var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var CoupenmasterSchema = new Schema({
	coupendetails: {
		coupencode: String,
		description: String
	},
	expiry:{
		expirydate: Date
    },
    type: {
        discountpercentage: Boolean,
        discountcash: Boolean
    },
	discountpercentage:{
		percentage: Number,
		maxcash: Number
	},
	discountcash:{
		cash: Number
	}
}, {
	timestamps: true
});

module.exports = mongoose.model('Coupenmaster', CoupenmasterSchema);