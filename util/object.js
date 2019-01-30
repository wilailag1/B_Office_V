const _ = require('lodash');

module.exports = {
  deepClone(source) {
    return _.cloneDeep(source);
  },
};
