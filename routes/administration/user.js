const debug = require('debug')('cloudvdm:route:administration/user');
const express = require('express');
const router = express.Router({ mergeParams: true });
const { Cache } = require('../../cache/cache');
const {
  UserRepo: userRepo,
  UserLogRepo,
  RolesRepository: roleRepo,
} = require('../../repository');
const objectUtil = require('../../util/object');
const networkUtil = require('../../util/network');


router.get('/', (req, res) => {
  res.locals.title = 'User Management - Administration';

  userRepo.findAll({}, (error, rows) => {
    if (error) {
      debug('Error Find all Users :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
    }

    res.render('app/administration/user/userList', {
      userData: {
        rows,
      },
    });
  });
});

router.get('/add', (req, res) => {
  res.locals.title = 'Adding User';
  res.locals.headTitle = 'Add new User';

  const [userData] = req.flash('user');
  // const [messagePopup] = req.flash('messagePopup');

  const roleOptions = Cache.getCached('role').map(role => ({ value: role.roleId, text: role.roleName }));

  res.render('app/administration/user/add', {
    isEdit: false,
    // messagePopup,
    userData: userData || {},
    roleOptions,
  });
});

router.post('/add', (req, res) => {

  const userData = objectUtil.deepClone(req.body);

  userData.createBy = res.locals.user.userId;

  debug('User data :', userData);

  userRepo.insertUser(userData, (error, result) => {
    debug('Inserting user :', userData);

    if (error) {
      debug('Error add user :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('user', userData);
    }

    req.flash('messagePopup', {
      title: 'Add User',
    });

    res.redirect('/app/administration/user/');

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'ADD_USER',
      { userId: userData.userId }
    );
  });
});

router.get('/edit/:userId', (req, res) => {
  const { userId } = req.params;

  const roleOptions = Cache.getCached('role').map(role => ({ value: role.roleId, text: role.roleName }));

  userRepo.findUsername(userId, (error, result) => {
    if (error) {
      debug('Load user error :', error);
    }

    debug(`Load User ${userId} :`, result);

    const userData = result;
    // const [messagePopup] = req.flash('messagePopup');
    res.render('app/administration/user/add', {
      headTitle: `Edit User ${userData.userId}`,
      isEdit: true,
      // messagePopup,
      userData: userData || {},
      roleOptions,
    });
  });
});

router.post('/edit/:userId', (req, res) => {
  const { userId } = req.params;

  const userData = objectUtil.deepClone(req.body);
  userData.userId = userId;
  userData.updateBy = res.locals.user.userId;

  debug('User data :', userData);

  userRepo.updateUser(userData, (error, result) => {
    debug('Updating user :', userData);

    if (error) {
      debug('Error update user :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('user', userData);
    }

    req.flash('messagePopup', {
      title: 'Saved User',
    });

    res.redirect('/app/administration/user/');

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'EDIT_USER',
      { userId: userData.userId }
    );
  });
});

router.all('/delete/:userId', (req, res) => {
  const { userId } = req.params;

  if (req.user.userId == userId) {
    req.flash('messagePopup', {
      title: "Can't delete yourself",
      type: 'error',
    });
    return res.redirect(req.header('Referer'));
  }

  userRepo.delete(userId, (error, result) => {
    if (error) {
      debug('Error delete user :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
    } else {
      req.flash('messagePopup', {
        title: 'Deleted user',
      });
    }

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'DEL_USER',
      { userId }
    );

    return res.redirect('/app/administration/user');
  });
});

module.exports = router;
