const debug = require('debug')('cloudvdm:repo:machine');
const _ = require('lodash');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

const NOOP = (err, data) => { };

class MachineRepository {

  findAll(callback) {
    const sql = sqlQuery.select()
      .from(MachineRepository.TABLE_NAME)
      .where(toDbObject({
        isDeleted: false,
      }))
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];
      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findById(machineId, callback) {
    const sql = sqlQuery.select()
      .from(MachineRepository.TABLE_NAME)
      .where(toDbObject({
        [MachineRepository.PK_NAME]: machineId,
        isDeleted: false,
      }))
      .build();

    db.query(sql, (error, rows) => {
      let machine = void 0;
      if (rows && rows.length) {
        machine = rows[0];
      }
      callback(error, fromDbObject(machine));
    });
  }

  find({ name, status, isAlarm, serial }, callback) {
    const sql = sqlQuery.select()
      .from(MachineRepository.TABLE_NAME)
      .where(toDbObject({
        name,
        status,
        isAlarm,
        serial,
        isDeleted: false,
      }))
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  first(callback) {
    const sql = sqlQuery.select()
      .from(MachineRepository.TABLE_NAME)
      .where(toDbObject({
        isDeleted: false,
      }))
      .limit(1)
      .build();

    db.query(sql, (error, rows) => {
      let machine = void 0;
      if (rows && rows.length) {
        machine = rows[0];
      }
      callback(error, fromDbObject(machine));
    });
  }

  insertMachine(machine, callback = NOOP) {
    if (!machine) {
      return callback(new Error('Invalid machine'));
    }

    machine.machineId = Generator.generateId();

    const sql = sqlQuery.insert()
      .into(MachineRepository.TABLE_NAME)
      .set(toDbObject(machine, MachineRepository.FIELD_LIST))
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  updateMachine(machine, callback = NOOP) {
    machine.lastUpdate = new Date();

    const sql = sqlQuery.update()
      .into(MachineRepository.TABLE_NAME)
      .set(toDbObject(
        machine, MachineRepository.FIELD_LIST,
        [MachineRepository.PK_NAME]
      ))
      .where({
        [MachineRepository.PK_NAME]: machine.machineId
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  deleteMachine(machineId, callback = NOOP) {
    /* const sql = sqlQuery.remove()
      .from(MachineRepository.TABLE_NAME)
      .where({
        [MachineRepository.PK_NAME]: machineId
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    }); */

    // Use update `is_deleted` instead.
    this.updateMachine({
      machineId,
      isDeleted: true,
    }, callback);
  }

}

MachineRepository.TABLE_NAME = 'machines';
MachineRepository.PK_NAME = 'machine_id';
MachineRepository.FIELD_LIST = Object.freeze([
  'machine_id', 'name', 'status', 'last_update', 'is_alarm', 'serial',
  'description', 'location', 'geo_location', 'staff_name', 'ip_address',
  'temperature', 'cpu_percent', 'mem_percent', 'network_signal', 'is_deleted',
]);

exports.MachineRepository = MachineRepository;
