const express = require('express');
const router = express.Router({ mergeParams: true });

// const systemMonitorRoutes = require('./system');
const vendingMachinesMonitorRoutes = require('./vendingMachines');
const vendingMachineLogRoutes = require('./machineLog');
const saleRoutes = require('./sale');
const userRoutes = require('./user');

// router.use('/system', systemMonitorRoutes);
router.use('/vending', vendingMachinesMonitorRoutes);
router.use('/vending-log', vendingMachineLogRoutes);
router.use('/sale', saleRoutes);
router.use('/user', userRoutes);

module.exports = router;
