const debug = require('debug')('cloudvdm:socket');
const io = require('socket.io')();
const ClientManager = require('./socket/clientManager');
const ClientOperation = require('./socket/clientOperation');
const {
  MachineRepository,
  MachineLogRepository,
} = require('./repository');

const NOOP = () => { };

// var nsp = '/';
// var slice = Array.prototype.slice;

// io.use((socket, next) => {
//   debug('Socket header :', socket.handshake.query);
//   if (!socket.handshake.query.vmid) {
//     debug('Invalid client');
//     return next(new Error('Invalid client'));
//   }

//   next();
// })

// io.on('connection', function(socket) {
//   console.log('hello client2');
// });

// io.of(nsp).on('connection', function(socket) {
//   console.log('hello client');
//   socket.send('hello client');

//   socket.on('message', function() {
//     var args = slice.call(arguments);
//     socket.send.apply(socket, args);
//   });

//   socket.on('echo', function() {
//     var args = slice.call(arguments);
//     socket.emit.apply(socket, ['echoBack'].concat(args));
//   });

//   socket.on('ack', function() {
//     var args = slice.call(arguments);
//     var callback = args.pop();
//     callback.apply(null, args);
//   });

//   socket.on('callAck', function() {
//     socket.emit('ack', function() {
//       var args = slice.call(arguments);
//       socket.emit.apply(socket, ['ackBack'].concat(args));
//     });
//   });

//   socket.on('callAckBinary', function() {
//     socket.emit('ack', function(buf) {
//       socket.emit('ackBack', buf);
//     });
//   });

//   socket.on('getAckBinary', function(data, callback) {
//     var buf = new Buffer('huehue', 'utf8');
//     callback(buf);
//   });

//   socket.on('getAckDate', function(data, callback) {
//     callback(new Date());
//   });

//   socket.on('broadcast', function(data) {
//     var args = slice.call(arguments);
//     socket.broadcast.emit.apply(socket, ['broadcastBack'].concat(args));
//   });

//   socket.on('room', function() {
//     var args = slice.call(arguments);
//     io.to(socket.id).emit.apply(socket, ['roomBack'].concat(args));
//   });

//   socket.on('requestDisconnect', function() {
//     socket.disconnect();
//   });

//   socket.on('disconnect', function() {
//     console.log('disconnect');
//   });

//   socket.on('error', function() {
//     console.log('error: ', arguments);
//   });

//   socket.on('getHandshake', function(cb) {
//     cb(socket.handshake);
//   });
// });


io
  .use((socket, next) => {
    // debug('Socket header :', socket.handshake.headers);
    if (!socket.handshake.query.vmid) {
      // debug('Invalid client');
      return next(new Error('Invalid client'));
    }

    next();
  })
  .on('connection', client => {
    // debug('Client Connection');
    ClientManager.registerClient(client);

    client
      .on('disconnect', () => {
        ClientManager.unregisterClient(client);

        if (client.machineId) {
          ClientManager.unsetMachineId(client.id, client.machineId);

          MachineRepository.updateMachine({
            machineId: client.machineId,
            status: 'OFFLINE',
          });

          MachineLogRepository.insertMachineLog({
            machineId: client.machineId,
            event: 'DISCONNECT',
            // data: JSON.stringify(data),
          });
        }
      })
      .on('authenticate', (data, callback = NOOP) => {
        const vmId = client.handshake.query.vmid;

        // debug('Authenticating', client.id);
        // debug('Client ID :', vmId);
        // debug('Data :', data);
        // debug('Token :', data.token);

        if (data.token == vmId) {

          MachineRepository.findById(vmId, (err, machineData) => {
            if (err) {
              debug('Error find machine :', err);
              callback(err);
              client.emit('error', {
                status: 'err',
                msg: err,
              });
              return client.disconnect(true);
            } else if (!machineData) {
              debug('Machine ID not found // Reject');
              callback({
                status: 'err',
                msg: 'Invalid ID',
              });
              /* client.emit('error', {
                status: 'err',
                msg: err,
              }); */
              return client.disconnect(true);
            } else if (machineData.status === 'SETUP') {
              // Do something
              const { machineId } = machineData;
              MachineLogRepository.insertMachineLog({
                machineId,
                event: 'SETUP_NEW',
                data: JSON.stringify(data),
              });
            }

            ClientManager.setMachineIdByClientId(client.id, machineData.machineId);

            const resp = { status: 'ok', msg: `Welcome #${machineData.machineId} ${machineData.name}` };
            client.emit('authenticated', resp);

            MachineLogRepository.insertMachineLog({
              machineId: machineData.machineId,
              event: 'CONNECT',
              data: JSON.stringify(data),
            });

            ClientOperation(io, client, machineData);

            debug('Welcome ' + client.id);
            return callback(null, resp);
          });
        } else {
          return callback('Invalid token');
        }
      });

  })
  .on('reconnect_attemp', () => {
    debug('Reconnecting from client');
  });

exports.io = io;
