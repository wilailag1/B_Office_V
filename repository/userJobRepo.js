const debug = require('debug')('cloudvdm:repo:user-job');
const _ = require('lodash');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

const NOOP = (err, data) => { };

class UserJobRepository {

  findAll(callback) {
    const sql = sqlQuery.select()
      .from(UserJobRepository.TABLE_NAME)
      .build();

    db.query(sql, (error, rows) => {
      if (error) {
        debug('Error find all :', error);
      }
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findById(jobId, callback) {
    const sql = `select 
    job_id,
    create_at,
    create_by,
    add_coin_1,
    add_coin_2,
    add_coin_5,
    add_coin_10,
    add_coin_20,
    add_coin_50,
    add_coin_100,
    add_product_json,
    uj.status,
    job_type,
    uj.machine_id,
    m.name as machine_name,
    comment,
    update_at,
    update_by
    from user_jobs uj
    left join machines m on uj.machine_id = m.machine_id
    where job_id = ?
    order by create_at desc
    limit 1 `;

    db.query(sql, [jobId], (error, rows) => {
      if (error) {
        debug('Error find all :', error);
      }
      rows = rows || [];

      let result = void 0;

      if (rows.length > 0) {
        result = rows[0];
      }

      callback(error, fromDbObject(result));
    });
  }

  findActiveJobByMachineId(machineId, callback) {
    const sql = `select 
    job_id,
    create_at,
    create_by,
    add_coin_1,
    add_coin_2,
    add_coin_5,
    add_coin_10,
    add_coin_20,
    add_coin_50,
    add_coin_100,
    add_product_json,
    uj.status,
    job_type,
    uj.machine_id,
    m.name as machine_name,
    comment,
    update_at,
    update_by
    from user_jobs uj
    left join machines m on uj.machine_id = m.machine_id
    where uj.machine_id = ? and uj.status = ?
    order by create_at desc
    limit 1`;

    db.query(sql, [machineId, 'active'], (error, rows) => {
      if (error) {
        debug('Error findActiveJobByMachineId :', error);
      }
      rows = rows || [];

      let result = void 0;

      if (rows.length > 0) {
        result = rows[0];
      }

      callback(error, fromDbObject(result));
    });
  }

  findAllWithMachine(callback) {
    const sql = `select 
    job_id,
    create_at,
    create_by,
    add_coin_1,
    add_coin_2,
    add_coin_5,
    add_coin_10,
    add_coin_20,
    add_coin_50,
    add_coin_100,
    add_product_json,
    uj.status,
    job_type,
    uj.machine_id,
    m.name as machine_name,
    comment,
    update_at,
    update_by
    from user_jobs uj
    left join machines m on uj.machine_id = m.machine_id
    order by create_at desc`;

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findActiveJobs(callback) {
    const sql = `select 
    job_id,
    create_at,
    create_by,
    add_coin_1,
    add_coin_2,
    add_coin_5,
    add_coin_10,
    add_coin_20,
    add_coin_50,
    add_coin_100,
    add_product_json,
    uj.status,
    job_type,
    uj.machine_id,
    m.name as machine_name,
    comment,
    update_at,
    update_by
    from user_jobs uj
    left join machines m on uj.machine_id = m.machine_id
    where uj.status = ?
    order by create_at desc`;

    db.query(sql, ['active'], (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  insert(userJobData, callback = NOOP, conn = db) {
    if (!userJobData) {
      debug('No User job data');
      return callback('No User job data !');
    }

    userJobData.jobId = null;

    userJobData.addCoin1 = userJobData.addCoin1 || 0;
    userJobData.addCoin2 = userJobData.addCoin2 || 0;
    userJobData.addCoin5 = userJobData.addCoin5 || 0;
    userJobData.addCoin10 = userJobData.addCoin10 || 0;
    userJobData.addCoin20 = userJobData.addCoin20 || 0;
    userJobData.addCoin50 = userJobData.addCoin50 || 0;
    userJobData.addCoin100 = userJobData.addCoin100 || 0;

    const sql = sqlQuery.insert()
      .into(UserJobRepository.TABLE_NAME)
      .set(toDbObject(userJobData, UserJobRepository.FIELD_LIST))
      .build();

    conn.query(sql, (err, result) => {
      if (err) {
        debug('Error insert :', err);
      }
      return callback(err, result);
    });
  }

  update(userJobData, callback = NOOP, conn = db) {
    if (!userJobData) {
      debug('No User job data');
      return callback('No User job data !');
    } else if (!userJobData.jobId) {
      debug('No user Job ID !');
      return callback('No user Job ID');
    }

    userJobData.updateAt = new Date();

    const sql = sqlQuery.update()
      .into(UserJobRepository.TABLE_NAME)
      .set(toDbObject(userJobData))
      .where({
        [UserJobRepository.PK_NAME]: userJobData.jobId,
      })
      .build();

    conn.query(sql, (error, rows) => {
      callback(error, rows);
    });
  }

  delete(jobId, callback = NOOP, conn = db) {
    const sql = sqlQuery.remove()
      .from(UserJobRepository.TABLE_NAME)
      .where({
        [UserJobRepository.PK_NAME]: jobId,
      })
      .build();

    conn.query(sql, (error, rows) => {
      callback(error, rows);
    });
  }
}

UserJobRepository.TABLE_NAME = 'user_jobs';
UserJobRepository.PK_NAME = 'job_id';
UserJobRepository.FK_NAME = 'machine_id';
UserJobRepository.FIELD_LIST = Object.freeze([
  'job_id', 'create_at', 'create_by', 'add_coin_1',
  'add_coin_2', 'add_coin_5', 'add_coin_10', 'add_coin_20',
  'add_coin_50', 'add_coin_100', 'add_product_json',
  'status', 'job_type', 'machine_id', 'comment', 'update_at', 'update_by',
]);

exports.UserJobRepository = UserJobRepository;
