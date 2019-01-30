const debug = require('debug')('cloudvdm:repo:coin-acceptor-history');
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

class CoinAcceptorHistoryRepository {

  findByDeviceId(deviceId, callback) {
    const sql = sqlSelect
      .from(CoinAcceptorHistoryRepository.TABLE_NAME)
      .where({
        [CoinAcceptorHistoryRepository.PK_NAME]: deviceId
      })
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];
      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  insert(coinAcceptorHistory, callback) {
    if (!coinAcceptorHistory) {
      return callback('Invalid data');
    } else if (!coinAcceptorHistory.deviceId) {
      return callback('Device ID is required!');
    }

    coinAcceptorHistory.when = new Date();

    const sql = sqlInsert
      .into(CoinAcceptorHistoryRepository.TABLE_NAME)
      .set(toDbObject(
        coinAcceptorHistory,
        CoinAcceptorHistoryRepository.FIELD_LIST
      ))
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

}

CoinAcceptorHistoryRepository.TABLE_NAME = 'coin_acceptor_history';
CoinAcceptorHistoryRepository.PK_NAME = 'when';
CoinAcceptorHistoryRepository.FIELD_LIST = [
  'when', 'device_id', 'coin_receive', 'coin_change',
  'is_success',
];
CoinAcceptorHistoryRepository.FK_NAME = 'device_id';

exports.CoinAcceptorHistoryRepository = CoinAcceptorHistoryRepository;
