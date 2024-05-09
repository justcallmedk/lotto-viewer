if(process.argv.length < 5) {
  throw new Error('usage : node app.js {db_host} {db_username} {db_password}');
}

const express = require('express');
const cors = require('cors');
const app = express();
const port = 6010;

const mysql = require('mysql');
const util = require('util');

const Cache = require('./cache');
const myCache = new Cache();

const PB_TYPE = 1;
const MM_TYPE = 2;

const SQL_GET_LAST_DRAW_DATE = 'SELECT draw_date FROM numbers WHERE type_id = ? ORDER BY draw_date DESC LIMIT 1';
const SQL_GET_NUMBERS = 'SELECT number, CAST(is_ball as INT) as is_ball, COUNT(number) as count FROM numbers WHERE type_id = ?';
const SQL_DRAW_DATE_FROM = ' AND draw_date >= ?';
const SQL_DRAW_DATE_TO = ' AND draw_date <= ?';
const SQL_ORDER_GROUP_BY_NUMBER = ' GROUP BY number, is_ball ORDER BY count';
const SQL_GET_MIN_MAX_DATE = 'SELECT MIN(draw_date) AS min, MAX(draw_date) AS max FROM numbers WHERE type_id = ?';

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

const getNumbers = async (type,fromDate,toDate) => {
  let sql = SQL_GET_NUMBERS;
  let params = [type];
  if(fromDate) {
    sql += SQL_DRAW_DATE_FROM;
    params.push(fromDate);
  }
  if(toDate) {
    sql += SQL_DRAW_DATE_TO;
    params.push(toDate);
  }
  sql += SQL_ORDER_GROUP_BY_NUMBER;

  let cached = undefined;
  if(!fromDate && !toDate) { //don't cache if date ranged, too many potential keys
    cached = myCache.getCache(sql,params);
  }
  if(cached) {
    return cached;
  }

  return await execute(cached,sql,params);
};

const corsOptions = { //localhost developement only
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
  if(!req.query.typeId) {
    res.status(400).send('Provide type ID!');
    return;
  }
  const ret = await getNumbers(req.query.typeId,req.query.fromDate,req.query.toDate);
  res.json(ret);
});

app.get('/min_max_date', async (req, res) => {
  if(!req.query.typeId) {
    res.status(400).send('Provide type ID!');
    return;
  }
  const ret = await getMixMaxDate(req.query.typeId);
  res.json(ret);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});