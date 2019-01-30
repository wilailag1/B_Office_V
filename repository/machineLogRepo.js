const debug = require('debug')('cloudvdm:repo:machine-log');
const _ = require('lodash');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

const NOOP = (err, data) => { };

class MachineLogRepository {

  findByMachineId(machineId, callback) {
    const sql = sqlQuery.select()
      .from(MachineLogRepository.TABLE_NAME)
      .where({
        [MachineLogRepository.machineId]: machineId,
      })
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  insertMachineLog(machineData, callback = NOOP) {
    if (!machineData || !machineData.machineId) {
      return callback(new Error('Invalid machine data'));
    }

    machineData.when = new Date();

    if (machineData.data) {
      machineData.dataJson = machineData.data;
    }

    const sql = sqlQuery.insert()
      .into(MachineLogRepository.TABLE_NAME)
      .set(toDbObject(machineData, MachineLogRepository.FIELD_LIST))
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  findLatestLog({ limit } = { limit: 10 }, callback) {

    const params = [];

    let sql = `select 
      \`when\`, l.machine_id, name, event, data_json
      from machine_log l
      join machines m on (m.machine_id = l.machine_id)
      order by \`when\` desc `;

    if (limit && limit > 0) {
      sql += ' limit ? ';
      params.push(limit);
    }

    db.query(sql, [limit], (error, rows) => {
      rows = rows || [];
      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

}

MachineLogRepository.TABLE_NAME = 'machine_log';
MachineLogRepository.PK_NAME = 'machine_id';
MachineLogRepository.FIELD_LIST = [
  'when', 'machine_id', 'event', 'data_json',
  'temperature', 'cpu_percent', 'mem_percent',
  'network_signal',
];

exports.MachineLogRepository = MachineLogRepository;
