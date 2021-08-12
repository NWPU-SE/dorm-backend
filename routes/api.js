const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const config = require('../config.json')

let connection;

function conn() {
  connection = mysql.createConnection({ host: config.db.host, user: config.db.user, password: config.db.password, database: config.db.database });

  //连接错误，2秒重试
  connection.connect(function (err, dat) {
    if (err) {
      console.log('error when connecting to db:', err);
      connection.destroy();
      setTimeout(handleError, 2000);
    }
  });

  connection.on('error', function (err) {
    console.log('db error', err);
    // 如果是连接断开，自动重新连接
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connection.destroy();
      conn();
    } else {
      throw err;
    }
  });
}

conn();

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] ||
  req.connection.remoteAddress ||
  req.socket.remoteAddress ||
  req.connection.socket.remoteAddress;
  return ip.split(':').pop()
}

/* GET home page. */
router.get('/dorm', function (req, res, next) {
  const { dorm_name, dorm_index, dorm_id } = req.query;
  if (!dorm_index || !dorm_name) {
    return res.sendStatus(400);
  }
  let sql;
  if(dorm_id && dorm_id != 0)
    sql = 'select dorm_name, dorm_index, dorm_id, message from dorm where `dorm_name`=? and `dorm_index`=? and `dorm_id`=?';
  else sql = 'select dorm_name, dorm_index, dorm_id, message from dorm where `dorm_name`=? and `dorm_index`=?';
  let sqldata = [dorm_name, dorm_index, dorm_id];
  connection.query(sql, sqldata, (err, dat) => {
    if (err) {
      return res.sendStatus(500);
    }
    else {
      res.json(dat);
    }
  })
});

router.post('/dorm', function (req, res, next) {
  const { dorm_name, dorm_index, dorm_id, message } = req.body;
  if (!dorm_index || !dorm_name || !message) {
    return res.sendStatus(400);
  }
  let sql = 'INSERT INTO `dorm`(`dorm_name`, `dorm_index`, `dorm_id`, `message`, `ip`) VALUES (?,?,?,?,?)';
  let sqldata = [dorm_name, dorm_index, dorm_id, message, getClientIp(req)];
  connection.query(sql, sqldata, (err, dat) => {
    if(err) return res.sendStatus(500);
    else return res.sendStatus(200);
  })
})

router.get('/class', function (req, res, next) {
  const { class_name, class_index } = req.query;
  if (!class_name || !class_index) {
    return res.sendStatus(400);
  }
  return res.sendStatus(404);
});

module.exports = router;
