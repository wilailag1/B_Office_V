const debug = require('debug')('cloudvdm:repo:orders');
const _ = require('lodash');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db, beginTransaction } = require('../db');
const SQL = require('sql-query');
const sqlQuery = SQL.Query();

const NOOP = (err, data) => { };

class OrderRepository {

  findAll(callback = NOOP) {
    const sql = sqlQuery.select()
      .from(OrderRepository.TABLE_NAME)
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findById(orderId, callback = NOOP) {
    const sql = sqlQuery.select()
      .from(OrderRepository.TABLE_NAME)
      .where({
        [OrderRepository.PK_NAME]: orderId
      })
      .build();

    db.query(sql, (error, rows) => {
      let order = void 0;
      if (rows && rows.length) {
        order = rows[0];
      }
      callback(error, fromDbObject(order));
    });
  }

  find({ orderId, machineId, productId, orderAt, paymentMethod, status }, callback = NOOP) {
    const sql = sqlQuery.select()
      .from(OrderRepository.TABLE_NAME)
      .where(toDbObject({
        orderId, machineId, productId, orderAt, paymentMethod, status
      }))
      .build();

    db.query(sql, (error, rows) => {
      rows = rows || [];

      callback(error, rows.map(row => fromDbObject(row)));
    });
  }

  findLatest({ limit } = { limit: 50 }, callback) {

    const params = [];

    let sql = `select order_id,
    o.machine_id,
    m.name as machine_name,
    o.product_id,
    p.name as product_name,
    order_at,
    payment_method,
    qr_code,
    qr_api_response,
    o.status,
    total_price,
    coin_input_amount,
    coin_change_amount
    from orders o
    join machines m on o.machine_id = m.machine_id
    join products p on o.product_id = p.product_id
    order by order_at desc  `;

    if (limit && limit > 0) {
      sql += ' limit ? ';
      params.push(sql);
    }

    db.query(sql, params, (err, rows) => {
      if (err) {
        debug('Find Order errro :', err);
        return callback(err);
      }

      rows = rows || [];
      callback(null, rows.map(row => fromDbObject(row)));
    });
  }

  insert(order, callback = NOOP, conn = db) {
    if (!order) {
      return callback(new Error('Invalid Order'));
    }

    order.orderId = Generator.generateId();

    const sql = sqlQuery.insert()
      .into(OrderRepository.TABLE_NAME)
      .set(toDbObject(order, OrderRepository.FIELD_LIST))
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

  update(order, callback = NOOP, conn = db) {
    const sql = sqlQuery.update()
      .into(OrderRepository.TABLE_NAME)
      .set(toDbObject(
        order, OrderRepository.FIELD_LIST,
        [OrderRepository.PK_NAME]
      ))
      .where({
        [OrderRepository.PK_NAME]: order.orderId
      })
      .build();

    conn.query(sql, (error, result) => {
      callback(error, result);
    });
  }

}

OrderRepository.TABLE_NAME = 'orders';
OrderRepository.PK_NAME = 'order_id';
OrderRepository.FK_NAMES = ['machine_id', 'product_id'];
OrderRepository.FIELD_LIST = Object.freeze([
  'order_id', 'machine_id', 'product_id', 'order_at', 'payment_method',
  'qr_code', 'qr_api_response', 'status', 'total_price',
  'coin_input_amount', 'coin_change_amount',
]);

exports.OrderRepository = OrderRepository;
