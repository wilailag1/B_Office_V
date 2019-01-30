const debug = require('debug')('cloudvdm:route:administration/role');
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  RolesRepository: roleRepo,
  UserLogRepo,
} = require('../../repository');
const networkUtil = require('../../util/network');

router.get('/', (req, res) => {
  res.locals.title = 'Role Management - Administration';

  roleRepo.findAll((error, rows) => {
    if (error) {
      debug('Error Find all Roles :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
    }

    res.render('app/administration/role/roleList', {
      roleData: {
        rows,
      },
    });
  });
});

router.get('/add', (req, res) => {
  res.locals.title = 'Adding Role';
  res.locals.headTitle = 'Add new Role';

  const [roleData] = req.flash('role');
  // const [messagePopup] = req.flash('messagePopup');

  res.render('app/administration/role/add', {
    isEdit: false,
    // messagePopup,
    roleData: roleData || {},
  });
});

router.post('/add', (req, res) => {

  const {
    roleName,
    admin,
    vending,
    product,
    saleReport,
    logs,
  } = req.body;

  const rolePermissionJson = {
    admin,
    vending,
    product,
    saleReport,
    logs
  };

  roleRepo.insertRole(roleName, rolePermissionJson, (error, result) => {
    if (error) {
      debug('Error insert role :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('role', {
        roleName,
        admin,
        vending,
        product,
        saleReport,
        logs,
      });
      return res.redirect(req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Added new Role',
      message: 'Success',
    });
    res.redirect('./');

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'ADD_ROLE',
      { roleName }
    );
  });
});

router.get('/edit/:roleId', (req, res) => {
  const { roleId } = req.params;

  roleRepo.find(roleId, (error, result) => {
    if (error) {
      debug('Load role error :', error);
    }

    debug(`Load Role ${roleId} :`, result);

    const roleData = result;
    const {
      admin,
      vending,
      product,
      saleReport,
      logs,
    } = roleData.rolePermissionJson;

    Object.assign(roleData, {
      admin,
      vending,
      product,
      saleReport,
      logs,
    });

    // const [messagePopup] = req.flash('messagePopup');
    res.render('app/administration/role/add', {
      headTitle: `Edit Role ${roleData.roleName}`,
      isEdit: true,
      // messagePopup,
      roleData: roleData || {},
    });
  });
});
router.post('/remove/:roleId', (req, res) => {
  const { roleId } = req.params;
  const {
    roleName,
    admin,
    vending,
    product,
    saleReport,
    logs,
  } = req.body;

  const rolePermissionJson = {
    admin,
    vending,
    product,
    saleReport,
    logs,
  };

  roleRepo.deleteRole(roleId, roleName, rolePermissionJson, (error, result) => {
    if (error) {
      debug('Error delete role :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('role', {
        roleName,
        admin,
        vending,
        product,
        saleReport,
        logs,
      });
    }

    req.flash('messagePopup', {
      title: 'delete Role',
    });

    res.redirect('../');

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'REMOVE_ROLE',
      { roleName }
    );
  });
});


router.post('/edit/:roleId', (req, res) => {
  const { roleId } = req.params;
  const {
    roleName,
    admin,
    vending,
    product,
    saleReport,
    logs,
  } = req.body;

  const rolePermissionJson = {
    admin,
    vending,
    product,
    saleReport,
    logs,
  };

  roleRepo.updateRole(roleId, roleName, rolePermissionJson, (error, result) => {
    if (error) {
      debug('Error update role :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('role', {
        roleName,
        admin,
        vending,
        product,
        saleReport,
        logs,
      });
    }

    req.flash('messagePopup', {
      title: 'Saved Role',
    });

    res.redirect('../');

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'EDIT_ROLE',
      { roleName }
    );
  });
});

module.exports = router;
