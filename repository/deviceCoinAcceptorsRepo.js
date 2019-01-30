const debug = require('debug')('cloudvdm:repo:device-coin-acceptors');
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

const NOOP = (err, data) => { };

class DeviceCoinAcceptorsRepository {

  findByDeviceId(deviceId, callback) {
    const sql = sqlSelect
      .from(DeviceCoinAcceptorsRepository.TABLE_NAME)
      .where({
        [DeviceCoinAcceptorsRepository.PK_NAME]: deviceId,
      })
      .build();

    db.query(sql, (error, rows) => {
      let result = null;

      if (rows.length) {
        result = fromDbObject(rows[0]);
      }

      callback(error, result);
    });
  }

  insert(dcaData, callback = NOOP, conn = db) {
    if (!dcaData) {
      return callback('Invalid data');
    }

    if (!dcaData.deviceId) {
      return callback('Device ID is required!');
    }

    const sql = sqlInsert
      .into(DeviceCoinAcceptorsRepository.PK_NAME)
      .set(toDbObject(
        dcaData,
        DeviceCoinAcceptorsRepository.FIELD_LIST
      ))
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  update(dcaData, callback = NOOP, conn = db) {
    if (!dcaData) {
      return callback('Invalid data');
    }

    if (!dcaData.deviceId) {
      return callback('Device ID is required!');
    }

    const sql = sqlUpdate
      .into(DeviceCoinAcceptorsRepository.TABLE_NAME)
      .set(toDbObject(
        dcaData,
        DeviceCoinAcceptorsRepository.FIELD_LIST,
        DeviceCoinAcceptorsRepository.PK_NAME
      ))
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  upsertIncrease(dcaData, callback = NOOP, conn = db) {
    if (!dcaData) {
      return callback('Invalid data');
    }

    if (!dcaData.deviceId) {
      return callback('Device ID is required!');
    }

    if (!dcaData.updateAt) {
      dcaData.updateAt = new Date();
    }

    if (!dcaData.status) {
      dcaData.status = 'OK';
    }

    const {
      deviceId,
      updateAt,
      currentCoinCount,
      status,
    } = dcaData;

    const sql = `insert into device_coin_acceptors (device_id, update_at, current_coin_count, status) 
    values (?, ?, ?, ?) 
    on duplicate key update current_coin_count = current_coin_count + ?`;

    conn.query(sql, [
      deviceId,
      updateAt,
      currentCoinCount,
      status,
      currentCoinCount
    ], (error, result) => {
      callback(error, result);
    });
  }

}

DeviceCoinAcceptorsRepository.TABLE_NAME = 'device_coin_acceptors';
DeviceCoinAcceptorsRepository.PK_NAME = 'device_id';
DeviceCoinAcceptorsRepository.FIELD_LIST = [
  'device_id', 'update_at', 'current_coin_count', 'status',
];

exports.DeviceCoinAcceptorsRepository = DeviceCoinAcceptorsRepository;
