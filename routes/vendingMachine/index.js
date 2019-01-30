/* const express = require('express');
const router = express.Router({ mergeParams: true });

const vending = require('./vending');

router.use('/vending', vending);

module.exports = router; */
module.exports = require('./vending');
