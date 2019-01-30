const debug = require('debug')('cloudvdm:test');
const express = require('express');
const router = express.Router();
const { User, MachineRepository } = require('../repository');

router.get('/user/insert', (req, res) => {
  User.insertUser({
    userId: 'test',
    roleId: 0,
    password: 'test',
    fullName: 'Hello test',
    createAt: new Date(),
    createBy: 'test',
  }, (err, result) => {
    debug('insert user');
    debug('Error ?:', err);
    debug('Result :', result);
    /*
    OkPacket {
      fieldCount: 0,
      affectedRows: 1,
      insertId: 0,
      serverStatus: 2,
      warningCount: 0,
      message: '',
      protocol41: true,
      changedRows: 0
    }
    */

    res.send('inserted');
  });
});

router.get('/user/update', (req, res) => {
  User.updateUser({
    userId: 'test',
    password: '1234',
  }, (err, result) => {
    debug('insert user');
    debug('Error ?:', err);
    debug('Result :', result);
    /*
    OkPacket {
      fieldCount: 0,
      affectedRows: 1,
      insertId: 0,
      serverStatus: 2,
      warningCount: 0,
      message: '(Rows matched: 1  Changed: 1  Warnings: 0',
      protocol41: true,
      changedRows: 1
    }
    */
    res.send('updated');
  });
});

router.get('/machine/select', (req, res) => {
  MachineRepository.find({ name: 'test' }, (err, result) => {
    res.send(result);
  });
});

module.exports = router;
