var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;
// var uniqueValidator = require('mongoose-unique-validator');

var UsermasterSchema = new Schema({
	personal: {
		email: {type: String, required: true, unique: true},
		password: String,
		fullname: String,
		image: String
	},
	address: {
		type: Array,
		house: {type: String},
		street1: {type: String},
		street2: {type: String},
		landmark: {type: String},
		area: {type: String},
		city: {type: String},
		pincode: {type: String},
		State: {type: String},
		Country: {type: String, default: 'India'}
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
		},
		contactNo: Number
	},
	contact: {
		contactNo1: Number,
		contactNo2: Number
	},
	passwordResetOTP: {
		OTP: {type: Number},
		Token: {type: String, default: 0},
		TokenExpires: {type: Date}
	},
	email_verification: {type: Boolean, default: 0},
	gmail_login: {type: Boolean, default: 0},
	koala_login: {type: Boolean, default: 0},
	googleid: String
}, {
	timestamps: true
});

// UsermasterSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });
module.exports = mongoose.model('Usermaster', UsermasterSchema);