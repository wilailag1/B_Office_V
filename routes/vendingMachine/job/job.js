const debug = require('debug')('cloudvdm:route:vending-machine/vending/job');
const express = require('express');
const router = express.Router({ mergeParams: true });
const { waterfall, parallel, reflectAll } = require('async');
const {
  UserJobRepository,
  MachineRepository,
  ProductRepository,
  UserLogRepo,
} = require('../../../repository');
const { beginTransaction } = require('../../../db');
const networkUtil = require('../../../util/network');

// DeAsync Experiment !
const deasync = require('deasync');
const findActiveJobsSync = deasync(UserJobRepository.findActiveJobs);
const findJobByIdSync = deasync(UserJobRepository.findById);
const productFindByIdSync = deasync(ProductRepository.findById);

const loadProductAndMachineTasks = {

  // Load Products
  product: (callback) => {
    ProductRepository.findAll((err, productList) => {
      callback(err, productList.sort((a, b) => a.channel - b.channel));
    });
  },

  // Load Machines
  machine: (callback) => {
    MachineRepository.findAll((err, machineOptions) => {
      callback(err, machineOptions);
    });
  },

};

router.get('/', (req, res) => {
  res.locals.title = 'Restock Job';
  res.locals.headTitle = 'Job list';

  let jobData = {};

  parallel(reflectAll({
    userJob: (callback) => {
      UserJobRepository.findAllWithMachine((err, rows) => {
        if (err) {
          req.flash('error', err);
          debug('Error finding User Jobs :', err);
        }

        callback(err, rows);
      });
    },

    checkActiveJobs: (callback) => {
      UserJobRepository.findActiveJobs((err, rows) => {
        if (err) {
          req.flash('error', err);
          debug('Error checkActiveJobs :', err);
        }

        callback(err, rows.length);
      });
    },

  }), (err, result) => {

    jobData.rows = result.userJob.value || [];
    jobData.isJobActive = result.checkActiveJobs.value;

    debug('Job data list :', jobData);

    res.render('app/vending/job/list', {
      jobData,
    });
  });

});

router.get('/add', (req, res) => {
  res.locals.title = 'Add Restock Job - Machine Management';
  res.locals.headTitle = 'Restock';

  parallel(reflectAll(loadProductAndMachineTasks), (err, result) => {
    if (err) {
      req.flash('error', err);
      debug('Loading error :', err);
    }

    // debug('Result :', JSON.stringify(result));

    const {
      machine: {
        value: machineOptions,
      },
      product: {
        value: productList,
      },
    } = result;

    // debug('product options :', productOptions);

    const [jobData] = req.flash('job');

    res.render('app/vending/job/add', {
      isEdit: false,
      jobData: jobData || {
        productRestock: {},
      },
      machineOptions,
      productList,
    });
  });
});

router.post('/add', (req, res) => {
  debug('Adding job Body :', req.body);

  const {
    machineId,
    addCoin1,
    addCoin2,
    addCoin5,
    addCoin10,
    addCoin20,
    addCoin50,
    addCoin100,
  } = req.body;

  // Remove each product that restore qty is 0
  const productRestock = req.body.productRestock;
  if (productRestock) {
    for (const productId in productRestock) {
      if (productRestock[productId] == 0) {
        delete productRestock[productId];
      }
    }
  } else {
    debug('Warning Product restock data is invalid');
  }

  const addProductJson = JSON.stringify(productRestock);
  const jobData = {
    machineId,
    addCoin1,
    addCoin2,
    addCoin5,
    addCoin10,
    addCoin20,
    addCoin50,
    addCoin100,
    addProductJson,
    productRestock,
  };

  // Check Active User job (DeAsync Experiment!)
  const activeJobs = findActiveJobsSync();
  // debug('Active jobs :', activeJobs);

  if (activeJobs.length > 0) {
    req.flash('messagePopup', {
      title: 'Add new job',
      message: 'Please finish your job before adding new',
      type: 'error',
    });

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'E_JOB_CREATE_FAIL',
      { reason: 'Job still active', jobData }
    );

    return res.redirect('../list');
  }

  // IF selected no machine
  if (!machineId) {
    req.flash('error', 'Please select Machine');
    req.flash('jobData', jobData);

    return parallel(reflectAll(loadProductAndMachineTasks), (err, result) => {
      if (err) {
        req.flash('error', err);
        debug('Loading error :', err);
      }

      const {
        machine: {
          value: machineOptions,
        },
        product: {
          value: productList,
        },
      } = result;

      res.locals.title = 'Add Restock Job - Machine Management';
      res.locals.headTitle = 'Restock';

      return res.render('app/vending/job/add', {
        isEdit: false,
        jobData,
        machineOptions,
        productList,
      });
    });
  }

  // Begin Transaction for MySQL
  beginTransaction((err, conn) => {
    if (err) {
      debug('Error beginning transaction : ', err);

      req.flash('error', err);
      return res.redirect('./');
    }

    waterfall([

      // Insert User job
      (callback) => {
        UserJobRepository.insert({
          machineId,
          addCoin1,
          addCoin2,
          addCoin5,
          addCoin10,
          addCoin20,
          addCoin50,
          addCoin100,
          status: 'active',
          addProductJson,
        }, (err, result) => {
          callback(err);
        }, conn);
      },

    ], (err, result) => {
      if (err) {
        conn.rollback(); // Need to rollback tx

        debug('New job TX error :', err);
        req.flash('error', err);

        UserLogRepo.insertLog(
          req.user.userId,
          networkUtil.getClientRemote(req),
          'E_JOB_CREATE_FAIL',
          { error: err, jobData }
        );
      } else {
        // Commit transaction
        conn.commit();
        conn.release();

        req.flash('messagePopup', {
          title: 'Created job',
          message: 'Finish this job on Vending machine',
        });

        UserLogRepo.insertLog(
          req.user.userId,
          networkUtil.getClientRemote(req),
          'JOB_CREATE',
          { jobData }
        );
      }

      return res.redirect('./');
    });
  });
});

