const debug = require('debug')('cloudvdm:socket:client-operation');
const waterfall = require('async/waterfall');
const { beginTransaction } = require('../db');
const {
  MachineRepository,
  MachineDeviceRepository,
  MachineLogRepository,
  MachineCoinStatRepository,
  DeviceCoinAcceptorsRepository,
  ProductRepository,
  ProductQrcodeRepository,
  OrderRepository,
  UserJobRepository,
} = require('../repository');
const socketUtil = require('../socket/utils');
const productFindByIdSync = require('deasync')(ProductRepository.findById);

const NOOP = (err, result) => { };

/**
 * Client Operations. Client will access resources when logged in
 * 
 * @param {SocketIO.Server} io Socket.IO Server
 * @param {SocketIO.Socket} client Socket client
 */
module.exports = (io, client, machineData) => {

  // Listening client
  client
    .on('init', data => {
      debug('VM name :', data.name);

      MachineLogRepository.insertMachineLog({
        machineId: client.machineId,
        event: 'INIT',
        data: JSON.stringify(data),
      });

      initialVendingMachine(client.machineId, data, (err, result) => {
        if (err) {
          debug('Initalizing Vending machine is failed :', err);
          MachineLogRepository.insertMachineLog({
            machineId: client.machineId,
            event: 'E_INIT',
            data: JSON.stringify(err),
          });
          return;
        }

        MachineLogRepository.insertMachineLog({
          machineId: client.machineId,
          event: 'INIT_OK',
        });

        debug('Vending machine devices initializing is successful.');
      });
    })
    /* .on('transaction', data => {
      debug('transaction');

    }) */
    .on('heartbeat', data => {
      debug('heartbeat');

    })
    .on('requestProducts', callback => {
      MachineLogRepository.insertMachineLog({
        machineId: client.machineId,
        event: 'REQ_PRODUCTS',
      });
      ProductRepository.findAll(callback);
    })
    .on('checkCode', (code, callback) => {
      //เช็ค QRcode : Return true/false;

      MachineLogRepository.insertMachineLog({
        machineId: client.machineId,
        event: 'QRCODE_CHECK',
        data: JSON.stringify(code),
      });

      ProductQrcodeRepository.findByCode(code, (err, result) => {
        if (result) {
          // Found code and can use.
          if (result.productId) {
            ProductRepository.findById(result.productId, (err, product) => {
              ProductRepository.findAllByNameWithStocked(product.name, (err, products) => {
                const channels = products.map(product => ({
                  productId: product.productId,
                  channel: product.channel
                }));
                callback(err, { product, channels, qrId: result.qrId, code });
              });
            });
          } else {
            return callback(`Invalid product ID : ${result.productId}`);
          }
        } else {
          // eslint-disable-next-line
          console.log(`Not found QRCODE ${code} or Its used`);
          callback(err, false);
        }
      });
    })
    .on('checkCode2', (productId, qrId, code, callback = NOOP) => {

      ProductRepository.findById(productId, (err, product) => {

        // Check stock if 0 then leave
        if (product.stock > 0) {
          ProductQrcodeRepository.update({
            qrId,
            status: 'USED',
            useAt: new Date(),
          }, (err, result) => {
            if (err) {
              debug('!! Error cant set QR Code inactive :', err);
              debug('  For QRID : ' + qrId);

              MachineLogRepository.insertMachineLog({
                machineId: client.machineId,
                event: 'E_QRCODE',
                data: JSON.stringify(err),
              });
            }
          });

          //  Insert Order
          const orderData = {
            machineId: client.machineId,
            productId: product.productId,
            orderAt: new Date(),
            paymentMethod: 'qrcode',
            status: 'completed',
            coinInputAmount: 0,
            coinChangeAmount: 0,
            totalPrice: product.price,
          };

          OrderRepository.insert(orderData, (err, result) => {
            if (err) {
              debug('Error Insert order :', err);
            }
          });

          ProductRepository.decreaseStock(product.productId, 1, (err, result) => {
            if (err) {
              debug('Error Update product stock :', err);
            }
          });

          MachineLogRepository.insertMachineLog({
            machineId: client.machineId,
            event: 'QRCODE_USE',
            data: JSON.stringify({ qrId, qrCode: code, product }),
          });

          callback(err);
        }
      });

    })
    .on('hwReset', (data, callback) => {
      //เช็ค Resetของ : รับค่าจำนวนของใหม่มา up db
      data.force = true;

      MachineLogRepository.insertMachineLog({
        machineId: client.machineId,
        event: 'INIT_RESET',
        data: JSON.stringify(data),
      });

      initialVendingMachine(client.machineId, data, (err, result) => {
        if (err) {
          debug('Reset Vending machine is failed :', err);

          MachineLogRepository.insertMachineLog({
            machineId: client.machineId,
            event: 'E_INIT_RESET',
            data: JSON.stringify(err),
          });

          return;
        }

        MachineLogRepository.insertMachineLog({
          machineId: client.machineId,
          event: 'INIT_RESET_OK',
        });

        debug('Vending machine devices reset is successful.');
      });
    })

    /**
     * Receive end of transaction data
     * 
     * data refer to https://docs.google.com/document/d/1grpaRnBZG60ts7c1LeboSqsSfTE9hU_WJkg6crmlCUY/edit#heading=h.sp2216xxl94k
     */
    .on('end-transaction', (data, callback = NOOP) => {

      const { machineId } = client;
      debug('[end-transaction] Saving transaction from Machine...');

      if (!data) {
        const err = 'Error Invalid transaction data !';
        debug(err);

        MachineLogRepository.insertMachineLog({
          machineId: client.machineId,
          event: 'E_ORDER_TRX_DATA',
          data: JSON.stringify(err),
        });

        return callback(err);
      }

      debug(`  Machine ID : ${machineId}`);
      debug(`  Serial : ${data.serial}`);

      if (data.serial != machineId) {
        const err = 'Error transaction : Serial is not same as Machine ID!';
        debug(err);

        MachineLogRepository.insertMachineLog({
          machineId: client.machineId,
          event: 'E_ORDER_TRX_SN',
          data: JSON.stringify(err),
        });

        return callback(err);
      }

      insertTransaction(data, (err, result) => {
        if (!err) {
          if (data.status != 'cancel') {
            MachineLogRepository.insertMachineLog({
              machineId: client.machineId,
              event: 'ORDER_TRX_OK',
              data: JSON.stringify(result),
            });

            debug('Transaction Completed');
          }
        } else {
          MachineLogRepository.insertMachineLog({
            machineId: client.machineId,
            event: 'E_ORDER_TRX',
            data: JSON.stringify(err),
          });
        }
      });
    })
    .on('job-done', (data, callback = NOOP) => {
      debug('Job Done from ', client.machineId);
      debug('  Data :', data);
      if (data == 1) {
        MachineLogRepository.insertMachineLog({
          machineId: client.machineId,
          event: 'SW_FINISH_CLICK',
          data: JSON.stringify({
            mode: data,
            machineId: client.machineId,
            machineName: machineData.name,
          }),
        });
      } else if (data == 2) {
        UserJobRepository.findActiveJobByMachineId(client.machineId, (err, job) => {
          if (err) {
            debug('Error findActiveJobByMachineId :', err);
            return callback('Error findActiveJobByMachineId');
          }

          if (!job) {
            // No job active
            debug('No active job to done .');
            return callback('NO_JOB');
          }

          const jobId = job.jobId;
          let productRestock = {};
          try {
            productRestock = JSON.parse(job.addProductStock);
          } catch (e) {
            debug('Error parse json :', e);
          }

          const jobData = {
            mode: data,
            jobId,
            machineId: client.machineId,
            machineName: machineData.name,
          };



          if (jobId) {
            beginTransaction((err, conn) => {
              if (err) {
                debug('Error Job-done Begin tx :', err);
                conn.rollback();
                conn.release();
                return;
              }

              const transactionTasks = [];

              for (const productId in productRestock) {
                const restockQty = productRestock[productId];
                if (restockQty > 0) {
                  transactionTasks.push((callback) => {

                    debug(`Updating stock for ${productId} + ${restockQty} ...`);

                    ProductRepository.addStock(productId, restockQty, (err, result) => {
                      if (err) {
                        debug(`Updating stock for ${productId} is failed :`, err);
                      } else {
                        debug('Updated.');
                      }

                      callback(err);
                    }, conn);
                  });
                }
              }

              transactionTasks.push(callback => {
                const productMap = {};
                for (const productId in productRestock) {
                  try {
                    const product = productFindByIdSync(productId);

                    productMap[productId] = {
                      productId: product.productId,
                      productName: product.name,
                      restockQty: productRestock[productId],
                    };

                  } catch (errPrd) {
                    debug('Transaction select product error :', errPrd);
                  }
                }
                callback(null, productMap);
              });

              transactionTasks.push((productMap, callback) => {
                UserJobRepository.update({
                  jobId,
                  status: 'done',
                  updateBy: 'VM_SOCKET',
                }, (err, result) => {
                  if (err) {
                    debug('Error update User job :', err);
                    MachineLogRepository.insertMachineLog({
                      machineId: client.machineId,
                      event: 'E_JOB_FINISH_HW',
                      data: JSON.stringify(err),
                    });
                    return;
                  }

                  jobData.productRestock = productMap;

                  MachineLogRepository.insertMachineLog({
                    machineId: client.machineId,
                    event: 'JOB_FINISH_HW',
                    data: JSON.stringify(jobData),
                  });

                  callback(err);
                }, conn);
              });

              waterfall(transactionTasks, (err, result) => {
                if (err) {
                  debug('Job-done Tx is failed :', err);

                  conn.rollback();
                  conn.release();
                  return;
                }
                debug('Set Job done success');

                callback(err, {
                  coin_10: job.addCoin10,
                  coin_5: job.addCoin5,
                  coin_2: job.addCoin2,
                  coin_1: job.addCoin1,
                });

                conn.commit();
                conn.release();
              });
            });
          }
        });
      }
    })
    .on('error-msg', (errCode) => {
      debug('Error Code from Vending machine :', errCode);

      MachineLogRepository.insertMachineLog({
        machineId: client.machineId,
        event: 'E_VM_ERR_MSG',
        data: errCode,
      });
    });

  // Startup emit
  ProductRepository.findAll((err, products) => {
    if (err) {
      return debug('Error to send products !');
    }
    // debug('Send products :', products);
    client.emit('products', { products });
  });

  {
    const { machineId } = machineData;
    MachineRepository.updateMachine({
      machineId,
      ipAddress: socketUtil.getRemoteAddress(client).address,
      status: 'ONLINE',
    });
  }
};

