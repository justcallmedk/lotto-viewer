module.exports = class Cache {
  constructor(debug) {
    this.cache = {};
    this.cacheDate = undefined;
    this.debug = debug;
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
    const cacheKey = this.getCacheKey(sql,params);
    this.cacheDate = this.getToday();
    if(this.debug)
      console.log('updated cache for ' + cacheKey);
    this.cache[cacheKey] = data;
  }
}