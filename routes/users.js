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
const Couponmaster = require('../models/coupenmodel');
const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;

// for user authentication
const userAuth = (req, res, next) => {
	if (!req.cookies['koala_userid']) {
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


// GET users listing. 
router.get('/welcome', userAuth, function(req, res, next) {
	var errorarray = [];
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, {
		'personal.fullname': 1
	}, (err, user) => {
		if (err) {
			errorarray.push('error 1');
		}
		Productmaster.find().distinct('details.category', (err, categories) => {
			if (err) {
				errorarray.push('error 2');
			}
			Productmaster.find({}, (err, products) => {
				if (err) {
					errorarray.push('error 3');
				}
				Cartmaster.findOne({
					'details.userid': req.cookies['koala_userid']
				}, {
					'productlist.quantity': 1
				}, (err, cart) => {
					if (err) {
						errorarray.push('error 4');
					}
					Productmaster.find().distinct('property.color', (err, colors) => {
						if (err) {
							errorarray.push('error 5');
						}
						Productmaster.find().distinct('property.size', (err, sizes) => {
							if (err) {
								errorarray.push('error 6');
							}
							var totalproducts = parseInt(0);
							for (var i = cart.productlist.length - 1; i >= 0; i--) {
								totalproducts = totalproducts + parseInt(cart.productlist[i].quantity, 10);
							}
							if (errorarray.length == 0) {
								req.session.totpro = totalproducts;
								res.render('user/welcome', {
									title: 'Welcome | Koalastore',
									user: user,
									categories: categories,
									products: products,
									totpro: totalproducts,
									colors: colors,
									sizes: sizes,
									errMsg: req.flash('errMsg'),
									sucMsg: req.flash('sucMsg'),
									user_cookie: req.cookies['koala_userid']
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
	});
});

// get product
router.get('/product/:id', userAuth, (req, res) => {
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
				Cartmaster.findOne({
					'details.userid': req.cookies['koala_userid']
				}, {
					productlist: 1
				}, (err, cartproductlist) => {
					if (err) {
						errorarray.push('error 4');
					}
					if (errorarray.length == 0) {
						res.render('user/product', {
							title: product.details.name+' | Koalastore',
							product: product,
							availablesize: availablesize,
							availableproducts: availableproducts,
							cartproductlist: cartproductlist.productlist,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro
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


// get products by size and name
router.get('/products/:size/:name', userAuth, (req, res) => {
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
				res.render('user/products', {
					title: req.params.name+' | Koalastore',
					products: products,
					productsincategory: productsincategory,
					errMsg: req.flash('errMsg'),
					sucMsg: req.flash('sucMsg'),
					user_cookie: req.cookies['koala_userid'],
					totpro: req.session.totpro
				});
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// get product by category
router.get('/pbcategory/:category', userAuth, (req, res) => {
	var errorarray = [];
	Productmaster.find({
		'details.category': req.params.category
	}, (err, products) => {
		if (err) {
			errorarray.push('error 1');
		}
		if (errorarray.length == 0) {
			res.render('user/pbcategory', {
				title: req.params.category+' | Koalastore',
				products: products,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				user_cookie: req.cookies['koala_userid'],
				totpro: req.session.totpro
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// cart @ 02-09-18
router.post('/add-to-cart/:id', userAuth, (req, res) => {
	var errorarray = [];
	Productmaster.findOne({
		_id: req.params.id
	}, (err, product) => {
		if (err) {
			errorarray.push('error 1');
		}
		Cartmaster.findOneAndUpdate({
			'details.userid': req.cookies['koala_userid']
		}, {
			$push: {
				productlist: {
					productid: req.params.id,
					quantity: req.body.quantity,
					originalprice: req.body.originalprice*req.body.quantity,
					finalprice: req.body.finalprice*req.body.quantity,
					discount: product.price.discount,
					name: req.body.name,
					category: req.body.category,
					color: req.body.color,
					size: req.body.size,
					image: req.body.image
				}
			}
		}, (err, cart) => {
			if (err) {
				errorarray.push('error 2');
			}
			if (errorarray.length == 0) {
				req.session.totpro = req.session.totpro + parseInt(req.body.quantity);
				res.redirect('back');
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// remove from cart @ 02-09-18
router.get('/remove-from-cart/:id', userAuth, (req, res) => {
	var errorarray = [];
	var quantity = parseInt(0);
	Cartmaster.findOneAndUpdate({
		'details.userid': req.cookies['koala_userid']
	}, {
		$pull: {
			productlist: {
				productid: req.params.id
			}
		}
	}, (err, cart) => {
		if (err) {
			errorarray.push('error 1');
		}
		for(var i = 0; i < cart.productlist.length; i++) {
			if (cart.productlist[i].productid == req.params.id) {
				quantity = quantity + parseInt(cart.productlist[i].quantity);
			}
		}
		if (errorarray.length == 0) {
			req.session.totpro = req.session.totpro - quantity;
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// get cart
router.get('/cart', userAuth, (req, res) => {
	var errorarray = [];
	Cartmaster.findOne({
		'details.userid': req.cookies['koala_userid']
	}, (err, cart) => {
		if (err) {
			errorarray.push('error 1')
		}
		if (errorarray.length == 0) {
			res.render('user/mycart', {
				title: 'Cart | Koalastore',
				products: cart.productlist,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				user_cookie: req.cookies['koala_userid'],
				totpro: req.session.totpro,
				productlistlength: cart.productlist.length
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

/* checkout 02-09-18 */
router.get('/checkout', userAuth, (req, res) => {
	var errorarray = [];
	var finalpayment = parseInt(0);
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errorarray.push('error 1');
		}
		Cartmaster.findOne({
			'details.userid': req.cookies['koala_userid']
		}, (err, cart) => {
			if (err) {
				errorarray.push('error 2');
			}
			for (var i = 0; i < cart.productlist.length; i++) {
				finalpayment = finalpayment + parseInt(cart.productlist[i].finalprice, 10);
			}
			Couponmaster.find({}, (err, coupons) => {
				if (err) {
					errorarray.push('error 1');
				}
				if (cart.productlist.length == 0) {
					res.redirect('back');
				} else {
					if (errorarray.length == 0) {
						res.render('user/checkout', {
							title: 'Your Details | Koalastore',
							user: user,
							coupons: coupons,
							finalpayment: finalpayment,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro
						});
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				}
			});
		});
	});
});

// post coupon code buynow
router.post('/applied-coupon-code-buynow/:finalpayment/:pid/:qty', (req, res) => {
	var errarr = [];
	var finalpayment = req.params.finalpayment;
	Couponmaster.findOne({
		'coupendetails.coupencode': req.body.couponcode
	}, (err, coupon) => {
		if (err) {
			errarr.push('error 1');
		}
		if (coupon) {
			Usermaster.findOne({
				_id: req.cookies['koala_userid']
			}, (err, user) => {
				if (err) {
					errarr.push('error 2');
				}
				if (coupon.type.discountcash) {
					finalpayment = finalpayment - coupon.discountcash.cash;
				} else if (coupon.type.discountpercentage) {
					discountamount = finalpayment*(coupon.discountpercentage.percentage/100);
					console.log(discountamount);
					if (discountamount <= coupon.discountpercentage.maxcash) {
						finalpayment = finalpayment - discountamount;
					} else {
						finalpayment = finalpayment - coupon.discountpercentage.maxcash;
					}
				}
				Productmaster.findOne({
					_id: req.params.pid
				}, (err, product) => {
					if (err) {
						errarr.push('error 3');
					}
					if (errarr.length == 0) {
						req.flash('sucMsg', 'Coupon Code '+coupon.coupendetails.coupencode+' Applied Successfully');
						res.render('user/buynowcheckout-cc-applied', {
							title: 'Your Details | Koalastore',
							user: user,
							product: product,
							finalpayment: finalpayment,
							qty: req.params.qty,
							errMsg: req.flash('errMsg'),
							sucMsg: req.flash('sucMsg'),
							user_cookie: req.cookies['koala_userid'],
							totpro: req.session.totpro
						});
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				});
			});
		} else {
			
		}
	});
});

// post coupon code
router.post('/applied-coupon-code', (req, res) => {
	var errarr = [];

	Couponmaster.findOne({
		'coupendetails.coupencode': req.body.couponcode
	}, (err, coupon) => {
		if (err) {
			errarr.push('error 1');
		}
		if (coupon) {
			// coupon code applicable
			var finalpayment = parseInt(0);
			Usermaster.findOne({
				_id: req.cookies['koala_userid']
			}, (err, user) => {
				if (err) {
					errarr.push('error 1');
				}
				Cartmaster.findOne({
					'details.userid': req.cookies['koala_userid']
				}, (err, cart) => {
					if (err) {
						errarr.push('error 2');
					}
					for (var i = 0; i < cart.productlist.length; i++) {
						finalpayment = finalpayment + parseInt(cart.productlist[i].finalprice, 10);
					}
					console.log(finalpayment);
					if (coupon.type.discountcash) {
						finalpayment = finalpayment - coupon.discountcash.cash;
					} else if (coupon.type.discountpercentage) {
						discountamount = finalpayment*(coupon.discountpercentage.percentage/100);
						console.log(discountamount);
						if (discountamount <= coupon.discountpercentage.maxcash) {
							finalpayment = finalpayment - discountamount;
						} else {
							finalpayment = finalpayment - coupon.discountpercentage.maxcash;
						}
					}
					if (cart.productlist.length == 0) {
						res.redirect('/users/checkout');
					} else {
						if (errarr.length == 0) {
							req.flash('sucMsg', 'Coupon Code '+coupon.coupendetails.coupencode+' Applied Successfully');
							res.render('user/checkout-cc-applied', {
								title: 'Your Details | Koalastore',
								user: user,
								finalpayment: finalpayment,
								errMsg: req.flash('errMsg'),
								sucMsg: req.flash('sucMsg'),
								user_cookie: req.cookies['koala_userid'],
								totpro: req.session.totpro
							});
						} else {
							req.flash('errMsg', 'Something Went Wrong');
							res.redirect('back');
						}
					}
				});
			});
		} else {
			req.flash('errMsg', 'No Such ('+req.body.couponcode+') Couponcode Found');
			res.redirect('back');
		}
	});
});

// add address @ 02-09-18
router.post('/newaddress', (req, res) => {
	var errorarray = [];
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
	Usermaster.findOneAndUpdate({
		_id: req.cookies['koala_userid']
	}, {
		$push: {
			address: addressDetails
		}
	}, (err, updated) => {
		if (err) {
			errorarray.push('error 1');
		}
		if (errorarray.length == 0) {
			req.flash('sucMsg', 'New Address Added Successfully')
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// change address at checkout @ 02-09-18
router.post('/change-details', (req, res) => {
	var errorarray = [];

	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, {
		address: 1
	}, (err, user) => {
		if (err) {
			errorarray.push('error 1');
		}
		Usermaster.findOneAndUpdate({
			_id: req.cookies['koala_userid']
		}, {
			$set: {
				'delivery.address': user.address[req.body.addressindex]
			}
		}, {
			upsert: true
		}, (err, updated) => {
			if (err) {
				errorarray.push('error 2');
			}
			if (errorarray.length == 0) {
				res.redirect('back');
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// order cod buynow
router.post('/order-cod-buynow/:id', (req, res) => {
	var errorarray = [];
	var pidarray = [];
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
	var productDetails = {
		productid: req.body.pid,
		quantity: req.body.pqty,
		originalprice: req.body.poriginalprice,
		finalprice: req.body.pfinalprice,
		name: req.body.pname,
		category: req.body.pcategory,
		color: req.body.pcolor,
		size: req.body.psize,
		image: req.body.pimage
	};
	// Cartmaster.findOneAndUpdate({
	// 	'details.userid' : req.cookies['koala_userid']
	// }, {
	// 	$set: {
	// 		productlist: []
	// 	}
	// }, (err, cartcleared) => {
	// 	if (err) {
	// 		errorarray.push('error 1');
	// 	}
	var newOrder = new Ordermaster();

	newOrder.userdetails.userid = req.params.id;
	newOrder.userdetails.fullname = req.body.fullname;
	newOrder.delivery.address = addressDetails;
	newOrder.contact.email = req.body.email;
	newOrder.contact.contactNo = req.body.contact;
	newOrder.payment.finalprice = req.body.finalpayment;
	newOrder.productlist = productDetails;
	newOrder.status.delivered = 0;
	newOrder.paymenttype.paytm.ispaytm = false;
	newOrder.paymenttype.cod = true;

	newOrder.save((err, order) => {
		if (err) {
			errorarray.push('error 2');
		}
		// for (var i = 0; i < cartcleared.productlist.length; i++) {
			var objid = new ObjectId(req.body.pid);
			Productmaster.findOneAndUpdate({
				_id: objid
			}, {
				$inc: {
					'property.quantity': -req.body.pqty
				}
			}, (err, updated) => {
				if (err) {
					errorarray.push('error 3');
				}
			});
		// }
		if (errorarray.length == 0) {
			// sends mail to user
			mailer.send({
				from: 'koalatechnical@gmail.com',
				to: req.body.email,
				subject: 'Order Successful !',
				template: 'order_success',
				data: {
					// cartproducts: cartcleared.productlist,
					payment: req.body.finalpayment,
					orderid: order._id,
					fullname: req.body.fullname,
					address: addressDetails
				}
			});
			// sends mail to admin
			mailer.send({
				from: 'koalatechnical@gmail.com',
				to: 'jashdetroj@gmail.com',
				subject: 'New Order @ Koalastore',
				template: 'new_order',
				data: {
					payment: req.body.finalpayment,
					orderid: order._id,
					fullname: req.body.fullname
				}
			});
			req.flash('sucMsg', 'Your Order has been successful');
			res.redirect('/users/welcome');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
		// });
	});
});

// order-cod-buynow-cc-applied
router.post('/order-cod-buynow-cc-applied/:pid/:qty', (req, res) => {
	var errarr = [];

	Productmaster.findOne({
		_id: req.params.pid
	}, (err, product) => {
		if (err) {
			errarr.push('error 1');
		}
		console.log(product);
		Usermaster.findOne({
			_id: req.cookies['koala_userid']
		}, (err, user) => {
			if (err) {
				errarr.push('error 2');
			}
			console.log(user);
			
			var newOrder = new Ordermaster();

			newOrder.userdetails.userid = user._id;
			newOrder.userdetails.fullname = user.personal.fullname;

			var addressDetails = user.delivery.address;

			newOrder.delivery.address = addressDetails;

			newOrder.contact.email = user.personal.email;
			newOrder.contact.contactNo = user.delivery.contactNo;

			newOrder.payment.finalprice = req.body.finalpayment;
			newOrder.paymenttype.cod = true;
			newOrder.paymenttype.paytm.ispaytm = false;

			var productDetails = {
				productid: product._id,
				quantity: req.params.qty,
				originalprice: product.price.originalprice*req.params.qty,
				finalprice: product.price.finalprice*req.params.qty,
				name: product.details.name,
				category: product.details.category,
				color: product.property.color,
				size: product.property.size,
				image: product.property.image
			};

			newOrder.productlist.push(productDetails);

			newOrder.save((err, order) => {
				if (err) {
					errarr.push('error 2');
				}
				Productmaster.findOneAndUpdate({
					_id: req.params.pid
				}, {
					$inc: {
						'property.quantity': -req.params.qty
					}
				}, (err, updated) => {
					if (err) {
						errarr.push('error 2');
					}
					if (errarr.length == 0) {
						// sends mail to user
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: req.body.email,
							subject: 'Order Successful !',
							template: 'order_success',
							data: {
								// cartproducts: cartcleared.productlist,
								payment: req.body.finalpayment,
								orderid: order._id,
								fullname: req.body.fullname,
								address: addressDetails
							}
						});
						// sends mail to admin
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: 'jashdetroj@gmail.com',
							subject: 'New Order @ Koalastore',
							template: 'new_order',
							data: {
								payment: req.body.finalpayment,
								orderid: order._id,
								fullname: req.body.fullname
							}
						});
						req.flash('sucMsg', 'Your Order has been successful');
						res.redirect('/users/welcome');
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				});
			});
		});
	});
});

// order-paytm-buynow-cc-applied
router.post('/order-paytm-buynow-cc-applied/:pid/:qty', (req, res) => {
	var errarr = [];

	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errarr.push('error 1');
		}
		Productmaster.findOne({
			_id: req.params.pid
		}, (err, product) => {
			if (err) {
				errarr.push('error 2');
			}
			var newOrder = new Ordermaster();

			newOrder.userdetails.userid = user._id;
			newOrder.userdetails.fullname = user.personal.fullname;

			newOrder.delivery.address = user.delivery.address;

			newOrder.contact.email = user.personal.email;
			newOrder.contact.contactNo = user.delivery.contactNo;

			newOrder.payment.finalprice = req.body.finalpayment;

			newOrder.paymenttype.cod = false;
			newOrder.paymenttype.paytm.ispaytm = true;
			newOrder.paymenttype.paytm.paytmNumber = req.body.paytmnumber;

			productDetails = {
				productid: product._id,
				quantity: req.params.qty,
				originalprice: product.price.originalprice*req.params.qty,
				finalprice: product.price.finalprice*req.params.qty,
				name: product.details.name,
				category: product.details.category,
				color: product.property.color,
				size: product.property.size,
				image: product.property.image
			};

			newOrder.productlist.push(productDetails);

			newOrder.save((err, order) => {
				if (err) {
					errarr.push(err);
				}
				Productmaster.findOneAndUpdate({
					_id: req.params.pid
				}, {
					$inc: {
						'property.quantity': -req.params.qty
					}
				}, (err, updated) => {
					if (err) {
						errarr.push('error 1');
					}
					if (errarr.length == 0) {
						// sends mail to user
						// mailer.send({
						// 	from: 'koalatechnical@gmail.com',
						// 	to: req.body.email,
						// 	subject: 'Order Successful !',
						// 	template: 'order_success',
						// 	data: {
						// 		cartproducts: cartcleared.productlist,
						// 		payment: req.body.finalpayment,
						// 		orderid: order._id,
						// 		fullname: req.body.fullname,
						// 		address: addressDetails
						// 	}
						// });
						// sends mail to admin
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: 'jashdetroj@gmail.com',
							subject: 'Paytm Order @ Koalastore through '+req.body.paytmnumber,
							template: 'new_order',
							data: {
								payment: req.body.finalpayment,
								orderid: order._id,
								fullname: req.body.fullname
							}
						});
						req.flash('sucMsg', 'Your Order has been successful');
						res.redirect('/users/welcome');
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				});
			});
		});
	});
});

// Order paytm buynow
router.post('/order-paytm-buynow/:id/:qty', (req, res) => {
	var errorarray = [];
	var pidarray = [];
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
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errorarray.push('error 1');
		}
		var contactDetails = {
			email: user.personal.email,
			contactNo: user.delivery.contactNo
		};
		Productmaster.findOne({
			_id: req.params.id
		}, (err, product) => {
			if (err) {
				errorarray.push('error 2');
			}
			var newOrder = new Ordermaster();

			newOrder.userdetails.userid = user._id;
			newOrder.userdetails.fullname = user.personal.fullname;

			newOrder.delivery.address = addressDetails;

			newOrder.contact = contactDetails;

			newOrder.payment.finalprice = req.body.finalpayment;

			newOrder.paymenttype.paytm.ispaytm = true;
			newOrder.paymenttype.paytm.paytmNumber = req.body.paytmnumber;
			newOrder.paymenttype.cod = false;

			var productDetails = {
				productid: product._id,
				quantity: req.params.qty,
				originalprice: product.price.originalprice*req.params.qty,
				finalprice: product.price.finalprice*req.params.qty,
				name: product.details.name,
				category: product.details.category,
				color: product.property.color,
				size: product.property.size,
				image: product.property.image
			};

			newOrder.productlist.push(productDetails);

			newOrder.save((err, order) => {
				if (err) {
					errorarray.push('error 3');
				}
				Productmaster.findOneAndUpdate({
					_id: req.params.id
				}, {
					$inc: {
						'property.quantity': -req.params.qty
					}
				}, (err, updated) => {
					if (err) {
						errorarray.push('error 4');
					}
					if (errorarray.length == 0) {
						// sends mail to user
						// mailer.send({
						// 	from: 'koalatechnical@gmail.com',
						// 	to: req.body.email,
						// 	subject: 'Order Successful !',
						// 	template: 'order_success',
						// 	data: {
						// 		cartproducts: cartcleared.productlist,
						// 		payment: req.body.finalpayment,
						// 		orderid: order._id,
						// 		fullname: req.body.fullname,
						// 		address: addressDetails
						// 	}
						// });
						// sends mail to admin
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: 'jashdetroj@gmail.com',
							subject: 'Paytm Order @ Koalastore through '+req.body.paytmnumber,
							template: 'new_order',
							data: {
								payment: req.body.finalpayment,
								orderid: order._id,
								fullname: req.body.fullname
							}
						});
						req.flash('sucMsg', 'Your Order has been successful');
						res.redirect('/users/welcome');
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				});
			});
		});
	});
	// // Cartmaster.findOneAndUpdate({
	// // 	'details.userid' : req.cookies['koala_userid']
	// // }, {
	// // 	$set: {
	// // 		productlist: []
	// // 	}
	// // }, (err, cartcleared) => {
	// // 	if (err) {
	// // 		errorarray.push('error 1');
	// // 	}
	// 	var newOrder = new Ordermaster();

	// 	newOrder.userdetails.userid = req.params.id;
	// 	newOrder.userdetails.fullname = req.body.fullname;
	// 	newOrder.delivery.address = addressDetails;
	// 	newOrder.contact.email = req.body.email;
	// 	newOrder.contact.contactNo = req.body.contact;
	// 	newOrder.payment.finalprice = req.body.finalpayment;
	// 	newOrder.productlist = cartcleared.productlist;
	// 	newOrder.status.delivered = 0;
	// 	newOrder.paymenttype.paytm.ispaytm = true;
	// 	newOrder.paymenttype.paytm.paytmNumber = req.body.paytmnumber;
	// 	newOrder.paymenttype.cod = false;

	// 	newOrder.save((err, order) => {
	// 		if (err) {
	// 			errorarray.push('error 2');
	// 		}
	// 		for (var i = 0; i < cartcleared.productlist.length; i++) {
	// 			var objid = new ObjectId(cartcleared.productlist[i].productid);
	// 			Productmaster.findOneAndUpdate({
	// 				_id: objid
	// 			}, {
	// 				$inc: {
	// 					'property.quantity': -cartcleared.productlist[i].quantity
	// 				}
	// 			}, (err, updated) => {
	// 				if (err) {
	// 					errorarray.push('error 3');
	// 				}
	// 			});
	// 		}
			// if (errorarray.length == 0) {
			// 	// sends mail to user
			// 	// mailer.send({
			// 	// 	from: 'koalatechnical@gmail.com',
			// 	// 	to: req.body.email,
			// 	// 	subject: 'Order Successful !',
			// 	// 	template: 'order_success',
			// 	// 	data: {
			// 	// 		cartproducts: cartcleared.productlist,
			// 	// 		payment: req.body.finalpayment,
			// 	// 		orderid: order._id,
			// 	// 		fullname: req.body.fullname,
			// 	// 		address: addressDetails
			// 	// 	}
			// 	// });
			// 	// sends mail to admin
			// 	mailer.send({
			// 		from: 'koalatechnical@gmail.com',
			// 		to: 'jashdetroj@gmail.com',
			// 		subject: 'Paytm Order @ Koalastore through '+req.body.paytmnumber,
			// 		template: 'new_order',
			// 		data: {
			// 			payment: req.body.finalpayment,
			// 			orderid: order._id,
			// 			fullname: req.body.fullname
			// 		}
			// 	});
			// 	req.flash('sucMsg', 'Your Order has been successful');
			// 	res.redirect('/users/welcome');
			// } else {
			// 	req.flash('errMsg', 'Something Went Wrong');
			// 	res.redirect('back');
			// }
	// 	// });
	// });
});


// Order cod
router.post('/order-cod/:id', (req, res) => {
	var errorarray = [];
	var pidarray = [];
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
	Cartmaster.findOneAndUpdate({
		'details.userid' : req.cookies['koala_userid']
	}, {
		$set: {
			productlist: []
		}
	}, (err, cartcleared) => {
		if (err) {
			errorarray.push('error 1');
		}
		var newOrder = new Ordermaster();

		newOrder.userdetails.userid = req.params.id;
		newOrder.userdetails.fullname = req.body.fullname;
		newOrder.delivery.address = addressDetails;
		newOrder.contact.email = req.body.email;
		newOrder.contact.contactNo = req.body.contact;
		newOrder.payment.finalprice = req.body.finalpayment;
		newOrder.productlist = cartcleared.productlist;
		newOrder.status.delivered = 0;
		newOrder.paymenttype.paytm.ispaytm = false;
		newOrder.paymenttype.cod = true;

		newOrder.save((err, order) => {
			if (err) {
				errorarray.push('error 2');
			}
			for (var i = 0; i < cartcleared.productlist.length; i++) {
				var objid = new ObjectId(cartcleared.productlist[i].productid);
				Productmaster.findOneAndUpdate({
					_id: objid
				}, {
					$inc: {
						'property.quantity': -cartcleared.productlist[i].quantity
					}
				}, (err, updated) => {
					if (err) {
						errorarray.push('error 3');
					}
				});
			}
			if (errorarray.length == 0) {
				// sends mail to user
				mailer.send({
					from: 'koalatechnical@gmail.com',
					to: req.body.email,
					subject: 'Order Successful !',
					template: 'order_success',
					data: {
						cartproducts: cartcleared.productlist,
						payment: req.body.finalpayment,
						orderid: order._id,
						fullname: req.body.fullname,
						address: addressDetails
					}
				});
				// sends mail to admin
				mailer.send({
					from: 'koalatechnical@gmail.com',
					to: 'jashdetroj@gmail.com',
					subject: 'New Order @ Koalastore',
					template: 'new_order',
					data: {
						payment: req.body.finalpayment,
						orderid: order._id,
						fullname: req.body.fullname
					}
				});
				req.flash('sucMsg', 'Your Order has been successful');
				res.redirect('/users/welcome');
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// Order paytm
router.post('/order-paytm/:id', (req, res) => {
	var errorarray = [];
	var pidarray = [];
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
	Cartmaster.findOneAndUpdate({
		'details.userid' : req.cookies['koala_userid']
	}, {
		$set: {
			productlist: []
		}
	}, (err, cartcleared) => {
		if (err) {
			errorarray.push('error 1');
		}
		var newOrder = new Ordermaster();

		newOrder.userdetails.userid = req.params.id;
		newOrder.userdetails.fullname = req.body.fullname;
		newOrder.delivery.address = addressDetails;
		newOrder.contact.email = req.body.email;
		newOrder.contact.contactNo = req.body.contact;
		newOrder.payment.finalprice = req.body.finalpayment;
		newOrder.productlist = cartcleared.productlist;
		newOrder.status.delivered = 0;
		newOrder.paymenttype.paytm.ispaytm = true;
		newOrder.paymenttype.paytm.paytmNumber = req.body.paytmnumber;
		newOrder.paymenttype.cod = false;

		newOrder.save((err, order) => {
			if (err) {
				errorarray.push('error 2');
			}
			for (var i = 0; i < cartcleared.productlist.length; i++) {
				var objid = new ObjectId(cartcleared.productlist[i].productid);
				Productmaster.findOneAndUpdate({
					_id: objid
				}, {
					$inc: {
						'property.quantity': -cartcleared.productlist[i].quantity
					}
				}, (err, updated) => {
					if (err) {
						errorarray.push('error 3');
					}
				});
			}
			if (errorarray.length == 0) {
				// sends mail to user
				// mailer.send({
				// 	from: 'koalatechnical@gmail.com',
				// 	to: req.body.email,
				// 	subject: 'Order Successful !',
				// 	template: 'order_success',
				// 	data: {
				// 		cartproducts: cartcleared.productlist,
				// 		payment: req.body.finalpayment,
				// 		orderid: order._id,
				// 		fullname: req.body.fullname,
				// 		address: addressDetails
				// 	}
				// });
				// sends mail to admin
				mailer.send({
					from: 'koalatechnical@gmail.com',
					to: 'jashdetroj@gmail.com',
					subject: 'Paytm Order @ Koalastore through '+req.body.paytmnumber,
					template: 'new_order',
					data: {
						payment: req.body.finalpayment,
						orderid: order._id,
						fullname: req.body.fullname
					}
				});
				req.flash('sucMsg', 'Your Order has been successful');
				res.redirect('/users/welcome');
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// buynow checkout
router.post('/buynow-checkout/:id', (req, res) => {
	res.redirect('/users/buynow-checkout/'+req.params.id+'/'+req.body.qty);
});

// buy now checkout get
router.get('/buynow-checkout/:id/:qty', (req, res) => {
	var errarr = [];
	var finalpayment = parseInt(0);
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errarr.push('error 1');
		}
		Couponmaster.find({}, (err, coupons) => {
			if (err) {
				errarr.push('errro 2');
			}
			Productmaster.findOne({
				_id: req.params.id
			}, (err, product) => {
				if (err) {
					errarr.push('error 3');
				}
				finalpayment = product.price.finalprice*req.params.qty;
				res.render('user/buynowcheckout', {
					title: 'Buy Now Checkout | Koalastore',
					user: user,
					coupons: coupons,
					product: product,
					qty: req.params.qty,
					finalpayment: finalpayment,
					errMsg: req.flash('errMsg'),
					sucMsg: req.flash('sucMsg'),
					user_cookie: req.cookies['koala_userid'],
					totpro: req.session.totpro
				});
			});
		});
	});
});

// buy now get
router.get('/checkout/:id', (req, res) => {
	var errorarray = [];
	var finalpayment = parseInt(0);
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errorarray.push('error 1');
		}
		Couponmaster.find({}, (err, coupons) => {
			if (err) {
				errorarray.push('error 1');
			}
			Productmaster.findOne({
				_id: req.params.id
			}, (err, product) => {
				if (err) {
					errorarray.push('error 2');
				}
				if (errorarray.length == 0) {
					res.render('user/buynow', {
						title: 'Your Details | Koalastore',
						user: user,
						coupons: coupons,
						product: product,
						finalpayment: finalpayment,
						errMsg: req.flash('errMsg'),
						sucMsg: req.flash('sucMsg'),
						user_cookie: req.cookies['koala_userid'],
						totpro: req.session.totpro
					});
				} else {
					req.flash('errMsg', 'Something Went Wrong');
					res.redirect('back');
				}
			});
		});
	});
});

// order buy now
router.post('/buy-now/:id', (req, res) => {
	var errarr = [];

	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errarr.push('error 1');
		}
		Productmaster.findOne({
			_id: req.params.id
		}, (err, product) => {
			var newOrder = new Ordermaster();

			newOrder.userdetails.userid = req.cookies['koala_userid'];
			newOrder.userdetails.fullname = user.personal.fullname;
			newOrder.delivery.address = user.delivery.address;
			newOrder.contact.email = user.personal.email;
			newOrder.contact.contactNo = user.delivery.contactNo;
			newOrder.payment.finalprice = product.price.finalprice*req.body.qty;
			var orderedproduct = {
				productid: product._id,
				quantity: req.body.qty,
				originalprice: product.price.originalprice*req.body.qty,
				finalprice: product.price.finalprice*req.body.qty,
				name: product.details.name,
				category: product.details.category,
				color: product.property.color,
				size: product.property.size,
				image: product.property.image
			}

			console.log(product);
			newOrder.productlist.push(orderedproduct);
			newOrder.status.delivered = 0;

			newOrder.save((err, order) => {
				if(err) {
					errarr.push('error 2');
				}
				Productmaster.findOneAndUpdate({
					_id: req.params.id
				}, {
					$inc: {
						'property.quantity': -req.body.qty
					}
				}, (err, updatedqty) => {
					if(err) {
						errarr.push('error 3');
					}
					if (errarr.length == 0) {
						console.log(order);
						// sends mail to user
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: order.contact.email,
							subject: 'Order Successful !',
							template: 'order_success_buynow',
							data: {
								payment: order.payment.finalprice,
								orderid: order._id,
								fullname: user.personal.fullname,
								address: order.delivery.address
							}
						});
						// sends mail to admin
						mailer.send({
							from: 'koalatechnical@gmail.com',
							to: 'jashdetroj@gmail.com',
							subject: 'New Order @ Koalastore',
							template: 'new_order',
							data: {
								payment: order.payment.finalprice,
								orderid: order._id,
								fullname: user.personal.fullname
							}
						});
						req.flash('sucMsg', 'Your Order has been successful');
						res.redirect('/users/welcome');
					} else {
						req.flash('errMsg', 'Something Went Wrong');
						res.redirect('back');
					}
				});
			});
		});
	});
});

// get user profile
router.get('/profile', userAuth, (req, res) => {
	var errorarray = [];
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			errorarray.push('error 1');
		}
		if (errorarray.length == 0) {
			res.render('user/profile', {
				title: user.personal.fullname+' | Koalastore',
				user: user,
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				user_cookie: req.cookies['koala_userid'],
				totpro: req.session.totpro
			});
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// edit profile @ 03-09-18
router.post('/editprofile/:id', (req, res) => {
	var errorarray = [];
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, {
		address: 1
	}, (err, user) => {
		if (err) {throw err;}
		Usermaster.findOneAndUpdate({
			_id: req.params.id
		}, {
			$set: {
				'personal.fullname': req.body.fullname,
				'contact.contactNo1': req.body.contact1,
				'contact.contactNo2': req.body.contact2,
				'delivery.address': user.address[req.body.addressindex]
			}
		}, (err, updated) => {
			if (err) {
				errorarray.push('error 1');
			}
			if (errorarray.length == 0) {
				req.flash('sucMsg', 'Profile Updated Successfully');
				res.redirect('back');
			} else {
				req.flash('errMsg', 'Something Went Wrong');
				res.redirect('back');
			}
		});
	});
});

// delete address
router.post('/delete-address', (req, res) => {
	var errorarray = [];
	Usermaster.findOneAndUpdate({
		_id: req.cookies['koala_userid']
	}, {
		$pull: {
			address: {
				house: req.body.address
			}
		}
	}, (err, deleted) => {
		if (err) {
			errorarray.push('error 1');
		}
		if (errorarray.length == 0) {
			req.flash('sucMsg', 'Address has been deleted Successfully');
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

// orders
router.get('/orders', userAuth, (req, res) => {
	Ordermaster.find({
		'userdetails.userid': req.cookies['koala_userid']
	}, {

	}, {
		sort: {
			'status.delivered': 1,
			'createdAt': -1
		}
	}, (err, orders) => {
		if (err) {
			throw err;
		}
		res.render('user/myorders', {
			title: 'Orders | Koalastore',
			orders: orders,
			errMsg: req.flash('errMsg'),
			sucMsg: req.flash('sucMsg'),
			user_cookie: req.cookies['koala_userid'],
			totpro: req.session.totpro
		});
	});
});

// cancel order
router.get('/cancel-order/:id', (req, res) => {
	var errarr = [];
	Ordermaster.findOneAndUpdate({
		'_id': req.params.id
	}, {
		$set: {
			'status.canceled': 1
		}
	}, (err, order) => {
		if (err) {
			errarr.push('error 1');
		}
		for (var i = order.productlist.length - 1; i >= 0; i--) {
			Productmaster.findOneAndUpdate({
				_id: order.productlist[i].productid
			}, {
				$inc: {
					'property.quantity': +order.productlist[i].quantity
				}
			}, (err, updated) => {
				if (err) {
					errarr.push('error 2');
				}
			});
		}
		if (errarr.length == 0) {
			mailer.send({
				from: 'koalatechnical@gmail.com',
				to: order.contact.email,
				subject: 'Order Cancelation',
				template: 'order_cancelation_user',
				data: {
					order: order
				}
			});
			mailer.send({
				from: 'koalatechnical@gmail.com',
				to: 'koalatechnical@gmail.com',
				subject: 'Order Cancelled',
				template: 'order_cancelation_admin',
				data: {
					order: order
				}
			});
			req.flash('sucMsg', 'Your order has been canceled successfully');
			res.redirect('back');
		} else {
			req.flash('errMsg', 'Something Went Wrong');
			res.redirect('back');
		}
	});
});

router.get('/change-password', userAuth, (req, res) => {
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, (err, user) => {
		if (err) {
			throw err;
		}
		if (user.gmail_login == true) {
			res.redirect('/');
		} else {
			res.render('user/change-password', {
				title: 'Change Password | Koalastore',
				errMsg: req.flash('errMsg'),
				sucMsg: req.flash('sucMsg'),
				user_cookie: req.cookies['koala_userid'],
				totpro: req.session.totpro
			});
		}
	});
});

router.post('/change-password', (req, res) => {
	var errarr = [];
	Usermaster.findOne({
		_id: req.cookies['koala_userid']
	}, {
		'personal.password': 1
	}, (err, user) => {
		if (err) {
			errarr.push('error 1');
		}
		if (passwordhash.verify(req.body.currentpassword, user.personal.password)) {
			Usermaster.findOneAndUpdate({
				_id: req.cookies['koala_userid']
			}, {
				$set: {
					'personal.password': passwordhash.generate(req.body.newpassword)
				}
			}, (err, updated) => {
				if (err) {
					errarr.push('error 2');
				}
				if (errarr.length == 0) {
					req.flash('sucMsg', 'Password Updated Successfully');
					res.redirect('/users/profile');
				} else {
					req.flash('errMsg', 'Something Went Wrong');
					res.redirect('back');
				}
			});
		} else {
			req.flash('errMsg', 'Current Password Don\'t Match');
			res.redirect('back');
		}
	});
});

router.get('/contact-us', (req, res) => {
	res.render('user/contactus', {
		title: 'Contact Us | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg'),
		user_cookie: req.cookies['koala_userid'],
		totpro: req.session.totpro
	});
});

router.get('/about-us', (req, res) => {
	res.render('user/aboutus', {
		title: 'About Us | Koalastore',
		errMsg: req.flash('errMsg'),
		sucMsg: req.flash('sucMsg'),
		user_cookie: req.cookies['koala_userid'],
		totpro: req.session.totpro
	});
});

// filters
router.get('/filtered/products', userAuth, (req, res) => {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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
						res.render('user/filtered-products', {
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

// exports routes to app.js
module.exports = router;