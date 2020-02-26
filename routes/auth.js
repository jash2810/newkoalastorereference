const router = require('express').Router();
const passport = require('passport');
const Usermaster = require('../models/usermodel');
const Adminmaster = require('../models/adminmodel');
const Categorymaster = require('../models/categorymodel');
const Namemaster = require('../models/namemodel');
const Productmaster = require('../models/productmodel');
const Cartmaster = require('../models/cartmodel');
const Ordermaster = require('../models/ordermodel');

const authCheck = (req, res, next) => {
	if (!req.user) {
		// not logged in
		res.redirect('/');
	} else {
		// logged in
		next();
	}
};

// google
router.get('/google', passport.authenticate('google', {
	scope: ['profile', 'email']
}));

// callback url for google
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
	// res.send(req.user);
	if (req.user.gmail_login == false && req.user.koala_login == false) {
		res.render('general/newgoogleuser', {
			title: 'New Google User',
			user: req.user,
			errMsg: req.flash('errMsg'),
			sucMsg: req.flash('sucMsg')
		});
	} else if(req.user.gmail_login == false && req.user.koala_login == true) {
		// is a general user
		req.flash('errMsg', 'You need to login manually !');
		res.redirect('/login');
	} else {
		// already a user
		res.clearCookie('koala_adminid');
		res.cookie('koala_userid', req.user._id, {maxAge: 31*24*60*60*1000});
		res.redirect('/users/welcome');
	}
});

router.post('/newgoogleuser', (req, res) => {
	Usermaster.findOneAndUpdate({
		'googleid': req.body.googleid
	}, {
		$push: {
			'address': {
				'house': req.body.house,
				'street1': req.body.street1,
				'street2': req.body.street2,
				'landmark': req.body.landmark,
				'area': req.body.area,
				'city': req.body.city,
				'pincode': req.body.pincode
			}
		},
		$set: {
			'delivery.address': {
				'house': req.body.house,
				'street1': req.body.street1,
				'street2': req.body.street2,
				'landmark': req.body.landmark,
				'area': req.body.area,
				'city': req.body.city,
				'pincode': req.body.pincode
			},
			'delivery.contactNo': req.body.contact1,
			'contact.contactNo1': req.body.contact1,
			'contact.contactNo2': req.body.contact2,
			'email_verification': true,
			'gmail_login': true,
			'koala_login': false
		}
	}, (err, user) => {
		if (err) {
			throw err;
		}
		res.clearCookie('koala_adminid');
		res.cookie('koala_userid', user._id, {maxAge: 31*24*60*60*1000});
		res.redirect('/users/welcome');
	});
});

module.exports = router;