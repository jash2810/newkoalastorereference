var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var passwordhash = require('password-hash');
var session = require('client-sessions');
var busboy = require('then-busboy');
var fileUpload = require('express-fileupload');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
var cookieParser = require('cookie-parser');
var mailer = require('pug-mailer');
var nodemailer = require('nodemailer');
const keys = require('../config/keys');
const Usermaster = require('../models/usermodel');
const Adminmaster = require('../models/adminmodel');
const Categorymaster = require('../models/categorymodel');
const Namemaster = require('../models/namemodel');
const Productmaster = require('../models/productmodel');
const Cartmaster = require('../models/cartmodel');
const Ordermaster = require('../models/ordermodel');
const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;

const generalAuth = (req, res, next) => {
	if (req.cookies['koala_userid']) {
		res.redirect('/users/welcome');
	} else if(req.cookies['koala_adminid']) {
		res.redirect('/admin/dashboard');
	}else {
		next();
	}
};

router.post('/loginn',generalAuth,function(req, res, next) {
	req.flash('loginerrMsg', 'You need to login first');
	res.redirect('/login');
});


router.get('/product/:id',generalAuth, (req, res) => {
	var errorarray = [];
	Productmaster.findOne({
		_id: req.params.id
	}, (err, product) => {
		if (err) {
			errorarray.push('error 1');
		}
		Productmaster.find({'details.name': product.details.name}).distinct('property.size', (err, availablesize) => {
			if (err) {
				errorarray.push('error 2');
			}
			Productmaster.find({
				'details.category':product.details.category
			}, (err, availableproducts) => {
				if (err) {
					errorarray.push('error 3');
				}
					if (errorarray.length == 0) {
						res.render('general/gproduct', {
							title: product.details.name+' | Koalastore',
							product: product,
							availablesize: availablesize,
							availableproducts: availableproducts,
				
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

router.get('/products/:size/:name', generalAuth, (req, res) => {
	var errorarray = [];
	Productmaster.find({
		'property.size': req.params.size,
		'details.name': req.params.name
	}, (err, products) => {
		if (err) {
			errorarray.push('error 1');
		}
		Productmaster.find({
			'details.category': products[0].details.category
		}, (err, productsincategory) => {
			if (err) {
				errorarray.push('error 2');
			}
			if (errorarray.length == 0) {
				res.render('general/gproducts', {
					title: req.params.name+' | Koalastore',
					products: products,
					productsincategory: productsincategory,
					errMsg: req.flash('errMsg'),
					sucMsg: req.flash('sucMsg'),
					totpro: req.session.totpro
				});
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

router.get('/contact-us', generalAuth,(req, res) => {
	res.render('general/gcontactus', {
		title: 'Contact Us | Koalastore'
	});
});

router.get('/about-us', generalAuth,(req, res) => {
	res.render('general/gaboutus', {
		title: 'About Us | Koalastore'
	});
});

router.get('/filtered/products', generalAuth, (req, res) => {
	var category = req.query.category;
	var price = req.query.price;
	var color = req.query.color;
	var size = req.query.size;

	if (true) {}
	if (category == 'all' && price == 'all' && color == 'all' && size == 'all') {
		res.redirect('back');
	} else if (price == 'all' && color == 'all' && size == 'all') {
		console.log('bc');
		Productmaster.find({
			'details.category':category
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if(category == 'all' && color== 'all' && size == 'all'){
		if(price == 'low to high')
		{
			var sort = 1;
		}
		else
		{
			var sort = -1;
		}
		Productmaster.find({}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (price == 'all' && category == 'all' && size == 'all') {
		Productmaster.find({
			'property.color':color
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (price == 'all' && color == 'all' && category == 'all') {
		Productmaster.find({
			'property.size':size
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (price == 'all' && category == 'all') {
		Productmaster.find({
			'property.size':size,
			'property.color': color
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (price == 'all' && color == 'all') {
		Productmaster.find({
			'property.size':size,
			'details.category': category
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (price == 'all' && size == 'all') {
		Productmaster.find({
			'property.color': color,
			'details.category': category
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (color == 'all' && category == 'all') {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'property.size':size
		}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (size == 'all' && category == 'all') {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'property.color': color
		}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (size == 'all' && color == 'all') {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'details.category': category
		}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (category == 'all') {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'property.color': color,
			'property.size': size
		}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (price == 'all') {
		Productmaster.find({
			'property.color': color,
			'details.category': category,
			'property.size':size
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (color == 'all') {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'details.category': category,
			'property.size': size
		}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else if (size == 'all') {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'property.color': color,
			'details.category': category
		}, null, {
			sort:
			{
				'price.finalprice': sort
			}
		}, (err,products)=>{
			if (err) {errarr.push('error 1');}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	} else {
		if (price == 'low to high') {
			var sort = 1;
		} else {
			var sort = -1;
		}
		Productmaster.find({
			'property.color': color,
			'details.category': category,
			'property.size':size
		}, null, {
			sort: {
				'price.finalprice': sort
			}
		}, (err,products) => {
			if(err){
				errarr.push('error 1');
			}
			Productmaster.find().distinct('details.category', (err, categories) => {
				if (err) {
					throw err;
				}
				Productmaster.find().distinct('property.color', (err, colors) => {
					if (err) {
						throw err;
					}
					Productmaster.find().distinct('property.size', (err, sizes) => {
						if (err) {
							throw err;
						}
						res.render('general/fp', {
							title: 'Filtered Products | Koalastore',
							products: products,
							categories: categories,
							colors: colors,
							sizes: sizes,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro

						});
					});
				});
			});
		});
	}
});

router.get('/buy-now-general', (req, res) => {
	req.flash('errMsg', 'You need to login first');
	res.redirect('/login');
});

// router.get('/filtered/products',generalAuth, (req, res) => {
// 	var category = req.query.category;
// 	var price = req.query.price;
// 	var color = req.query.color;
// 	var size = req.query.size;

// 	if (true) {}
// 	if (category == 'all' && price == 'all' && color == 'all' && size == 'all') {
// 		res.redirect('back');
// 	} else if (price == 'all' && color == 'all' && size == 'all') {
// 		console.log('bc');
// 		Productmaster.find({
// 			'details.category':category
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if(category == 'all' && color== 'all' && size == 'all'){
// 		if(price == 'low to high')
// 		{
// 			var sort = 1;
// 		}
// 		else
// 		{
// 			var sort = -1;
// 		}
// 		Productmaster.find({}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (price == 'all' && category == 'all' && size == 'all') {
// 		Productmaster.find({
// 			'property.color':color
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (price == 'all' && color == 'all' && category == 'all') {
// 		Productmaster.find({
// 			'property.size':size
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (price == 'all' && category == 'all') {
// 		Productmaster.find({
// 			'property.size':size,
// 			'property.color': color
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (price == 'all' && color == 'all') {
// 		Productmaster.find({
// 			'property.size':size,
// 			'details.category': category
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (price == 'all' && size == 'all') {
// 		Productmaster.find({
// 			'property.color': color,
// 			'details.category': category
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (color == 'all' && category == 'all') {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'property.size':size
// 		}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (size == 'all' && category == 'all') {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'property.color': color
// 		}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (size == 'all' && color == 'all') {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'details.category': category
// 		}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (category == 'all') {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'property.color': color,
// 			'property.size': size
// 		}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (price == 'all') {
// 		Productmaster.find({
// 			'property.color': color,
// 			'details.category': category,
// 			'property.size':size
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (color == 'all') {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'details.category': category,
// 			'property.size': size
// 		}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else if (size == 'all') {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'property.color': color,
// 			'details.category': category
// 		}, null, {
// 			sort:
// 			{
// 				'price.finalprice': sort
// 			}
// 		}, (err,products)=>{
// 			if (err) {errarr.push('error 1');}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	} else {
// 		if (price == 'low to high') {
// 			var sort = 1;
// 		} else {
// 			var sort = -1;
// 		}
// 		Productmaster.find({
// 			'property.color': color,
// 			'details.category': category,
// 			'property.size':size
// 		}, null, {
// 			sort: {
// 				'price.finalprice': sort
// 			}
// 		}, (err,products) => {
// 			if(err){
// 				errarr.push('error 1');
// 			}
// 			res.render('general/fp', {
// 				title: 'Products | Koalastore',
// 				products: products,
// 				errMsg: req.flash('errMsg'),
// 				sucMsg: req.flash('sucMsg'),
				
// 				totpro: req.session.totpro
// 			});
// 		});
// 	}
// });

module.exports = router;