router.get('/:jobId', (req, res) => {

  const { jobId } = req.params;

  res.locals.title = 'View Restock Job - Machine Management';
  res.locals.headTitle = 'Restock';

  const { machine, product } = loadProductAndMachineTasks;
  parallel(reflectAll({
    machine,
    product,

    userJob: (callback) => {
      UserJobRepository.findById(jobId, callback);
    },

  }), (err, result) => {
    if (err) {
      req.flash('error', err);
      debug('Loading error :', err);
    }

    // debug('Result :', JSON.stringify(result));

    const {
      machine: {
        value: machineOptions,
      },
      product: {
        value: productList,
      },
      userJob: {
        value: jobData,
      }
    } = result;

    // debug('product options :', productOptions);

    try {
      jobData.productRestock = JSON.parse(jobData.addProductJson);
    } catch (e) {
      jobData.productRestock = {};
    }

    const restockProductIdList = Object.keys(jobData.productRestock);
    debug('restockProductIdList :', restockProductIdList);

    res.render('app/vending/job/add', {
      isEdit: true,
      jobData: jobData || {
        productRestock: {},
      },
      machineOptions,
      productList: productList.filter(product => restockProductIdList.indexOf(product.productId) > -1),
    });
  });
});

router.all('/finish/:jobId', (req, res) => {

  const { jobId } = req.params;

  const job = findJobByIdSync(jobId);

  UserJobRepository.findActiveJobByMachineId(job.machineId, (err, job) => {
    if (err) {
      debug('Error findActiveJobByMachineId :', err);
      req.flash('error', err);
    }

    if (!job) {
      // No job active
      debug('No active job to done .');
      req.flash('error', 'No active job');
    }

    const jobId = job.jobId;
    let productRestock = {};
    try {
      productRestock = JSON.parse(job.addProductStock);
    } catch (e) {
      debug('Error parse json :', e);
    }

    const jobData = {
      jobId,
      machineId: job.machineId,
      machineName: job.machineName,
    };

    if (jobId) {
      beginTransaction((err, conn) => {
        if (err) {
          debug('Error Job-done Begin tx :', err);
          conn.rollback();
          conn.release();
          return;
        }

        const transactionTasks = [];

        for (const productId in productRestock) {
          const restockQty = productRestock[productId];
          if (restockQty > 0) {
            transactionTasks.push((callback) => {

              debug(`Updating stock for ${productId} + ${restockQty} ...`);

              ProductRepository.addStock(productId, restockQty, (err, result) => {
                if (err) {
                  debug(`Updating stock for ${productId} is failed :`, err);
                } else {
                  debug('Updated.');
                }

                callback(err);
              }, conn);
            });
          }
        }

        transactionTasks.push(callback => {
          const productMap = {};
          for (const productId in productRestock) {
            try {
              const product = productFindByIdSync(productId);

              productMap[productId] = {
                productId: product.productId,
                productName: product.name,
                restockQty: productRestock[productId],
              };

            } catch (errPrd) {
              debug('Transaction select product error :', errPrd);
            }
          }
          callback(null, productMap);
        });

        transactionTasks.push((productMap, callback) => {
          UserJobRepository.update({
            jobId,
            status: 'done',
            updateBy: req.user.userId,
          }, (err, result) => {
            if (err) {
              debug('Error update User job :', err);
              UserLogRepo.insertLog(
                req.user.userId,
                networkUtil.getClientRemote(req),
                'E_JOB_FINISH',
                { error: err, jobId }
              );
              return;
            }

            jobData.productRestock = productMap;
            UserJobRepository.update({
              jobId,
              status: 'done',
              updateBy: req.user.userId,
            }, (err, result) => {

              UserLogRepo.insertLog(
                req.user.userId,
                networkUtil.getClientRemote(req),
                'JOB_FINISH',
                jobData
              );

              callback(err);
            }, conn);
          }, conn);
        });

        waterfall(transactionTasks, (err, result) => {
          if (err) {
            debug('Job-done Tx is failed :', err);

            conn.rollback();
            conn.release();
            return res.redirect('back');
          }
          debug('Set Job done success');

          conn.commit();
          conn.release();

          res.redirect('../');
        });
      });
    }
  });
});

router.all('/cancel/:jobId', (req, res) => {

  const { jobId } = req.params;

  UserJobRepository.update({
    jobId,
    status: 'cancel',
    updateBy: req.user.userId,
  }, (err, result) => {
    if (err) {
      debug(`Error cancel job ${jobId} :`, err);
      req.flash('error', err);

      UserLogRepo.insertLog(
        req.user.userId,
        networkUtil.getClientRemote(req),
        'E_JOB_CANCEL',
        { error: err, jobId }
      );

      return res.redirect('back');
    }

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'JOB_CANCEL',
      { jobId }
    );

    res.redirect('../');
  });
});

/* router.post('/:jobId', (req, res) => {
  // TODO: Post  Edit job

}); */

// TODO: Change to Update status to "cancel"
/* router.all('/delete/:jobId', (req, res) => {
  debug('Deleting JOB : ' + req.params.jobId);
  UserJobRepository.delete(req.params.jobId, (err, data) => {
    if (err) {
      debug('Delete User job :', err);
      req.flash('error', err);
    }

    res.redirect('/app/vending/job');
    // res.send('deleted');
  });

}); */

module.exports = router;
