const express = require('express');
const router = express.Router({ mergeParams: true });

const userRoutes = require('./user');
const roleRoutes = require('./role');

router.use('/user', userRoutes);
router.use('/role', roleRoutes);

module.exports = router;
