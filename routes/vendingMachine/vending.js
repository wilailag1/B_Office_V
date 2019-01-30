const debug = require('debug')('cloudvdm:route:vending-machine/vending');
const express = require('express');
const router = express.Router({ mergeParams: true });
const jobRoutes = require('./job');
const waterfall = require('async/waterfall');

const {
  MachineRepository: machineRepo,
  UserLogRepo,
} = require('../../repository');
const generator = require('../../util/generator');
const networkUtil = require('../../util/network');

// debug('test :', numeral(1235).format('$ 0,0[.]00'));

router.use('/job', jobRoutes);

router.get('/add', (req, res) => {
  res.locals.title = 'Add Machine - Machine Management';
  res.locals.headTitle = 'Setup new Machine';

  const [machineData] = req.flash('machine');
  // const [messagePopup] = req.flash('messagePopup');
  // debug('Last error :', lastError);
  // debug('machineData:', machineData);
  res.render('app/vending/add', {
    isEdit: false,
    // messagePopup,
    machineData: machineData || {},
  });
});

router.post('/add', (req, res) => {

  const machineId = generator.generateId();
  const { name, description, location, geoLocation } = req.body;

  machineRepo.insertMachine({
    machineId, // PK
    name,
    description,
    location,
    geoLocation,
    status: 'SETUP',
  }, (error, result) => {
    // debug('Insert result :', result);
    if (error) {
      debug('Error insert machine :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('machine', {
        name, description, location, geoLocation
      });
      return res.redirect(req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Added new Machine',
      message: `Machine ID : <b>${machineId}</b><br />` +
        'Use this ID to complete setting up a new Machine.',
    });
    res.redirect('/app/vending/list');
    // res.redirect(req.header('referer'));

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'ADD_MACHINE',
      { machineId, name }
    );
  });
});

router.get('/edit/:machineId', (req, res) => {
  const { machineId } = req.params;

  machineRepo.findById(machineId, (error, result) => {

    if (error) {
      debug('Load Machine error :', error);

      return res.redirect('./list');
    }

    if (!result) {
      return res.redirect('../list');
    }

    // debug('Loaded Machine :', result);

    const machineData = result;
    // const [messagePopup] = req.flash('messagePopup');
    res.render('app/vending/add', {
      headTitle: `Edit Machine ${machineData.name}`,
      isEdit: true,
      // messagePopup,
      machineData: machineData || {},
    });
  });
});

router.post('/edit/:machineId', (req, res) => {

  const { machineId } = req.params;
  const { name, description, location, geoLocation } = req.body;

  machineRepo.updateMachine({
    machineId, // PK
    name,
    description,
    location,
    geoLocation,
  }, (error, result) => {
    // debug('Insert result :', result);
    if (error) {
      debug('Error update machine :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('machine', {
        name, description, location, geoLocation
      });
      return res.redirect(req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Saved Machine',
    });
    // res.redirect('/app/vending/list');
    res.redirect('./list');

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'EDIT_MACHINE',
      { machineId, name }
    );
  });
});

router.get('/list', (req, res) => {
  let vmData = {};
  let lastError = void 0;

  machineRepo.findAll((error, rows) => {
    if (error) {
      // res.locals.lastError = error;
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      debug('Error findAll :', error);
    }

    vmData.rows = rows;

    res.render('app/vending/list', {
      vmData,
    });
  });
});

router.all('/delete/:machineId', (req, res) => {
  const { machineId } = req.params;

  let lastError = void 0;

  waterfall([
    /** load machine */
    (callback) => {
      machineRepo.findById(machineId, (err, machineData) => {
        callback(err, machineData);
      });
    },

    /** Delete machine */
    (machineData, callback) => {
      if (!machineData) {
        debug(`Deleting ${machineId}, But found nothing.  Skip..`);
        // req.flash('error', 'Found no machine to delete');
        return callback(null);
      } else if (['SETUP', 'OFFLINE']
        .indexOf((machineData.status || '')
          .toUpperCase()) > -1) {
        machineRepo.deleteMachine(machineId, (err, result) => {
          if (err) {
            lastError = err;
            debug('Error delete machine :', err);
            req.flash('messagePopup', {
              title: 'Something went wrong. Please try again or contact Adminstrator.',
              type: 'error',
            });
          }

          UserLogRepo.insertLog(
            req.user.userId,
            networkUtil.getClientRemote(req),
            'DEL_MACHINE',
            { machineId, name: machineData.name }
          );

          return callback(lastError);
        });
        return; // Don't go out
      } else {
        debug("Can't delete machine that in operation, Shutdown machine before remove");
        req.flash('messagePopup', {
          title: 'You must shutdown Machine before get removed',
          type: 'error',
        });
      }

      return callback(lastError);
    },
  ], (err, result) => {
    return res.redirect(req.header('Referer'));
  });
});

module.exports = router;
