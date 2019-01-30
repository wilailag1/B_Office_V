const express = require('express');
const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  res.locals.title = 'System Status - Monitor';

  res.render('app/monitor/system');
});

module.exports = router;
