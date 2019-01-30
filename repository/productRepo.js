const debug = require('debug')('cloudvdm:repo:product');
const _ = require('lodash');
const SQL = require('sql-query');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const sqlQuery = SQL.Query();

const NOOP = (err, result) => { };

class ProductRepository {

  findAll(callback) {
    const sql = sqlQuery.select()
      .from(ProductRepository.TABLE_NAME)
      .where(toDbObject({
        isDeleted: false,
      }))
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findById(productId, callback) {
    const sql = sqlQuery.select()
      .from(ProductRepository.TABLE_NAME)
      .where({
        [ProductRepository.PK_NAME]: productId,
        is_deleted: false,
      })
      .build();

    db.query(sql, (error, rows) => {
      let product = void 0;
      if (rows && rows.length) {
        product = rows[0];
      }
      callback(error, fromDbObject(product));
    });
  }
  ///findbymachineid
  findProductBymachineId(machineid, callback) {
    const sql = sqlQuery.select()
      .from(ProductRepository.TABLE_NAME)
      .where({
        [ProductRepository.machine_id]: machineid,
        is_deleted: false,
      })
      .build();

    db.query(sql, (error, rows) => {
      let product = void 0;
      if (rows && rows.length) {
        product = rows[0];
      }
      callback(error, fromDbObject(product));
    });
  }

  ///findbymachineid


  // So wrong
  findAllByNameWithStocked(name, callback) {
    const sql = sqlQuery.select()
      .from(ProductRepository.TABLE_NAME)
      .where(toDbObject({
        name,
        stock: SQL.gt(0),
      }))
      .build();
    // console.log('findAllByNameWithStocked SQL :', sql);
    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findChannel(channel, callback) {
    const sql = sqlQuery.select()
      .from(ProductRepository.TABLE_NAME)
      .select('channel')
      .where(toDbObject({
        channel,
        isDeleted: false,
      }))
      .build();

    db.query(sql, (err, rows) => {
      if (err) {
        debug('Find channel Error :', err);
      }

      callback(err, rows.length);
    });
  }

  findChannelExceptProductId(channel, productId, callback) {
    const sql = sqlQuery.select()
      .from(ProductRepository.TABLE_NAME)
      .select('channel')
      .where(toDbObject({
        channel,
        productId: SQL.ne(productId),
        isDeleted: false,
      }))
      .build();

    db.query(sql, (err, rows) => {
      if (err) {
        debug('Find channel Error :', err);
      }

      callback(err, rows.length);
    });
  }

  insert(product, callback = NOOP, conn = db) {
    if (!product) {
      return callback(new Error('Invalid product'));
    }

    product.productId = Generator.generateProductId();

    const sql = sqlQuery.insert()
      .into(ProductRepository.TABLE_NAME)
      .set(toDbObject(product, ProductRepository.FIELD_LIST))
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  update(product, callback = NOOP, conn = db) {
    const sql = sqlQuery.update()
      .into(ProductRepository.TABLE_NAME)
      .set(toDbObject(
        product, ProductRepository.FIELD_LIST,
        [ProductRepository.PK_NAME]
      ))
      .where({
        [ProductRepository.PK_NAME]: product.productId,
        is_deleted: false,
      })
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  updateStock(productId, stock, callback = NOOP, conn = db) {
    this.update({
      productId,
      stock,
    }, callback, conn);
  }

  addStock(productId, stock, callback = NOOP, conn = db) {
    conn.query(
      `update ${ProductRepository.TABLE_NAME} set stock = stock + ?
      where product_id = ? and is_deleted = false`,
      [stock, productId],
      (err, result) => {
        callback(err, result);
      });
  }

  decreaseStock(productId, stock, callback = NOOP, conn = db) {
    conn.query(
      `update ${ProductRepository.TABLE_NAME} set stock = stock - ?
      where product_id = ? and is_deleted = false`,
      [stock, productId],
      (err, result) => {
        callback(err, result);
      });
  }

  delete(productId, callback = NOOP) {
    const sql = sqlQuery.remove()
      .from(ProductRepository.TABLE_NAME)
      .where({
        [ProductRepository.PK_NAME]: productId,
        is_deleted: false,
      })
      .build();

    db.query(sql, (error, result) => {
      callback(error, result);
    });
  }
}

ProductRepository.TABLE_NAME = 'products';
ProductRepository.PK_NAME = 'product_id';
//// เพิ่ม 'machine_id'
ProductRepository.machine_id='machine_id';
//// เพิ่ม 'machine_id'
ProductRepository.FIELD_LIST = Object.freeze([
  'product_id', 'name', 'price', 'group', 'create_at', 'create_by',
  'update_at', 'update_by', 'image', 'stock', 'channel', 'label', 'chrow', 'chcolumn',
  'is_deleted','machine_id', 
]);
/// เพิ่ม 'machine_id'

exports.ProductRepository = ProductRepository;
