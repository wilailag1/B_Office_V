const debug = require('debug')('cloudvdm:route:monitor/user');
const express = require('express');
const router = express.Router({ mergeParams: true });
const userLogRepo = require('../../repository').UserLogRepo;
const { humanLanguage } = require('../../util/codeToHuman');

router.get('/', (req, res) => {
  res.locals.title = 'User Activities - Monitor';
  res.locals.human = humanLanguage;

  userLogRepo.findAll(0, (err, rows) => {
    if (err) {
      debug('Find all user Logs Error :', err);
      res.locals.lastError = err;
    }

    const userLog = {
      rows,
    };

    res.render('app/monitor/user', {
      userLog,
    });
  });

});

module.exports = router;
