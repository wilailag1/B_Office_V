const debug = require('debug')('cloudvdm:socket:client-manager');

/**
 * @type {{[key: string]: SocketIO.Client}}
 */
let clients = {};
let machineClientMap = {};

module.exports = {

  /**
   * Register client that just connected into server
   * To remember them
   * 
   * @param {SocketIO.Client} client Connected client instance
   */
  registerClient(client) {
    const { address, port, family } = client.conn.request.connection._getpeername();
    debug(`Client ${client.id} ([${family}]${address}:${port}) is connected.`);

    clients[client.id] = client;
  },

  /**
   * Un-Register client that just disconnected from server
   * @param {SocketIO.Client} client Disconnected client instance
   */
  unregisterClient(client) {
    const { address, port, family } = client.conn.request.connection._getpeername();
    debug(`Client ${client.id} ([${family}]${address}:${port}) is disconnected.`);

    delete clients[client.id];
  },

  setMachineIdByClientId(clientId, machineId) {
    if (clientId in clients) {
      const client = clients[clientId];

      client.machineId = machineId;
      machineClientMap[machineId] = client;
    } else {
      debug(`No ${clientId} found to set machine id`);
    }
  },

  unsetMachineId(clientId, machineId) {
    if (clientId in clients) {
      const client = clients[clientId];
      delete client.machineId;
      delete machineClientMap[machineId];
    } else {
      debug(`No ${clientId} found to set machine id`);
    }
  }

};