function initialVendingMachine(machineId, receiveData, outerCallback = NOOP) {
  const {
    name,
    geoLocation,
    serial,
    devices,
    force, // Force update devices
  } = receiveData;

  if (!machineId || !receiveData.serial || machineId !== receiveData.serial) {
    debug('Invalid Init Machine !');
    return outerCallback('Invalid Init Machine !');
  }

  // Load machine
  MachineRepository.findById(machineId, (err, machineData) => {
    if (err) {
      debug('Error load machine while Init :', err);
      return outerCallback(err);
    }

    if (!machineData) {
      const err = 'Machine not found !';
      return outerCallback(err);
    }

    beginTransaction((err, conn) => {
      // Update Machine
      waterfall([
        /** Update machine */
        (callback) => {
          if (geoLocation != machineData.geoLocation) {
            machineData.geoLocation = geoLocation;

            MachineRepository.updateMachine(machineData, (err, result) => {
              callback(err, result);
            });
          } else {
            // Next
            callback(null);
          }
        },

        /** Insert devices */
        (callback) => {
          if (force || machineData.status === 'SETUP') {
            const { devices } = receiveData;
            if (devices) {
              const insertDeviceTasks = [];
              const coinCounts = {}; // TODO: update into `machine_coin_stat`

              devices.forEach(device => {
                let { deviceId } = device;

                if (!deviceId) {
                  debug(` Device ID is not available, Use Serial instead (${device.serial})`);
                  deviceId = device.serial;
                }

                device.machineId = machineId;
                let currentCoinCount = 0;

                // Transform data
                if (device.data) {
                  device.data = JSON.stringify(device.data);
                  currentCoinCount = device.data.stock || 0;
                  delete device.data.stock;
                }

                // Queue for Insert machine device
                insertDeviceTasks.push((devCallback) => {
                  MachineDeviceRepository.insert(device, (err, result) => {
                    if (err) {
                      debug('Insert Machine device error :', err);
                      debug('  Device data :', device);
                    }
                    devCallback(err);
                  });
                });

                // Queue for Insert Device coin acceptor
                insertDeviceTasks.push((devCallback) => {
                  DeviceCoinAcceptorsRepository.insert({
                    deviceId,
                    currentCoinCount,
                    status: 'ATTACHED',
                  }, (err, result) => {
                    if (err) {
                      debug('Insert Machine device error :', err);
                      debug('  Device coin acc ID :', deviceId);
                    }
                    devCallback(err);
                  });
                });
              });

              waterfall(insertDeviceTasks, (err, devResult) => {
                if (err) {
                  debug('Devices inserting aborted.', err);
                  return callback(err);
                }

                debug('Devices has been inserted');
                callback(null);
              });
            }
          } else {
            // otherwise skip if status isn't "SETUP"
            // TODO: Change devices diff.

            callback(null);
          }
        },

        /** Update Machine status */
        (callback) => {
          MachineRepository.updateMachine({
            machineId,
            status: 'ONLINE',
          }, (err, result) => {
            if (err) {
              return debug('Error while update machine during initializing :', err);
            }

            callback(err);
          });
        },
      ], (err, result) => {
        if (err) {
          debug('Initializing transaction error :', err);
          conn.rollback();
          return outerCallback(err);
        }

        conn.commit();
        conn.release();
        return outerCallback(null, true);
      });
    });

  });
}

