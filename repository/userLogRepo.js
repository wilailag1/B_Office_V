const debug = require('debug')('cloudvdm:repo:user-log');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const sqlQuery = require('sql-query').Query();

const NOOP = (err, data) => { };

class UserLogRepo {

  findAll(limit = 0, callback) {
    const select = sqlQuery.select()
      .from(UserLogRepo.TABLE_NAME)
      .order('when', 'Z');

    if (limit > 0) {
      select.limit(limit);
    }

    const sql = select.build();

    db.query(sql, (err, rows) => {
      rows = rows || [];

      callback(err, rows.map(row => fromDbObject(row)));
    });
  }

  findAllByUserId(userId, callback) {
    const sql = sqlQuery.select()
      .from(UserLogRepo.TABLE_NAME)
      .where({
        [UserLogRepo.FK_NAME]: userId,
      })
      .order(UserLogRepo.PK_NAME)
      .build();

    // debug('findAllByUserId SQL :', sql);
    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  insertLog(userId, ipAddress, event, dataJson, callback = NOOP) {

    try {
      dataJson = JSON.stringify(dataJson);
    } catch (e) {
      dataJson = '{}';
    }

    const log = {
      when: null,
      userId,
      ipAddress,
      event,
      dataJson,
    };

    const sql = sqlQuery.insert()
      .into(UserLogRepo.TABLE_NAME)
      .set(toDbObject(log))
      .build();

    // debug('InsertLog SQL :', sql);
    db.query(sql, (error, rows) => {
      callback(error, rows);
    });
  }
}

UserLogRepo.TABLE_NAME = 'user_log';
UserLogRepo.PK_NAME = 'when';
UserLogRepo.FK_NAME = 'user_id';
UserLogRepo.FIELD_LIST = Object.freeze([
  'when', 'user_id', 'ip_address', 'event', 'data_json',
]);

exports.UserLogRepo = UserLogRepo;
