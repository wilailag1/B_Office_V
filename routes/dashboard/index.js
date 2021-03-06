const debug = require('debug')('cloudvdm:route:dashboard/index');
const express = require('express');
const router = express.Router({ mergeParams: true });
const { parallel, reflectAll } = require('async');
const {
  DashboardRepository,
  MachineRepository,
  MachineLogRepository,
} = require('../../repository');


// router.get('/', function (req, res, next) {
//   // Copy from Dashboard route
//   res.locals.title = 'Dashboard';
//   const { machineId } = req.params;

//   MachineRepository.findById(machineId, (error, result) => {

//     if (error) {
//       debug('Load Product error :', error);
//     }

//     const machineData = result || {};
//     // const [messagePopup] = req.flash('messagePopup');
//     res.render('app/product/add', {
//       headTitle: `Edit Product ${machineData.name}`,
//       isEdit: true,
//       // messagePopup,
//       machineData,
//     });
//   });
// });


router.get('/dashboard/:machineID', (req, res) => {
  const { machineID } = req.params;

  DashboardRepository.findByMachineId(machineID, (error, result) => {

    if (error) {
      debug('Load machineEROOR error :', error);
    }

    let machineData = {};
    // const [messagePopup] = req.flash('messagePopup');

    machineData = result;
    debug('machinedata:',result);
    res.render('app/dashboard', {
      machineData,
    });
  });
});

router.get('/', function (req, res, next) {
  // Copy from Dashboard route
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
    res.render('app/dashboard', {
      dashboardData,
    });
  });
});

router.get('/_vmlatestlog', (req, res) => {

  MachineLogRepository.findLatestLog(void 0, (err, histories) => {
    if (err) {
      debug('router.get _vmlatestlog :', err);
    }

    res.render('app/dashboard_vm_log', {
      dashboardData: {
        histories,
      },
      layout: 'nothing',
    });
  });
});

module.exports = router;
