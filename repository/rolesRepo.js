const debug = require('debug')('cloudvdm:repo:roles');
const _ = require('lodash');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

class RolesRepository {

  static _stringifyRoleData(role) {
    let { rolePermissionJson } = role;
    rolePermissionJson = _.pick(rolePermissionJson, [
      'admin',
      'vending',
      'product',
      'saleReport',
      'logs',
    ]);

    for (const a in rolePermissionJson) {
      rolePermissionJson[a] = !!rolePermissionJson[a];
    }

    role.rolePermissionJson = JSON.stringify(rolePermissionJson);
    return role;
  }

  static _parseRoleData(role) {
    try {
      role.rolePermissionJson = JSON.parse(role.rolePermissionJson);
    } catch (e) {
      role.rolePermissionJson = {};
    }
    return role;
  }

  findAll(callback) {
    const sql = sqlQuery.select()
      .from(RolesRepository.TABLE_NAME)
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => RolesRepository._parseRoleData(fromDbObject(row))));
    });
  }

  find(roleId, callback) {
    const sql = sqlQuery.select()
      .from(RolesRepository.TABLE_NAME)
      .where({
        [RolesRepository.PK_NAME]: roleId
      })
      .build();

    db.query(sql, (error, rows) => {
      let role = null;
      if (rows && rows.length) {
        role = RolesRepository._parseRoleData(fromDbObject(rows[0]));
      }

      callback(error, role);
    });
  }

  insertRole(roleName, rolePermissionJson, callback) {
    const role = {
      roleId: null,
      roleName,
      rolePermissionJson
    };

    RolesRepository._stringifyRoleData(role);

    const sql = sqlQuery.insert()
      .into(RolesRepository.TABLE_NAME)
      .set(toDbObject(role))
      .build();

    db.query(sql, (error, rows) => {
      callback(error, rows);
    });
  }

  updateRole(roleId, roleName, rolePermissionJson, callback) {
    const role = {
      // roleId,
      roleName,
      rolePermissionJson,
    };

    RolesRepository._stringifyRoleData(role);

    const sql = sqlQuery.update()
      .into(RolesRepository.TABLE_NAME)
      .set(toDbObject(role))
      .where({
        [RolesRepository.PK_NAME]: roleId
      })
      .build();

    db.query(sql, (error, rows) => {
      callback(error, rows);
    });
  }

  deleteRole(roleId, callback) {
    const sql = sqlQuery.remove()
      .from(RolesRepository.TABLE_NAME)
      .where({
        [RolesRepository.PK_NAME]: roleId,
      })
      .build();

    db.query(sql, (error, rows) => {
      callback(error, rows);
    });
  }

}

RolesRepository.TABLE_NAME = 'roles';
RolesRepository.PK_NAME = 'role_id';
RolesRepository.FIELD_LIST = Object.freeze([
  'role_id', 'role_name', 'role_permission_json',
]);

exports.RolesRepository = RolesRepository;
