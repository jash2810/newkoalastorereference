var express = require('express');
var router = express.Router();

router.get('/button', (req, res) => {
	res.render('ui/button');
});

router.get('/table', (req, res) => {
	res.render('ui/table');
});

router.get('/loginform', (req, res) => {
	res.render('ui/loginform');
});

router.get('/card', (req, res) => {
	res.render('ui/card');
});

router.get('/slide', (req, res) => {
	res.render('ui/slide');
});

module.exports = router;