
// Routes
const indexRouter = require('./routes/index');
const testRouter = require('./routes/test');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const appRouter = require('./routes/app');
// End Routes


/**
 * Define Routes config
 * @param {Express} Express App instance
 */
module.exports = function (app) {
  app.use('/', indexRouter);
  app.use('/test', testRouter); // TODO: Remove, This is for testing.
  app.use('/api', apiRouter);
  app.use('/auth', authRouter);
  app.use('/app', appRouter);
};
