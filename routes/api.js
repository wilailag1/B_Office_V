const debug = require('debug')('cloudvdm:route:dashboard/index');
const express = require('express');
const router = express.Router({ mergeParams: true });
const { parallel, reflectAll } = require('async');
const {
  DashboardRepository,
  MachineRepository,
  MachineLogRepository,
} = require('../repository');

router.get('/', function (req, res, next) {
  res.send({ message: 'Hello' });
});

router.get('/dashboard', (req, res) => {
  res.locals.title = 'Dashboard';

  let dashboardData = {};

  parallel({
    machine: (callback) => {
      MachineRepository.first((err, machineData) => {
        if (err) {
          debug('Load machine dashboard Error :', err);
          return callback(err);
        }

        if (!machineData) {
          return callback(null, machineData);
        }

        const { machineId } = machineData;

        DashboardRepository.getFirstMachineDashboardCoinCount(machineId, (err, result) => {
          dashboardData = result;

          // debug('Loaded Dashboard data :', dashboardData);

          if (dashboardData.ipAddress) {
            const testIp = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/.exec(dashboardData.ipAddress);
            if (testIp && testIp[1]) {
              dashboardData.ipAddress = testIp[1];
            }
          }

          DashboardRepository.getCoinReceivedCount(machineId, (err, data) => {
            if (err) {
              debug('getCoinReceivedCount Error :', err);
            }

            Object.assign(dashboardData, data);

            callback(null, dashboardData || {});
          });
        });
      });
    },

    qrCount: (callback) => {
      DashboardRepository.getQrCount((err, result) => {
        if (err) {
          debug('Error Dashboard QR Counting :', err);
          return callback(err);
        }

        callback(null, result || {});
      });
    },

    productStock: (callback) => {
      DashboardRepository.getProductStock((err, rows) => {
        if (err) {
          debug('Product stock error :', err);
          return callback(err);
        }

        rows.forEach(row => row.image = `/app/product/image/${row.image}`);
        callback(null, rows);
      });
    },

    histories: (callback) => {
      MachineLogRepository.findLatestLog(void 0, (err, logs) => {
        if (err) {
          debug('Machine logs error :', err);
          return callback(err);
        }

        callback(null, logs);
      });
    },

  }, (err, result) => {
    debug('All dashboard data resp :', result);

    if (err) {
      debug('Error Dashboard :', err);
      res.locals.lastError = err;
    }

    dashboardData = result;
    res.render('app/dashboard_body', {
      dashboardData,
      layout: 'nothing',
    });
  });
});


module.exports = router;
