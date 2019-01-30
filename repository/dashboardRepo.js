const debug = require('debug')('cloudvdm:repo:dashboard');
const SQL = require('sql-query');
const Generator = require('../util/generator');
const { toDbObject, fromDbObject } = require('./util');
const { db } = require('../db');
const sqlQuery = SQL.Query();

class DashboardRepository {

  //////ค้นหาด้วยแมชชีนไอดี
  findByMachineId(machineId, callback) {
    const sql = sqlQuery.select()
      .from(DashboardRepository.machines)
      .where({
        [DashboardRepository.PK_NAME]: machineId,
        is_deleted: false,
      })
      .build();

    db.query(sql, (error, rows) => {
      let machines = void 0;
      if (rows && rows.length) {
        machines = rows[0];
      }
      callback(error, fromDbObject(machines));
    });
  }
  //////ค้นหาด้วยแมชชีนไอดี


  getFirstMachineDashboardCoinCount(machineId, callback) {
    const sql = `select stamp, m.machine_id, name, m.status, location, ip_address, is_alarm, network_signal,
    coin_remain_1, coin_remain_2, coin_remain_5, coin_remain_10, 
    coin_remain_20, coin_remain_50, coin_remain_100
    from machines m
    left join machine_coin_stat st on (m.machine_id = st.machine_id)
    where m.machine_id = ? and is_deleted = false order by stamp desc limit 1`;

    db.query(sql, [machineId], (err, result) => {
      let data = void 0;

      if (err) {
        debug('Error getFirstMachineDashboardCoinCount :', err);
      } else if (result && result.length) {
        data = fromDbObject(result[0]);
      }
      callback(err, data);
    });
  }

  getCoinReceivedCount(machineId, callback) {
    const sql = `select 
    sum(case when type = 'receiver_coins' then current_coin_count end) as recv_coin,
    sum(case when type = 'receiver_banknotes' then current_coin_count end) as recv_notebank
    from machine_devices md
    left join device_coin_acceptors dca on md.device_id = dca.device_id
    where md.machine_id = ?
    group by md.machine_id`;

    db.query(sql, [machineId], (err, result) => {
      let data = void 0;

      if (err) {
        debug('Error getCoinReceivedCount :', err);
      } else if (result && result.length) {
        data = fromDbObject(result[0]);
      }
      callback(err, data);
    });
  }

  getQrCount(callback) {
    const sql = `select 
    (
      select count(qr_id) from product_qrcode where status = 'USED'
    ) as qr_active_count,
    (
      select count(qr_id) from product_qrcode where status in ('ACTIVE', 'USED')
    ) as qr_total
    from dual`;

    db.query(sql, (err, rows) => {
      if (rows) {
        rows = fromDbObject(rows[0]);
      }

      callback(err, rows);
    });
  }

  getProductStock(callback) {
    const sql = `select 
    product_id, image, name, price, \`group\`, stock 
    from products 
    order by stock asc 
    limit 10`;

    db.query(sql, (err, rows) => {
      if (err) {
        debug('Error getProduct stock :', err);
        return callback(err);
      }

      rows = rows || [];
      callback(null, rows.map(row => fromDbObject(row)));
    });
  }

}

exports.DashboardRepository = DashboardRepository;
