const debug = require('debug')('cloudvdm:route:monitor/vending-machines');
const express = require('express');
const router = express.Router({ mergeParams: true });
const machineRepo = require('../../repository').MachineRepository;

router.get('/', (req, res) => {
  res.locals.title = 'Vending Machines Status - Monitor';

  // Mock data
  /* const vmData = {
    rows: [
      {
        name: 'Vending1',
        location: 'Siam Paragon',
        serial: 'VMCENSP01',
        ipAddress: '987.654.321.0',
        isAlert: false,
        temperature: 42,
        cpuPercent: 5,
        memPercent: 20,
        networkSignal: 'GOOD',
        status: 'Online',
      },
      {
        name: 'Vending2',
        location: 'Terminal 21',
        serial: 'VMCENTERM21',
        ipAddress: '345.678.901.234',
        isAlert: true,
        temperature: 99,
        cpuPercent: 100,
        memPercent: 98,
        networkSignal: 'GOOD',
        status: 'Online',
      },
      {
        name: 'Vending3',
        location: 'MEGA Bangna',
        serial: 'VMEASTMEGABN',
        ipAddress: '683.185.302.647',
        isAlert: false,
        temperature: null,
        cpuPercent: null,
        memPercent: null,
        networkSignal: null,
        status: 'Offline',
      },
      {
        name: 'Vending4',
        location: 'Mars',
        serial: 'VMMARS0242315',
        ipAddress: '626.352.352.234',
        isAlert: true,
        temperature: -80,
        cpuPercent: 1,
        memPercent: 10,
        networkSignal: 'BAD',
        status: 'Reconnecting',
      },
    ]
  }; */

  let vmData = {};
  let lastError = void 0;

  machineRepo.findAll((error, rows) => {
    if (error) {
      res.locals.lastError = error;
    }

    vmData.rows = rows;
    res.render('app/monitor/vendingMachines', {
      vmData,
    });
  });

  // res.locals.vmData = vmData;
});

module.exports = router;
