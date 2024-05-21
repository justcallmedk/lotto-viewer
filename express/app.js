if(process.argv.length < 5) {
  throw new Error('usage : node app.js {db_host} {db_username} {db_password}');
}

const express = require('express');
const cors = require('cors');
const app = express();
const port = 6010;

const mysql = require('mysql');
const util = require('util');

const debug = process.argv[5] === '--debug';
const Cache = require('./cache');
const myCache = new Cache(debug);


const PB_TYPE = 1;
const MM_TYPE = 2;

const LAST_RULE_UPDATE_DATE = {
  1 : '2015-10-04',
  2 : '2017-10-28'
};

//sql
const SQL_GET_LAST_DRAW_DATE = 'SELECT draw_date FROM numbers WHERE type_id = ? ORDER BY draw_date DESC LIMIT 1';
const SQL_GET_NUMBERS = 'SELECT number, CAST(is_ball as INT) as is_ball, COUNT(number) as count FROM numbers WHERE type_id = ?';
const SQL_DRAW_DATE_FROM = ' AND draw_date >= ?';
const SQL_DRAW_DATE_TO = ' AND draw_date <= ?';
const SQL_GROUP_BY_NUMBER = ' GROUP BY number, is_ball';
const SQL_ORDER_BY_COUNT = ' ORDER BY count';
const SQL_GET_DRAW_DATES = 'SELECT DISTINCT(draw_date), NULL, NULL FROM numbers WHERE type_id = ?';
const SQL_GET_MIN_MAX_DATE = 'SELECT MIN(draw_date) AS min, MAX(draw_date) AS max FROM numbers WHERE type_id = ?';
const SQL_GET_NUMBER_LAST_DRAWN = 'SELECT number, CAST(is_ball as INT) as is_ball, MAX(draw_date) as last_drawn FROM numbers WHERE type_id = ?';
const SQL_ORDER_BY_DATE = ' ORDER BY last_drawn';

//helpers
const connectDB = () => {
  const connection = mysql.createConnection({
    host     : process.argv[2],
    user     : process.argv[3],
    password : process.argv[4],
    database : 'lotto'
  });
  connection.connect();
  return connection;
};

const execute = async(cached,sql,params) => {
  const connection = connectDB();
  const query = util.promisify(connection.query).bind(connection);
  const data = await query(sql,params);
  if(cached === false) { //different from undefined (don't cache flag)
    myCache.updateCache(sql,params,data);
  }
  return data;
};
//end of helpers

const getLastDrawDate = async (type) => {
  const connection = connectDB();
  const query = util.promisify(connection.query).bind(connection);
  const rows = await query(SQL_GET_LAST_DRAW_DATE,type);
  return rows[0].draw_date.toISOString().split('T')[0];
};

const getMixMaxDate = async (type) => {
  const sql = SQL_GET_MIN_MAX_DATE;
  const params = [type];
  let cached = undefined;
  cached = myCache.getCache(sql,params);
  if(cached) {
    return cached;
  }

  return await execute(cached,sql,params);
};

const getNumbers = async (type,fromDate,toDate,isDefault) => {
  const sqls = {
    SQL_GET_NUMBERS : {
      sql : SQL_GET_NUMBERS,
      group_by : SQL_GROUP_BY_NUMBER,
      order_by : SQL_ORDER_BY_COUNT
    },
    SQL_GET_DRAW_DATES : {
      sql : SQL_GET_DRAW_DATES,
    },
    SQL_GET_NUMBER_LAST_DRAWN : {
      sql : SQL_GET_NUMBER_LAST_DRAWN,
      group_by : SQL_GROUP_BY_NUMBER,
      order_by : SQL_ORDER_BY_DATE
    }
  }
  let ret = {};
  for(key in sqls) {
    let ret_ = {};
    let sql = sqls[key].sql + SQL_DRAW_DATE_FROM;
    let params = [type,fromDate];
    if(!isDefault) {
      params.push(toDate);
      sql += SQL_DRAW_DATE_TO;
    }
    sql += sqls[key].group_by ? sqls[key].group_by : '';
    sql += sqls[key].order_by ? sqls[key].order_by : '';
    let cached = undefined;
    if(isDefault) { //don't cache if date ranged, too many potential keys
      cached = myCache.getCache(sql,params);
    }
    ret_ = cached ? cached : await execute(cached,sql,params);
    ret[key] = ret_;
  }
  return ret;
};

const corsOptions = { //localhost dev env only
  origin: 'http://localhost:3000'
}
app.use(cors(corsOptions));

app.get('/statuscheck', async (req, res) => {
  res.json({
    cacheDate : myCache.cacheDate ? myCache.cacheDate : 'N/A',
    pbLastDrawDate : await getLastDrawDate(PB_TYPE),
    mmLastDrawDate : await getLastDrawDate(MM_TYPE)
  });
});

app.get('/numbers', async (req, res) => {
  const typeId = req.query.typeId;
  if(!typeId) {
    res.status(400).send('Provide type ID!');
    return;
  }
  let fromDate = req.query.fromDate;
  let toDate = req.query.toDate;
  let isDefault = !fromDate && !toDate;
  if(isDefault) { //if no dates provided, use the last rule update date
    fromDate = LAST_RULE_UPDATE_DATE[typeId];
  }
  const ret = await getNumbers(typeId,fromDate,toDate,isDefault);
  res.json(ret);
});

app.get('/min_max_date', async (req, res) => {
  const typeId = req.query.typeId;
  if(!typeId) {
    res.status(400).send('Provide type ID!');
    return;
  }
  let ret = await getMixMaxDate(typeId);
  ret[0].last_rule_update = LAST_RULE_UPDATE_DATE[typeId];
  res.json(ret);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});