const debug = require('debug')('cloudvdm:auth');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Repository = require('../repository');

const networkUtil = require('../util/network');

module.exports = router;

passport.serializeUser((user, done) => {
  done(null, user.userId);
});

passport.deserializeUser((username, done) => {
  // debug('deserialuser :', username);
  Repository.UserRepo.findUsername(username, (err, user) => {
    done(err, user);
  });
});

passport.use(new LocalStrategy((username, password, done) => {
  Repository.UserRepo.findUserPassword(username, password, (err, user) => {
    if (err) {
      // throw err;
      let cause = '';

      if (err.code === 'ECONNREFUSED') {
        cause = 'Database connection';
      }

      debug('Login error :', err);
      return done(null, false, {
        message: `Can't logging in : ${cause}`,
      });
    }

    if (!user) {
      return done(null, false, {
        message: 'Username or password does not match',
      });
    }

    debug('user :', user);

    // TODO: Use bcrypt
    if (password === user.password) {
      debug('Authen OK');
      done(null, user);
    } else {
      debug('Failed ');
      done(null, false, { message: 'Username or password does not match' });
    }
  });
}));

router.get('/', (req, res, next) => {
  res.redirect('/auth/login');
});

router.get('/login', (req, res, next) => {
  const message = req.flash('error');

  res.render('login', {
    title: 'Login',
    layout: 'layouts/blank',
    message//: req.flash('error'),
  });
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/auth/login',
  failureFlash: true, //'Username or Password does not match'
  session: true,
}), (req, res) => {
  req.flash('success', 'You are now logged in');
  res.redirect('/app');

  Repository.UserLogRepo.insertLog(
    req.user.userId,
    networkUtil.getClientRemote(req),
    'LOGGED_IN',
    {}
  );

});

router.all('/logout', (req, res, next) => {

  Repository.UserLogRepo.insertLog(
    req.user.userId,
    networkUtil.getClientRemote(req),
    'LOGGED_OUT',
    {}
  );

  req.logout();
  res.redirect('/');
});
