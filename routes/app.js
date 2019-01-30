const express = require('express');
const router = express.Router();

// Nested routes
const apiRoute = require('./api');
const dashboardRoute = require('./dashboard');
const monitorRoutes = require('./monitor');
const vendingMachine = require('./vendingMachine');
const administration = require('./administration');
const productRoutes = require('./product');
const productQrRoutes = require('./productQr');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.redirect('/app/dashboard');
});

router.use('/api', apiRoute);
router.use('/dashboard', dashboardRoute);
router.use('/monitor', monitorRoutes);
router.use('/vending', vendingMachine);
router.use('/administration', administration);
router.use('/product', productRoutes);
router.use('/product-qr', productQrRoutes);

module.exports = router;
