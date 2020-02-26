var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var OrdermasterSchema = new Schema({
	userdetails: {
		userid: String,
		fullname: String
	},
	delivery: {
		address: {
			house: {type: String},
			street1: {type: String},
			street2: {type: String},
			landmark: {type: String},
			area: {type: String},
			city: {type: String},
			pincode: {type: String},
			State: {type: String, default: 'Gujarat'},
			Country: {type: String, default: 'India'}
		}
	},
	contact: {
		email: String,
		contactNo: Number
	},
	productlist: {
		type: Array,
		productid: String,
		quantity: Number,
		originalprice: Number,
		finalprice: Number,
		name: String,
		category: String,
		color: String,
		size: String,
		image: String
	}, 
	payment: {
		finalprice: Number
	},
	paymenttype: {
		paytm: {
			ispaytm: Boolean,
			paytmNumber: Number,
			verified: {type: Boolean, default: false}
		},
		cod: Boolean
	},
	status: {
		delivered: {type: Number, default: 0},
		canceled: {type: Number, default: 0}
	}
}, {
	timestamps: true
});

module.exports = mongoose.model('Ordermaster', OrdermasterSchema);