const debug = require('debug')('cloudvdm:route:monitor/machine-log');
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  MachineLogRepository,
} = require('../../repository');
const { humanLanguage } = require('../../util/codeToHuman');

router.get('/', (req, res) => {
  res.locals.title = 'Vending Machines Logs';
  res.locals.human = humanLanguage;

  let machineLogData = {};
  let lastError = void 0;

  MachineLogRepository.findLatestLog({
    limit: 500,
  }, (error, rows) => {
    if (error) {
      res.locals.lastError = error;
      debug('Error Vending machine log :', error);
    }

    machineLogData.rows = rows;
    res.render('app/monitor/machineLog', {
      machineLogData,
    });
  });
});

module.exports = router;
