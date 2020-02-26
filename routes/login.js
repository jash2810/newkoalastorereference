var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var passwordhash = require('password-hash');
var session = require('client-sessions');
var nodemailer = require('nodemailer');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var jade = require('jade');
var mailer = require('pug-mailer');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
var cookieParser = require('cookie-parser');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const keys = require('../config/keys');
const Usermaster = require('../models/usermodel');
const Adminmaster = require('../models/adminmodel');
const Cartmaster = require('../models/cartmodel');

// information for mailing through koalatechnical (later for admins)
mailer.init({
	service: 'Gmail',
	auth: {
		user: 'koalatechnical@gmail.com',
		pass: keys.koalatechnical.pass
	}
});

// signup
router.post('/signup', (req, res) => {
	var errarr = [];
	Usermaster.findOne({
		'personal.email': req.body.email
	}, (err, already_user) => {
		if (err) {
			errarr.push('error');
		}
		if (already_user) {
			req.flash('errMsg', 'Email ID already exists!');
			res.redirect('back');
		} else {
			var hashedpassword = passwordhash.generate(req.body.password);
			var newUser = new Usermaster();
			var addressDetails = {
				house: req.body.house,
				street1: req.body.street1,
				street2: req.body.street2,
				landmark: req.body.landmark,
				area: req.body.area, 
				city: req.body.city,
				pincode: req.body.pincode,
				state: req.body.state,
				country: req.body.country
			};

			newUser.personal.email = req.body.email;
			newUser.personal.password = hashedpassword;
			newUser.personal.fullname = req.body.name;
			newUser.address.push(addressDetails);
			newUser.contact.contactNo1 = req.body.contact1;
			newUser.contact.contactNo2 = req.body.contact2;
			newUser.delivery.address = addressDetails;
			newUser.delivery.contactNo = req.body.contact1;
			newUser.gmail_login = false;
			newUser.koala_login = true;

			newUser.save((err, User) => {
				if (err) {
					throw err;
				}
				console.log(User);
				var newCart = new Cartmaster();

				newCart.details.userid = User._id;
				newCart.productlist.originalprice = 0;
				newCart.productlist.finalprice = 0;
				newCart.productlist.saved = 0;
				newCart.save((err, cart) => {
					if (err) {
						errarr.push('error 2');
					}
					if (errarr.length == 0) {
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: req.body.email,
							subject: 'Welcome To Koala',
							template: 'confirm_mail',
							data: {
								name: req.body.name,
								username: req.body.username,
								_id: User._id
							}
						});
						req.flash('sucMsg', 'Confirmation mail has been sent to registered email for verification.');
						res.redirect('/login');
					} else {
						req.flash('errMsg', 'Something Went wrong');
						res.redirect('back');
					}
				});
			});
		}
	});
});

