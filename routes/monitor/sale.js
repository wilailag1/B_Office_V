const debug = require('debug')('cloudvdm:route:monitor/sale');
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  OrderRepository,
} = require('../../repository');

router.get('/', (req, res) => {
  res.locals.title = 'Sale - Monitor';

  const saleLogData = {};

  OrderRepository.findLatest({ limit: null }, (err, rows) => {
    if (err) {
      res.locals.lastError = err;
      debug('Error Order log :', err);
    }

    saleLogData.rows = rows;

    res.render('app/monitor/sale', {
      saleLogData,
    });
  });
});

module.exports = router;
