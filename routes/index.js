const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('index', { title: 'Express' });
  console.log('hello');
  res.redirect('/auth/login');
});

router.get('/test', function (req, res, next) {
  console.log('testtttt');

  res.render('test', { test: '1234' });
});

module.exports = router;