//confirm mail
router.get('/confirm_mail/:_id', (req, res) => {
	var errarr = [];
	Usermaster.findOneAndUpdate({
		_id: req.params._id
	}, {
		$set: {
			email_verification: true
		}
	}, {
		upsert: true
	}, (err, newUser) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.redirect('/');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

//user login
router.post('/userlogin', (req, res) => {
	var errar = [];
	Usermaster.findOne({
		'personal.email': req.body.email
	}, {
		'personal.email': 1,
		'personal.password': 1,
		'email_verification': 1,
		'gmail_login': 1,
		'koala_login': 1
	}, (err, user) => {
		if (err) {
			errar.push('error 1');
		}
		if (errar.length == 0) {
			if (user) {
				if (user.gmail_login == false && user.koala_login == true) {
					if (passwordhash.verify(req.body.password, user.personal.password)) {
						if (user.email_verification == true) {
							res.clearCookie('koala_adminid');
							res.cookie('koala_userid', user._id, {maxAge: 31*24*60*60*1000});
							res.redirect('/users/welcome');
						} else {
							req.flash('errMsg', 'Confirm Your Email');
							res.redirect('back');
						}
					} else {
						req.flash('errMsg', 'Password is Incorrect');
						res.redirect('back');	
					}
				} else {
					req.flash('errMsg', 'Login Through Google +');
					res.redirect('back');
				}
			} else {
				req.flash('errMsg', 'User Not Found');
				res.redirect('back');
			}
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

//admin login
router.post('/adminlogin', (req, res) => {
	var errar = [];
	Adminmaster.findOne({
		adminname: req.body.adminname
	}, {
		adminname: 1,
		password: 1
	}, (err, admin) => {
		if (err) {
			errar.push('error 1');
		}
		if (errar.length == 0) {
			if (admin) {
				if (passwordhash.verify(req.body.password, admin.password)) {
					res.clearCookie('koala_userid');
					res.cookie('koala_adminid', admin._id, {maxAge: 31*24*60*60*1000});
					res.redirect('/admin/dashboard');
				} else {
					req.flash('errMsg', 'Password is incorrect');
					res.redirect('back');
				}
			} else {
				req.flash('errMsg', 'No Account Found');
				res.redirect('back');
			}
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// password reset link generator
router.post('/password-reset', (req, res) => {
	var errarr = [];
	Usermaster.findOne({
		'personal.email': req.body.email
	}, (err, user) => {
		if (err) {
			errarr.push('error 1');
		}
		if (user) {
			var token = cryptr.encrypt(req.body.email);
			var otp = Math.floor((Math.random() * 1000000) + 1);
			Usermaster.findOneAndUpdate({
				'personal.email': req.body.email
			}, {
				$set: {
					'passwordResetOTP.OTP':  otp,
					'passwordResetOTP.Token': token,
					'passwordResetOTP.TokenExpires': Date.now() + 3600000
				}
			}, (err, tokenStarted) => {
				if (err) {
					errarr.push('error 2');
				}
				if (errarr.length == 0) {
					mailer.send({
						from: 'koalatechnical@gmail.com',
						to: req.body.email,
						subject: 'Password Reset Link',
						template: 'password_reset',
						data: {
							otp: otp,
							fullname: user.personal.fullname
						}
					});
					res.redirect('/login/enter-otp/'+token);
				} else {
					req.flash('errMsg', 'Something Went Wrong');
					res.redirect('back');
				}
			});
		} else {
			req.flash('errMsg', 'No User Found !');
			res.redirect('back');
		}
	});
});

// enter OTP and change password
router.get('/enter-otp/:token', (req, res) => {
	res.render('reset-password', {
		title: 'Reset Password',
		email: cryptr.decrypt(req.params.token),
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg')
	});
});

// change password
router.post('/change-password', (req, res) => {
	var errarr = [];
	Usermaster.findOneAndUpdate({
		'personal.email': req.body.email,
		'passwordResetOTP.OTP': req.body.otp,
		'passwordResetOTP.TokenExpires': {
			$gt: Date.now()
		}
	}, {
		$set: {
			'personal.password': passwordhash.generate(req.body.password),
			'passwordResetOTP.OTP': null,
			'passwordResetOTP.Token': null,
			'passwordResetOTP.TokenExpires': null
		}
	}, (err, updated) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			if (updated) {
				req.flash('loginsucMsg', 'Password Updated Successfully');
				res.redirect('/');
			} else {
				req.flash('errMsg', 'You entered wrong information');
				res.redirect('back');
			}
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// change password
// router.get('/change-password-email/:token', (req, res) => {
// 	var errarr = [];
// 	Usermaster.findOne({
// 		'passwordTokens.resetPasswordToken': req.params.token,
// 		'passwordTokens.passwordTokenExpires': {
// 			$gt: Date.now()
// 		}
// 	}, (err, user) => {
// 		if (err) {
// 			errarr.push('error 1');
// 		}
// 		if (errarr.length == 0) {
// 			if (!user) {
// 				req.flash('errMsg', 'Link Expired Or Wrongly Entered');
// 				res.redirect('/');
// 			} else {
// 				res.render('reset-password', {
// 					title: 'Password Reset'
// 				});
// 			}
// 		} else {
// 			req.flash('errMsg', 'Something Went Wrong');
// 			res.redirect('/');
// 		}
// 	});
// });

// // post update password
// router.post('/change-password', (req, res) => {
// 	var errarr = [];
// 	Usermaster.findOneAndUpdate({
// 		'passwordTokens.resetPasswordToken': req.params.token,
// 		'passwordTokens.passwordTokenExpires': {
// 			$gt: Date.now()
// 		}
// 	}, {
// 		$set: {
// 			'personal.password': passwordhash.generate(req.body.password),
// 			'passwordTokens.resetPasswordToken': undefined,
// 			'passwordTokens.passwordTokenExpires': undefined
// 		}
// 	}, (err, user) => {
// 		if (err) {
// 			errarr.push('error 1');
// 		}
// 		if (errarr.length == 0) {
// 			req.flash('sucMsg', 'Password changed successfully');
// 			res.redirect('/');
// 		} else {
// 			req.flash('errMsg', 'Something Went Wrong');
// 			res.redirect('/');
// 		}
// 	});
// });

// logout both admin and user
router.get('/logout', (req, res) => {
	res.clearCookie('koala_userid');
	res.clearCookie('koala_adminid');
	res.redirect('/sucMsgLoggout');
});

module.exports = router;