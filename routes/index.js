var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var passwordhash = require('password-hash');
var session = require('client-sessions');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const keys = require('../config/keys');
const Adminmaster = require('../models/adminmodel');
const Productmaster = require('../models/productmodel');
// for authentication
const generalAuth = (req, res, next) => {
	if (req.cookies['koala_userid']) {
		res.redirect('/users/welcome');
	} else if(req.cookies['koala_adminid']) {
		res.redirect('/admin/dashboard');
	}else {
		next();
	}
};

/* GET home page. login page */

/* GET Sign Up page */
router.get('/login', generalAuth,function(req,res,next){
	res.render('index', {
		title: 'Login | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg')
	});
});
router.get('/', generalAuth, function(req, res, next) {
		var errorarray = [];
	
		Productmaster.find().distinct('details.category', (err, categories) => {
			if (err) {
				errorarray.push('error 2');
			}
			Productmaster.find({}, (err, products) => {
				if (err) {
					errorarray.push('error 3');
				}
					Productmaster.find().distinct('property.color', (err, colors) => {
						if (err) {
							errorarray.push('error 5');
						}
						Productmaster.find().distinct('property.size', (err, sizes) => {
							if (err) {
								errorarray.push('error 6');
							}
							if (errorarray.length == 0) {
									res.render('general/gwelcome', {
									title: 'Welcome | Koalastore',
									categories: categories,
									products: products,
									colors: colors,
									sizes: sizes,
									errMsg: req.flash('errMsg'),
									sucMsg: req.flash('sucMsg'),
						
								});
							} else {
								req.flash('errMsg', 'Something Went Wrong');
								res.redirect('back');
							}
						});
					});
				});
			});
		});
	




router.get('/signup', generalAuth, (req, res) => {
	res.render('signup', {
		title: 'Sign Up | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg')
	});
});

/* Login Page for admin */
router.get('/koala-admin', generalAuth, (req, res) => {
	res.render('admin/adminlogin', {
		title: 'Admin Login | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg')
	});
});

/* temporary ! signup admin */ //keep this function untill main deployment !
// router.get('/adminsignup', generalAuth, (req, res) => {
// 	res.render('admin/temp', {
// 		title: 'Admin signup | Koalastore'
// 	});
// });

/*post admin signup*/
router.post('/signup', (req, res) => {
	var errarr = [];
	var newAdmin = new Adminmaster();
	var hashedpassword = passwordhash.generate(req.body.password);

	newAdmin.name = req.body.name;
	newAdmin.adminname = req.body.adminname;
	newAdmin.password = hashedpassword;

	newAdmin.save((err, admin) => {
		if (err) {
			errarr.push('error 1');
			console.log(err);
		}
		if (errarr.length == 0) {
			res.redirect('/adminlogin');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('/');
		}
	});
});

// forgot password render
router.get('/forgot-password', (req, res) => {
	res.render('forgot-password', {
		title: 'Forgot Password | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg')
	});
});

router.get('/sucMsgLoggout', (req, res) => {
	req.flash('sucMsg', 'please login');
	res.redirect('/');
});

module.exports = router;