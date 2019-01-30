const debug = require('debug')('cloudvdm:cache');
const cacheList = require('./cacheList');

const cacheObject = {};

class Cache {

  /**
   * 
   * @param {Array<{name: string, loader: Function}>} cacheList Cache callback
   */
  constructor(cacheList) {
    debug('Initalizing Caches...');

    if (!cacheList) {
      debug('No cache defined');
      return;
    }

    cacheList.forEach(cache => {
      const { name, loader } = cache;
      try {

        debug(`Caching ${name}...`);
        loader((error, data) => {
          if (error) {
            return debug(`Cache ${name} error :`, error);
          }
          cacheObject[name] = data;
          debug(`Cached ${name}`);
        });
      } catch (error) {
        debug('Error loading cache :', error);
      }
    });
  }

  getCached(name) {
    return cacheObject[name];
  }

}

exports.Cache = new Cache(cacheList);
