const debug = require('debug')('cloudvdm:db');
const mysql = require('mysql');

const connectionOptions = {
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cloud_vdm'
};

const pool = mysql.createPool(connectionOptions);
/* const pool = require('node-querybuilder').QueryBuilder(connectionOptions, 'mysql', 'pool');
pool.get_connection(qb => {
  qb.select('*').get('test_table', (resp) => console.log(resp));
}); */
// Listening events
pool.on('error', err => {
  debug('MySQL error :', err);
});

// Test drive
pool.query('SELECT version() as version', (err, rows, fields) => {
  if (err) {
    // console.error('MySQL test drive error :', err);
    debug('MySQL test drive error :', err);
    return;
  }
  // console.log('Connected. MySQL server version is ', rows[0].version);
  debug('Connected. MySQL server version is ', rows[0].version);
});

// module.exports = pool;
exports.db = pool;

exports.getConnection = pool.getConnection;

/**
 * Transaction callback
 * 
 * @param {Error} err Error information
 * @param {mysql.PoolConnection} conn Connection
 */
const txCallback = (err, conn) => { };
exports.beginTransaction = (callback = txCallback) => {
  pool.getConnection((err, conn) => {
    if (err) {
      return callback(err);
    }

    conn.beginTransaction((errTx) => {
      if (errTx) {
        return callback(errTx);
      }

      callback(void 0, conn);
    });
  });
};
