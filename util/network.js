
module.exports = {

  getClientRemote(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },

};
