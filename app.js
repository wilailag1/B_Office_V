
const debug = require('debug')('cloudvdm:app');

const { db } = require('./db');
const express = require('express');
const path = require('path');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
// const lessMiddleware = require('less-middleware');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
const expressValidator = require('express-validator');
require('./file/upload');
const flash = require('connect-flash');
const app = express();

const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Bangkok');
moment.locale('th-TH');
// NumeralJS format numbers
const numeral = require('numeral');
require('numeral/locales/th');
numeral.locale('th');

// Add some filters
const filters = {
  currency: (number) => numeral(number).format('$ 0,0[.]00'),
  dateFormat: (date, format = 'DD/MM/YYYY') => moment(date).format(format),
  timestamp: (dateTime) => {
    if (!dateTime) return '';
    return moment(dateTime).format('DD/MM/YYYY HH:mm:ss');
  },
  startsWith: (text, test) => text.indexOf(test) == 0,
};

const Repo = require('./repository');
const networkUtil = require('./util/network');

app.use('*', (req, res, next) => {
  res.locals.filters = filters;
  next();
});

app.set('x-powered-by', false);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.set('layout extractMetas', true);
app.set('layout', 'layouts/layout');
app.use(expressLayouts);

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sassMiddleware({
  src: path.join(__dirname, 'sass'),
  // dest: path.join(__dirname, 'public/assets/css'),
  response: true,
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
  outputStyle: 'compressed',
  prefix: '/assets/css',
  force: true,
}));
// app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(cookieParser());
// app.use(bodyParser({ extended: true }));
// Handle Sessions
const sessionStore = new MySQLStore({}, db);

app.use(session({
  secret: 'dkfjsldfiajsodfijwoeirjw',
  store: sessionStore,
  // saveUninitialized: true,
  // resave: true,
  saveUninitialized: false,
  resave: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Set user object for Views
app.use((req, res, next) => {

  if (req.method === 'OPTIONS') {
    return next();
  }

  /* if (req.isAuthenticated() || req.method === 'OPTIONS') {
    return next();
  } */
  // debug('req user :', req.user);
  const [messagePopup] = req.flash('messagePopup');
  const lastError = req.flash('error');
  debug('Message popup :', messagePopup);

  res.locals.user = req.user || null;
  res.locals.url = req.originalUrl;
  res.locals.messagePopup = messagePopup;
  res.locals.lastError = lastError;

  if (req.user) {
    if (req.method == 'GET') {

      // Except images / QR
      if (
        !/^\/assets|\/app\/api|\/app\/product\/image|\/app\/product-qr\/generate|\/favicon.ico/
          .test(req.path)
      ) {
        Repo.UserLogRepo.insertLog(
          req.user.userId,
          networkUtil.getClientRemote(req),
          'NAVIGATE',
          { url: req.url }
        );
      }
    }
  }

  next();
});

// Validator
app.use(expressValidator({
  errorFormatter: function (param, msg, value) {
    const namespace = param.split('.');
    const root = namespace.shift();
    let formParam = root;

    while (namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg,
      value
    };
  }
}));

// Initial routes
require('./routeConfig')(app);

// Load Caches
db.on('connection', (cb) => {
  require('./cache/cache');
});

module.exports = app;
