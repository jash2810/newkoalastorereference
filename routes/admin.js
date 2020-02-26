var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var passwordhash = require('password-hash');
var session = require('client-sessions');
var busboy = require('then-busboy');
var fileUpload = require('express-fileupload');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const keys = require('../config/keys');
const Usermaster = require('../models/usermodel');
const Adminmaster = require('../models/adminmodel');
const Categorymaster = require('../models/categorymodel');
const Namemaster = require('../models/namemodel');
const Productmaster = require('../models/productmodel');
const Ordermaster = require('../models/ordermodel');
const Coupenmaster = require('../models/coupenmodel');
var mailer = require('pug-mailer');

// for admin authentication
const adminAuth = (req, res, next) => {
	if (!req.cookies['koala_adminid']) {
		req.flash('errMsg', 'You Must Login First');
		res.redirect('back');
	} else {
		next();
	}
};

// information for mailing through koalatechnical (further by admins)
mailer.init({
	service: 'Gmail',
	auth: {
		user: keys.koalatechnical.email,
		pass: keys.koalatechnical.pass
	}
});

// admin dashboard
router.get('/dashboard', adminAuth, function(req, res, next) {
	var errar = [];

	Usermaster.count({}, (err, usercount) => {
		if (err) {
			errar.push('error 1');
		}
		Productmaster.count({}, (err, productcount) => {
			if (err) {
				errar.push('error 2');
			}
			Ordermaster.count({
				'status.delivered': 1,
				'status.canceled': 0
			}, (err, sucordercount) => {
				if (err) {
					errar.push('error 3');
				}
				Ordermaster.count({
					'status.delivered': 0,
					'status.canceled': 0
				}, (err, pendingordercount) => {
					if (err) {
						errar.push('error 4');
					}
					if (errar.length == 0) {
						res.render('admin/dashboard', {
							title: 'Dashboard | Koalastore',
							usercount: usercount,
							productcount: productcount,
							sucordercount: sucordercount,
							pendingordercount: pendingordercount,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							admin_cookie: req.cookies['koala_adminid']
						});
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				});
			});
		});
	});
	// Adminmaster.findOne({
	// 	_id: req.cookies['koala_adminid']
	// }, (err, admin) => {
	// 	if (err) {
	// 		errar.push('error 1');
	// 	}
	// 	if (errar.length == 0) {
			
	// 	} else {
			// req.flash('errMsg', 'Something Went Wrong');
			// res.redirect('back');
	// 	}
	// });
});

// manage category
router.get('/category', adminAuth, function (req, res, next) {
	var errarr = [];
	Categorymaster.find({}, (err, category) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.render('admin/category', {
				title: 'Categories | Koalastore',
				category: category,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				admin_cookie: req.cookies['koala_adminid']
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// manage name
router.get('/name', adminAuth, function (req, res, next) {
	var errarr = [];
	Categorymaster.find({}, (err, category) => {
		if (err) {
			errarr.push('error 1');
		}
		Namemaster.find({}, (err, name) => {
			if (err) {
				errarr.push('error 2');
			}
			if (errarr.length == 0) {
				res.render('admin/name', {
					title: 'Names | Koalastore',
					category: category,
					name: name,
					errMsg: req.flash('errMsg'),
					sucMsg: req.flash('sucMsg'),
					admin_cookie: req.cookies['koala_adminid']
				});
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// manage products
router.get('/products', adminAuth, function (req, res, next) {
	var errarr = [];
	Namemaster.find().distinct('category', (err, categorydist) => {
		if (err) {
			errarr.push('error 1');
		}
		Namemaster.find({category: categorydist}, (err, name) => {
			if (err) {
				errarr.push('error 2');
			}
			Productmaster.find({}, (err, products) => {
				if (err) {
					errarr.push('error 3');
				}
				if (errarr.length == 0) {
					res.render('admin/products', {
						title: 'Products | Koalastore',
						categorydist: categorydist,
						name: name,
						products: products,
						errMsg: req.flash('errMsg'),
						sucMsg: req.flash('sucMsg'),
						admin_cookie: req.cookies['koala_adminid']
					});
				} else {
					req.flash('errMsg', 'Something Went Wrong');
					res.redirect('back');
				}
			});
		});
	});
});

router.get('/products/:category', adminAuth, function (req, res, next) {
	var errarr = [];
	Namemaster.find().distinct('category', (err, categorydist) => {
		if (err) {
			errarr.push('error 1');
		}
		Namemaster.find({category: req.params.category}, (err, name) => {
			if (err) {
				errarr.push('error 2');
			}
			Productmaster.find({}, (err, products) => {
				if (err) {
					errarr.push('error 3');
				}
				if (errarr.length == 0) {
					res.render('admin/products', {
						title: 'Products | Koalastore',
						categorydist: categorydist,
						name: name,
						category: req.params.category,
						products: products,
						errMsg: req.flash('errMsg'),
						sucMsg: req.flash('sucMsg'),
						admin_cookie: req.cookies['koala_adminid']
					});
				} else {
					req.flash('errMsg', 'Something Went Wrong');
					res.redirect('back');
				}
			});
		});
	});
});

// add category
router.post('/addcategory', (req, res, next) => {
	var errarr = [];
	var newCategory = new Categorymaster();

	newCategory.name = req.body.category;

	newCategory.save((err, category) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', 'Category Added Successfully');
			res.redirect('back')
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// delete category
router.post('/deletecategory/:id', adminAuth, (req, res) => {
	var errarr = [];
	Categorymaster.findOneAndRemove({
		_id: req.params.id
	}, (err, category) => {
		if (err) {
			errarr.push('error 1');
		} 
		if (errarr.length == 0) {
			req.flash('sucMsg', category.name+' deleted Successfully');
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// add name
router.post('/addname', (req, res, next) => {
	var errarr = [];
	var newName = new Namemaster();

	newName.name = req.body.name;
	newName.category = req.body.category;

	newName.save((err, name) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', name.name+' added successfully');
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// delete name
router.post('/deletename/:id', (req, res) => { 
	var errarr = [];
	Namemaster.findOneAndRemove({
		_id: req.params.id
	}, (err, name) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', name.name+' Deleted Successfully');
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// add product
router.post('/addproduct', (req, res, next) => {
	var fprice = (100 - req.body.discount)*(req.body.oprice)/100;
	var file = req.files.img;
	var file_name = file.name;
	var errarr = [];
	console.log(req.body.title+' : '+req.body.content);
	var newProduct = new Productmaster();

	newProduct.details.name = req.body.name;
	newProduct.details.category = req.body.category;
	newProduct.property.image = file_name;
	newProduct.property.color = req.body.color;
	newProduct.property.size = req.body.size;
	newProduct.property.quantity = req.body.quantity;
	newProduct.price.originalprice = req.body.oprice;
	newProduct.price.finalprice = fprice;
	newProduct.price.discount = req.body.discount;
	newProduct.description = [
		{'title': req.body.title,
		'content': req.body.content}
	];

	newProduct.save((err, product) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			file.mv('public/images/products/'+file_name, (err) => {
				if (err) {
					res.status(500).send(err+' | Your image has not been uploaded, go to the previous page...');
				} else {
					req.flash('sucMsg', 'Product Added Successfully');
					res.redirect('/admin/more-description/'+product._id);
				}
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.get('/more-description/:id', (req, res) => {
	var errarr = [];
	Productmaster.findOne({
		'_id': req.params.id
	}, (err, product) => {
		if (err) {
			errarr.push('error 1');
		}
		res.render('admin/moredesc', {
			title: 'more description | Koalastore',
			description: product.description,
			product: product,
			errMsg: req.flash('errMsg'),
			sucMsg: req.flash('sucMsg'),
			admin_cookie: req.cookies['koala_adminid']
		});
	});
});

router.post('/add-description/:id', (req, res) => {
	var errarr = [];
	Productmaster.findOneAndUpdate({
		'_id': req.params.id
	}, {
		$push: {
			description: {
				title: req.body.title,
				content: req.body.content
			}
		}
	}, (err, added) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.post('/delete-description/:id', (req, res) => {
	var errarr = [];
	Productmaster.findOneAndUpdate({
		'_id': req.params.id
	}, {
		$pull: {
			description: {
				title: req.body.title
			}
		}
	}, (err, deleted) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back')
		}
	});
});

// update product
router.post('/editproduct/:id', (req, res) => {
	var fprice = (100 - req.body.discount)*(req.body.oprice)/100;
	var file = req.files.img;
	var file_name = file.name;
	var errarr=[];
	Productmaster.findOneAndUpdate({
		_id: req.params.id
	}, {
		$set: {
			'property.color': req.body.color,
			'property.image': file_name,
			'property.size': req.body.size,
			'price.originalprice': req.body.oprice,
			'price.discount': req.body.discount,
			'price.finalprice': fprice
		}
	}, {
		upsert: true
	}, (err, product) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			file.mv('public/images/products/'+file_name, (err) => {
				if (err) {
					res.status(500).send(err+' | Your image has not been uploaded, go to the previous page...');
				} else {
					req.flash('sucMsg', 'Product Updated Successfully');
					res.redirect('/admin/product/'+req.params.id);
				}
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// delete product
router.post('/deleteproduct/:id', (req, res) => {
	var errarr = [];
	Productmaster.findOneAndRemove({
		_id: req.params.id
	}, (err, product) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', 'Product '+product.details.name+' deleted successfully');
			res.redirect('/admin/products');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// product by category post
router.post('/pbcategory', (req, res) => {
	res.redirect('/admin/pbcategory/'+req.body.category);
});

// product by category get
router.get('/pbcategory/:id', adminAuth, (req, res) => {
	var errarr = [];
	Productmaster.find({
		'details.category': req.params.id
	}, (err, products) => {
		if (err) {
			errarr.push('error 1');
		}
		Namemaster.find({category: req.params.id}).distinct('name', (err, names) => {
			if (err) {
				errarr.push('error 2');
			}
			if (errarr.length == 0) {
				res.render('admin/pbcategory', {
					title: 'Products | Koalastore',
					names: names,
					products: products,
					errMsg: req.flash('errMsg'),
					sucMsg: req.flash('sucMsg'),
					admin_cookie: req.cookies['koala_adminid']
				});
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// product by name post
router.post('/pbname', (req, res) => {
	res.redirect('/admin/pbname/'+req.body.name);
});

// products by name get
router.get('/pbname/:id', adminAuth, (req, res) => {
	var errarr = [];
	Productmaster.find({
		'details.name': req.params.id
	}, (err, products) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.render('admin/pbname', {
				title: 'Products | Koalastore',
				products: products,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				admin_cookie: req.cookies['koala_adminid']
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// getting a product details
router.get('/product/:id', adminAuth, (req, res) => {
	var errarr = [];
	Productmaster.findOne({
		_id: req.params.id
	}, (err, product) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.render('admin/product', {
				title: product.details.name+' | Koalastore',
				product: product,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				admin_cookie: req.cookies['koala_adminid']
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// manage orders @ 03-09-18
router.get('/orders', adminAuth, (req, res) => {
	var errorarray = [];
	Ordermaster.find({
		'status.delivered': false
	}, (err, orders) => {
		if (err) {
			errorarray.push('error 1');
		}
		if (errorarray.length == 0) {
			res.render('admin/orders', {
				title: 'Orders | Koalastore',
				orders: orders,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				admin_cookie: req.cookies['koala_adminid']
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// view ordered products
router.get('/view-ordered-products/:id', adminAuth, (req, res) => {
	var errarr = [];
	Ordermaster.findOne({
		_id: req.params.id
	}, (err, order) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.render('admin/vieworderedproducts', {
				title: 'Ordered Products | Koalastore',
				products: order.productlist,
				orderid: order._id,
				ispaytm: order.paymenttype.paytm.ispaytm,
				paytmverified: order.paymenttype.paytm.verified,
				cancelstatus: order.status.canceled,
				deliverystatus: order.status.delivered,
				finalprice: order.payment.finalprice,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				admin_cookie: req.cookies['koala_adminid']
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// verify paytm order
router.get('/verify-paytm-order/:id', (req, res) => {
	var errarr = [];

	Ordermaster.findOneAndUpdate({
		_id: req.params.id
	}, {
		$set: {
			'paymenttype.paytm.verified': true
		}
	}, (err, orderverified) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			mailer.send({
				from: 'koalatechnical@gmail.com',
				to: orderverified.contact.email,
				subject: 'Paytm Payment and Order Verified',
				template: 'paytm_verified',
				data: {

				}
			});
			req.flash('sucMsg', 'Paytm Payment Verified Successfully !');
			res.redirect('/admin/orders');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// delivered
router.get('/delivered/:id', adminAuth, (req, res) => {
	var errarr = [];
	Ordermaster.findOneAndUpdate({
		_id: req.params.id
	}, {
		$set: {
			'status.delivered' : 1
		}
	}, (err, delivered) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('information updated');
			res.redirect('/admin/orders');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.get('/profile', (req, res) => {
	var errarr = [];
	Adminmaster.findOne({
		_id: req.cookies['koala_adminid']
	}, (err, admin) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.render('admin/profile', {
				title: 'Profile | Koalastore',
				admin: admin,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				admin_cookie: req.cookies['koala_adminid']
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.post('/addnewadmin', (req, res) => {
	var errarr = [];
	var newAdmin = new Adminmaster();

	newAdmin.name = req.body.name;
	newAdmin.adminname = req.body.adminname;
	newAdmin.password = passwordhash.generate(req.body.password);

	newAdmin.save((err, admin) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', 'Admin added successfully');
			res.redirect('/admin/dashboard');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.post('/change-password', (req, res) => {
	var errarr = [];
	Adminmaster.findOne({
		_id: req.cookies['koala_adminid']
	}, (err, admin) => {
		if (err) {
			errarr.push('error 1');
		}
		if (passwordhash.verify(req.body.currentpassword, admin.password)) {
			Adminmaster.findOneAndUpdate({
				_id: req.cookies['koala_adminid']
			}, {
				$set: {
					'password': passwordhash.generate(req.body.newpassword)
				}
			}, (err, updated) => {
				if (err) {
					errarr.push('error 2');
				}
				console.log(updated);
				if (errarr.length == 0) {
					req.flash('sucMsg', 'Password Updated Successfully');
					res.redirect('back');
				} else {
					req.flash('errMsg', 'Something Went Wrong');
					res.redirect('back');
				}
			});
		} else {
			req.flash('errMsg', 'Current Password is incorrect');
			res.redirect('back');
		}
	});
});

router.get('/contact-us', adminAuth,(req, res) => {
	res.render('admin/contactus', {
		title: 'Contact Us | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg'),
		admin_cookie: req.cookies['koala_adminid']
	});
});

router.get('/about-us', adminAuth, (req, res) => {
	res.render('admin/aboutus', {
		title: 'About Us | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg'),
		admin_cookie: req.cookies['koala_adminid']
	});
});

// coupen 
router.get('/coupen', adminAuth, function (req, res, next) {
	var errarr = [];
	Coupenmaster.find({}, (err, coupens) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			res.render('admin/coupen', {
				coupens: coupens,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				title: 'coupens | koalastore',
				admin_cookie:req.cookies['koala_adminid']
			});	
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.post('/addcoupen', adminAuth, (req, res, next) => {
	var errarr = [];
	var newCoupen = new Coupenmaster();

	newCoupen.coupendetails.coupencode = req.body.coupenname;
	newCoupen.coupendetails.description = req.body.description;
	newCoupen.expiry.expirydate = req.body.expiry;
	newCoupen.discountpercentage.percentage = req.body.percentage;
	newCoupen.discountpercentage.maxcash = req.body.maxcash;
	newCoupen.discountcash.cash = req.body.cash;
	if(req.body.type == 'percentage') {
		newCoupen.type.discountpercentage = true;
		newCoupen.type.discountcash = false;
	} else if (req.body.type == 'cash') {
		newCoupen.type.discountpercentage = false;
		newCoupen.type.discountcash = true;
	}
	newCoupen.save((err, Coupen) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', 'Coupen Added Successfully');
			res.redirect('back')
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.post('/deletecoupen/:id', adminAuth, (req, res) => {
	var errarr = [];
	Coupenmaster.findOneAndDelete({
		_id: req.params.id
	}, (err, deleted) => {
		if (err) {
			errarr.push('error 1');
		}
		if (errarr.length == 0) {
			req.flash('sucMsg', deleted.coupendetails.coupencode+' deleted Successfully');
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// exports routes to app.js
module.exports = router;