function insertTransaction(data, outerCallback = NOOP) {

  const { devices } = data;

  const updateCoinStatObj = {};
  const coinTypeRefund = {};

  let coinInputAmount = 0;
  let coinChangeAmount = 0;
  let isCancelTx = false;

  const deviceCoinAcceptorsData = {};
  if (devices) {
    // try to get coin input/change amt.
    const coinDispensers = devices.filter(device => /dispenser_coin/.test(device.type));
    const coinReceiver = devices.find(device => device.type === 'receiver_coins');
    const banknotesReceiver = devices.find(device => device.type === 'receiver_banknotes');

    debug({ coinDispensers, coinReceiver, banknotesReceiver });

    // TODO: Insert in `coin_acceptor_history`.

    // Count/sum coins
    if (coinDispensers && coinDispensers.length > 0) {
      coinChangeAmount = coinDispensers.reduce((prev, dispenser, index) => {
        const {
          deviceId,
          data: {
            stock: currentCoinCount,
            send,
          },
          type,
        } = dispenser;


        const coinType = +(type.replace('dispenser_coin_', ''));

        // Add to update coin stat
        updateCoinStatObj[`coinRemain${coinType}`] = +dispenser.data.stock;
        coinTypeRefund[coinType] = +dispenser.data.send;

        return prev + (coinType * dispenser.data.send);
      }, coinChangeAmount);
    }

    let coinInput = 0;
    if (coinReceiver.data) {
      const coins = coinReceiver.data;
      for (const key in coins) {
        coinInput += (+key) * coins[key];
      }
    }

    deviceCoinAcceptorsData[coinReceiver.deviceId] = {
      deviceId: coinReceiver.deviceId,
      currentCoinCount: coinInput,
    };

    coinInputAmount += coinInput;

    let banknoteInput = 0;
    if (banknotesReceiver.data) {
      const banknotes = banknotesReceiver.data;
      for (const key in banknotes) {
        banknoteInput += (+key) * banknotes[key];
      }
    }

    deviceCoinAcceptorsData[banknotesReceiver.deviceId] = {
      deviceId: banknotesReceiver.deviceId,
      currentCoinCount: coinInput,
    };

    coinInputAmount += banknoteInput;

    debug({ coinInputAmount, coinChangeAmount });
  } else {
    debug(' !!! No devices data !!!');
  }

  const orderData = {
    machineId: data.serial,
    productId: data.productId,
    orderAt: new Date(),
    paymentMethod: 'cash',
    status: data.status || 'completed',
    coinInputAmount,
    coinChangeAmount,
    totalPrice: data.totalPrice,
  };

  if (orderData.status.toLowerCase() == 'cancel') {
    isCancelTx = true;

    orderData.coinInputAmount = 0;
    orderData.coinChangeAmount = 0;
  }

  debug({ orderData });

  beginTransaction((err, conn) => {
    debug('Begin TX');

    if (err) {
      debug('Begin tx error :', err);
      conn.rollback();
      return outerCallback(err);
    }

    // for logging
    data.coinTypeRefund = coinTypeRefund;

    MachineLogRepository.insertMachineLog({
      machineId: data.serial,
      event: 'ORDER_TRX',
      data: JSON.stringify(data),
    });

    waterfall([
      /** Order insert */
      (callback) => {
        OrderRepository.insert(orderData, (err, result) => {
          if (err) {
            debug('Error Insert order :', err);
          }
          callback(err);
        }, conn);
      },

      /** Update Product quantity */
      (callback) => {
        if (isCancelTx) {
          return callback(null);
        }

        ProductRepository.decreaseStock(orderData.productId, 1, (err, result) => {
          if (err) {
            debug('Error Update product stock :', err);
          }
          callback(err);
        }, conn);
      },

      /** Insert Machine Coin stat  */
      (callback) => {
        if (isCancelTx) {
          return callback(null);
        }

        updateCoinStatObj.machineId = orderData.machineId;
        updateCoinStatObj.status = 'COMPLETED';
        updateCoinStatObj.coinRemainTotal = coinChangeAmount;

        MachineCoinStatRepository.insert(updateCoinStatObj, (err) => {
          if (err) {
            debug('Error Insert machine coin stat :', err);
          }
          callback(err);
        }, conn);
      },

      /** Update Device coin acceptors */
      (callback) => {
        if (isCancelTx) {
          return callback(null);
        }

        // Update each of device coin acceptors
        const innerTasks = Object.keys(deviceCoinAcceptorsData).map(key => {
          const dcaData = deviceCoinAcceptorsData[key];
          return (callback) => {
            DeviceCoinAcceptorsRepository.upsertIncrease(dcaData, (err) => {
              callback(err);
            }, conn);
          };
        });

        waterfall(innerTasks, (err, result) => {
          if (err) {
            debug('Error Update Device coin acceptor :', err);
          }

          callback(err);
        });
      },

    ], (err, result) => {
      if (err) {
        debug('Insert transaction error :', err);
        conn.rollback();
        return outerCallback(err);
      }

      conn.commit();
      conn.release();

      debug('end');
    });

  });

}


