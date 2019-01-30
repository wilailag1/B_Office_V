const debug = require('debug')('cloudvdm:repo:machine-device');
const _ = require('lodash');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

const NOOP = (err, data) => { };

class MachineDeviceRepository {

  findAll(callback = NOOP) {
    const sql = sqlQuery.select()
      .from(MachineDeviceRepository.TABLE_NAME)
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findById(deviceId, callback = NOOP) {
    const sql = sqlQuery.select()
      .from(MachineDeviceRepository.TABLE_NAME)
      .where({
        [MachineDeviceRepository.PK_NAME]: deviceId
      })
      .build();

    db.query(sql, (error, rows) => {
      let machineDev = void 0;
      if (rows && rows.length) {
        machineDev = rows[0];
      }
      callback(error, fromDbObject(machineDev));
    });
  }

  find({ deviceId, machineId, type, name, serial, status }, callback = NOOP) {
    const sql = sqlQuery.select()
      .from(MachineDeviceRepository.TABLE_NAME)
      .where(toDbObject({
        deviceId, machineId, type, name, serial, status,
      }))
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  insert(machineDev, callback = NOOP, conn = db) {
    if (!machineDev) {
      return callback(new Error('Invalid machine device'));
    }

    // machineDev.machineId = Generator.generateId();

    const sql = sqlQuery.insert()
      .into(MachineDeviceRepository.TABLE_NAME)
      .set(toDbObject(machineDev, MachineDeviceRepository.FIELD_LIST))
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  update(machineDev, callback = NOOP, conn = db) {
    const sql = sqlQuery.update()
      .into(MachineDeviceRepository.TABLE_NAME)
      .set(toDbObject(
        machineDev, MachineDeviceRepository.FIELD_LIST,
        [MachineDeviceRepository.PK_NAME]
      ))
      .where({
        [MachineDeviceRepository.PK_NAME]: machineDev.deviceId
      })
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  delete(deviceId, callback = NOOP) {
    const sql = sqlQuery.remove()
      .from(MachineDeviceRepository.TABLE_NAME)
      .where({
        [MachineDeviceRepository.PK_NAME]: deviceId
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

}

MachineDeviceRepository.TABLE_NAME = 'machine_devices';
MachineDeviceRepository.PK_NAME = 'device_id';
MachineDeviceRepository.FK_NAME = 'machine_id';
MachineDeviceRepository.FIELD_LIST = Object.freeze([
  'device_id', 'machine_id', 'type', 'name', 'serial',
  'version', 'data', 'status',
]);

exports.MachineDeviceRepository = MachineDeviceRepository;
