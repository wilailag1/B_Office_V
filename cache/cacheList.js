const {
  RolesRepository: roleRepo,
} = require('../repository');

module.exports = [
  {
    name: 'role',
    loader: (callback) => {
      roleRepo.findAll(callback);
    },
  },

];