// TEST
/* const testOrder = {
  "name": "vending1",
  "geo_location": "",
  "serial": "vlE8vjOqn",
  "productId": "AN0MgJQkP",
  "status": "completed",
  "totalPrice": 39,
  "devices": [
    {
      "deviceId": "12345",
      "type": "dispenser_product",
      "version": 1,
      "serial": "281195811",
      "data": {
        "send": "A1"
      }
    },
    {
      "deviceId": "56789",
      "type": "dispenser_coin_1",
      "version": 1,
      "serial": "281195811",
      "data": {
        "send": 2
      }
    },
    {
      "deviceId": "693058",
      "type": "dispenser_coin_5",
      "version": 1,
      "serial": "281678546",
      "data": {
        "send": 3
      }
    },
    {
      "deviceId": "4829191",
      "type": "receiver_banknotes",
      "version": 1,
      "serial": "232342451",
      "data": {
        "10": 3,
        "20": 3,
        "50": 3,
        "100": 3,
        "500": 3,
        "1000": 3
      }
    },
    {
      "deviceId": "2367432",
      "type": "receiver_coins",
      "version": 1,
      "serial": "232342451",
      "data": {
        "1": 3,
        "2": 3,
        "5": 3,
        "10": 3
      }
    }
  ]
}; */

/* setTimeout(() => {
  insertTransaction(testOrder, (err, result) => {
    debug({ err, result });
  });

}, 1000);
 */

// Test product qr
/* const code = '11223344';
console.log('findByCode : ', code);
ProductQrcodeRepository.findByCode(code, (err, result) => {
  console.log('Result findByCode :', result);
  if (result) {
    // Found code and can use.
    if (result.productId) {
      ProductRepository.findById(result.productId, (err, product) => {
        console.log(' ProductRepository.findById :', product);
        ProductRepository.findAllByNameWithStocked(product.name, (err, products) => {
          console.log('findAllByNameWithStocked :', products);
          const channels = products.map(product => ({
            productId: product.productId,
            channel: product.channel
          }));
          console.log(err, { product, channels, qrId: result.qrId, code });
        });
      });
    } else {
      return console.log(`Invalid product ID : ${result.productId}`);
    }
  } else {
    console.log(err, false);
  }
}); */
