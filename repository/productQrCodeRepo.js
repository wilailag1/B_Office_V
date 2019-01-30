const debug = require('debug')('cloudvdm:repo:product-qrcode');
const _ = require('lodash');
const SQL = require('sql-query');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const sqlQuery = SQL.Query();

class ProductQrcodeRepository {

  findAll(callback) {
    const sql = sqlQuery.select()
      .from(ProductQrcodeRepository.TABLE_NAME)
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findById(qrId, callback) {
    const sql = sqlQuery.select()
      .from(ProductQrcodeRepository.TABLE_NAME)
      .where({
        [ProductQrcodeRepository.PK_NAME]: qrId
      })
      .build();

    db.query(sql, (error, rows) => {
      let productQrcode = void 0;
      if (rows && rows.length) {
        productQrcode = rows[0];
      }
      callback(error, fromDbObject(productQrcode));
    });
  }

  findByCode(qrCode, callback) {
    const sql = sqlQuery.select()
      .from(ProductQrcodeRepository.TABLE_NAME)
      .where({
        qr_code: qrCode,
        status: SQL.ne('USED'),
        use_at: null,
      })
      .order('create_at')
      .limit(1)
      .build();

    db.query(sql, (error, rows) => {
      let productQrcode = void 0;
      if (rows && rows.length) {
        productQrcode = rows[0];
      }
      callback(error, fromDbObject(productQrcode));
    });
  }

  insert(productQrcode, callback) {
    if (!productQrcode) {
      return callback(new Error('Invalid product'));
    }

    if (productQrcode.qrId) {
      productQrcode.qrId = null;
    }

    const sql = sqlQuery.insert()
      .into(ProductQrcodeRepository.TABLE_NAME)
      .set(toDbObject(productQrcode, ProductQrcodeRepository.FIELD_LIST))
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  update(productQrcode, callback) {
    if ((productQrcode.status || '').toUpperCase() == 'USED') {
      productQrcode.useAt = new Date();
    } else {
      productQrcode.useAt = null;
    }

    const sql = sqlQuery.update()
      .into(ProductQrcodeRepository.TABLE_NAME)
      .set(toDbObject(
        productQrcode, ProductQrcodeRepository.FIELD_LIST,
        [ProductQrcodeRepository.PK_NAME]
      ))
      .where({
        [ProductQrcodeRepository.PK_NAME]: productQrcode.qrId
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  delete(qrId, callback) {
    const sql = sqlQuery.remove()
      .from(ProductQrcodeRepository.TABLE_NAME)
      .where({
        [ProductQrcodeRepository.PK_NAME]: qrId
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }
}

ProductQrcodeRepository.TABLE_NAME = 'product_qrcode';
ProductQrcodeRepository.PK_NAME = 'qr_id';
ProductQrcodeRepository.FIELD_LIST = Object.freeze([
  'qr_id', 'product_id', 'qr_code', 'status', 'use_at', 'create_at', 'create_by',
]);

exports.ProductQrcodeRepository = ProductQrcodeRepository;
