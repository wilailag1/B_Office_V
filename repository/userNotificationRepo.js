const debug = require('debug')('cloudvdm:repo:user-notification');
const _ = require('lodash');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

class UserNotificationRepo {

  findAllByUserId(userId, callback) {
    const sql = sqlQuery.select()
      .from(UserNotificationRepo.TABLE_NAME)
      .where({
        [UserNotificationRepo.FK_NAME]: userId,
        when_read: SQL.lte(new Date()),
      })
      .order('when_read', 'Z')
      .build();

    debug('findByUserId SQL :', sql);

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  insertNotification(
    userId, notificationType, message, dataJson, whenShow = new Date(),
    callback
  ) {
    const notification = {
      id: null, // AutoIncrease
      userId,
      notificationType,
      message,
      dataJson,
      whenShow,
    };

    const sql = sqlQuery.insert()
      .into(UserNotificationRepo.TABLE_NAME)
      .set(toDbObject(notification))
      .build();

    debug('Insert notitication SQL :', sql);
    db.query(sql, (error, rows) => {

      callback(error, rows);
    });
  }

  markAsRead(id, userId, callback) {
    const sql = sqlQuery.update()
      .into(UserNotificationRepo.TABLE_NAME)
      .set({
        is_read: true,
      })
      .where(toDbObject({
        id,
        userId,
        whenRead: new Date()
      }))
      .build();

    debug('Update sql :', sql);
    db.query(sql, (error, rows) => {
      debug('Update result :', rows);
      callback(error, rows);
    });
  }

}

UserNotificationRepo.TABLE_NAME = 'user_notification';
UserNotificationRepo.PK_NAME = 'id';
UserNotificationRepo.FK_NAME = 'user_id';
UserNotificationRepo.FIELD_LIST = Object.freeze([
  'id', 'user_id', 'notification_type', 'when_show', 'when_read', 'message',
  'data_json', 'is_read',
]);

exports.UserNotificationRepo = UserNotificationRepo;
