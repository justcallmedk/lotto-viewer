module.exports = class Cache {
  constructor(debug) {
    this.cache = {};
    this.cacheDate = undefined;
    this.debug = debug;
    this.MAX_CACHE_SIZE = 50;
  }

  getToday() {
    return new Date().toISOString().split('T')[0];
  }

  getCacheKey(sql,params) {
    return sql + ' ' + params.join('_');
  }

  getCache (sql,params) {
    const cacheKey = this.getCacheKey(sql,params);
    const today = this.getToday();
    if(this.cacheDate && this.cacheDate === today && this.cache[cacheKey]) {
      if(this.debug)
        console.log('got cache for ' + cacheKey);
      return this.cache[cacheKey];
    }
    return false;
  }

  updateCache (sql,params,data) {
    if(Object.keys(this.cache).length > this.MAX_CACHE_SIZE) { //flush
      this.cache = {};
    }
    const cacheKey = this.getCacheKey(sql,params);
    this.cacheDate = this.getToday();
    if(this.debug)
      console.log('updated cache for ' + cacheKey);
    this.cache[cacheKey] = data;
  }
}