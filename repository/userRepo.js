const debug = require('debug')('cloudvdm:repo:user');
const Generator = require('../util/generator');
const sqlQuery = require('sql-query').Query();
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const roleRepo = require('./rolesRepo').RolesRepository;

class UserRepository {

  // TODO: Paging search

  findAll({ name }, callback) {
    const sql = sqlQuery.select()
      .from(UserRepository.TABLE_NAME)
      .build();

    db.query(sql, (error, rows) => {
      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findUserPassword(username, password, callback) {
    const sql = 'select * from users where user_id = ? and password = ? limit 1';

    db.query(sql,
      [username, password],
      (error, rows, fields) => {

        const result = rows && rows[0];
        // console.log('findUserPassword :', roleRepo);
        callback(error, fromDbObject(result));
      }
    );
  }

  findUsername(username, callback) {
    /* const sql = sqlQuery.select()
      .from(UserRepository.TABLE_NAME)
      .select(
        UserRepository.USER_FIELDS
          .filter(field => UserRepository.SELECT_IGNORE_FIELDS.indexOf(field) == -1)
      )
      .where({
        [UserRepository.PK_NAME]: username,
      })
      .limit(1)
      .build(); */

    const sql = `select user_id, u.role_id, full_name, create_at, create_by, update_at,
    update_by, last_login, last_login_ip, phone, role_name, role_permission_json
    from users u
    left join roles r on u.role_id = r.role_id
    where user_id = ? limit 1`;

    db.query(sql,
      [username],
      (error, rows, fields) => {

        const result = rows && rows[0];
        callback(error, roleRepo._parseRoleData(fromDbObject(result)));
      }
    );
  }

  insertUser(user, callback) {
    if (!user) {
      return callback(new Error('Invalid User'));
    }

    user.roleId = Number(user.roleId);

    const sql = sqlQuery.insert()
      .into(UserRepository.TABLE_NAME)
      .set(toDbObject(user, UserRepository.USER_FIELDS))
      .build();

    debug('Insert sql :', sql);
    db.query(sql, (error, rows) => {
      // debug('Insert result :', rows);
      callback(error, rows);
    });
  }

  updateUser(user, callback) {
    // user.updateAt = new Date();

    const updateData = toDbObject(
      user, UserRepository.USER_FIELDS, UserRepository.UPDATE_IGNORE_FIELDS
    );

    if (!updateData.password) {
      delete updateData.password;
    }

    user.roleId = Number(user.roleId);

    debug('Updating user with :', updateData);

    const sql = sqlQuery.update()
      .into(UserRepository.TABLE_NAME)
      .set(updateData)
      .where({
        [UserRepository.PK_NAME]: user.userId,
      })
      .build();

    debug('Update sql :', sql);
    db.query(sql, (error, rows) => {
      debug('Update result :', rows);
      callback(error, rows);
    });
  }

  delete(userId, callback) {
    const sql = sqlQuery.remove()
      .from(UserRepository.TABLE_NAME)
      .where({
        [UserRepository.PK_NAME]: userId
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

}


UserRepository.TABLE_NAME = 'users';

UserRepository.PK_NAME = 'user_id';

UserRepository.USER_FIELDS = Object.freeze([
  'user_id', 'role_id', 'password', 'full_name', 'create_at', 'create_by',
  'update_at', 'update_by', 'last_login', 'last_login_ip', 'phone',
]);

UserRepository.SELECT_IGNORE_FIELDS = Object.freeze([
  'password',
]);

UserRepository.UPDATE_IGNORE_FIELDS = Object.freeze([
  'user_id', 'create_at', 'create_by', 'last_login', 'last_login_ip',
]);

exports.UserRepository = UserRepository;
