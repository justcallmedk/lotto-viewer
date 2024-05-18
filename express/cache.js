module.exports = class Cache {
  constructor() {
    this.cache = {};
    this.cacheDate = undefined;
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
      //console.log('got cache for ' + cacheKey);
      return this.cache[cacheKey];
    }
    return false;
  }

  updateCache (sql,params,data) {
    const cacheKey = this.getCacheKey(sql,params);
    this.cacheDate = this.getToday();
    //console.log('updated cache for ' + cacheKey);
    this.cache[cacheKey] = data;
  }
}