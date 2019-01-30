const debug = require('debug')('cloudvdm:repo:machineCoinStat');
const _ = require('lodash');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();
const sqlSelect = sqlQuery.select();
const sqlInsert = sqlQuery.insert();
const sqlUpdate = sqlQuery.update();
const sqlDelete = sqlQuery.remove();

const NOOP = () => { };

class MachineCoinStatRepository {

  findByMachineId(machineId, callback) {
    const sql = sqlSelect
      .from(MachineCoinStatRepository.TABLE_NAME)
      .where({
        [MachineCoinStatRepository.FK_NAME]: machineId,
      })
      .order(MachineCoinStatRepository.PK_NAME, 'Z')
      .limit(1)
      .build();

    db.query(sql, (error, rows) => {
      let result = null;

      if (rows.length) {
        result = fromDbObject(rows[0]);
      }

      callback(error, result);
    });
  }

  insert(machineCoinStat, callback = NOOP, conn = db) {

    if (!machineCoinStat) {
      const err = 'Error invalid machine data';

      debug('Before insert Machine coin stat error :', err);
      return callback(err);
    }

    machineCoinStat.stamp = new Date();

    const sql = sqlInsert
      .into(MachineCoinStatRepository.TABLE_NAME)
      .set(toDbObject(machineCoinStat, MachineCoinStatRepository.FIELD_LIST))
      .build();

    conn.query(sql, (err, result) => {
      if (err) {
        debug('Insert Machine coin stat error :', err);
      }

      return callback(err, result);
    });
  }

}

MachineCoinStatRepository.TABLE_NAME = 'machine_coin_stat';
MachineCoinStatRepository.PK_NAME = 'stamp';
MachineCoinStatRepository.FK_NAME = 'machine_id';
MachineCoinStatRepository.FIELD_LIST = [
  'stamp', 'machine_id', 'status', 'coin_remain_1',
  'coin_remain_2', 'coin_remain_5', 'coin_remain_10',
  'coin_remain_20', 'coin_remain_50', 'coin_remain_100',
  'coin_remain_total',
];

exports.MachineCoinStatRepository = MachineCoinStatRepository;
