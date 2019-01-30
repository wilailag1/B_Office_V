const Hashids = require('hashids');
const hashIds = new Hashids();

module.exports = {
  /**
   * Generate Unique ID by timestamp
   * 
   * @returns {String}
   */
  generateId: function () {
    return hashIds.encode(new Date().getTime());
  },

  generateProductId: function () {
    var count = 10;
    var _sym = '12345678901234567890';
    var str = 'PD-';

    for(var i = 0; i < count; i++) {
        str += _sym[parseInt(Math.random() * (_sym.length))];
    }

    return str;
  },

  generateChannel: function (_row,_column) {
    var row = parseInt(_row, 10);
    var column = parseInt(_column, 10);
    return ((row-1) * 8) + column;
  },
};
