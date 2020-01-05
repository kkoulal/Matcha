var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

function notiflike(iduser, idsearch) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    params = [iduser, idsearch,iduser, idsearch];
    connection.query("select * from block where (blocked = ? and blocker = ?) OR (blocker = ? and blocked = ?)",params, function(err, resu) 
    {
      if(resu.length == 0)
      {
        connection.query('USE ' + dbconfig.database);
        params = [iduser, idsearch];
        connection.query("insert into notif (user_send, user_receive, jomla) values(?, ?, ' likes you')",params, function(err, re) 
        {
          if(err)
            reject(err);
          else
            resolve(0);
        });
      }
      else resolve(0);
    });
  });
}

function notifmatch(iduser, idsearch) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    params = [iduser, idsearch, iduser, idsearch];
    connection.query("select * from block where (blocked = ? and blocker = ?) OR (blocker = ? and blocked = ?)",params, function(err, resu) 
    {
     if(resu.length == 0)
     {
      connection.query('USE ' + dbconfig.database);
      params = [iduser, idsearch];
      connection.query("insert into notif (user_send, user_receive, jomla) values(?, ?, ' and you can have babies now!')",params, function(err, re) 
      {
        if(err)
          reject(err);
         resolve(0);
    });
    }
    else resolve(0);
  });
  });
}

function notifmsg(iduser, idsearch) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    params = [iduser, idsearch, iduser, idsearch];
    connection.query("select * from block where (blocked = ? and blocker = ?) OR (blocker = ? and blocked = ?)",params, function(err, resu) 
    {
     if(resu.length == 0)
     {
      connection.query('USE ' + dbconfig.database);
      params = [iduser, idsearch];
      connection.query("insert into notif (user_send, user_receive, jomla) values(?, ?, ' sent message to you')",params, function(err, re) 
      {
        if(err)
          reject(err);
      });
    }
  });
  });
}

function notifunlike(iduser, idsearch) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    params = [iduser, idsearch, iduser, idsearch];
    connection.query("select * from block where (blocked = ? and blocker = ?) OR (blocker = ? and blocked = ?)",params, function(err, resu) 
    {
     if(resu.length == 0)
     {
       connection.query('USE ' + dbconfig.database);
        params = [iduser, idsearch];
      connection.query("insert into notif (user_send, user_receive, jomla) values(?, ?, ' hates you')",params, function(err, re) 
      {
      if(err)
        reject(err);
      else
     resolve(0);
    });
    }
    else resolve(0);
  });
  });
}

function notifvisit(iduser, idsearch) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    params = [iduser, idsearch, iduser, idsearch];
    connection.query("select * from block where (blocked = ? and blocker = ?) OR (blocker = ? and blocked = ?)",params, function(err, resu) 
    {
     if(resu.length == 0)
     {
      connection.query('USE ' + dbconfig.database);
      params = [iduser, idsearch];
      connection.query("insert into notif (user_send, user_receive, jomla) values(?, ?, ' visited you')",params, function(err, re) 
      {
        if(err)
          reject(err);
        else
          resolve(0);
      });
    }
    else resolve(0);
  });
  });
}

function shownotif(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select *, CONCAT(DATE_FORMAT(created_at, '%Y-%m-%d '), DATE_FORMAT(DATE_ADD(created_at, interval 1 hour), '%h:'), DATE_FORMAT(created_at, '%i:%S:%p')) as datefield from notif inner join users on users.id = notif.user_send where user_receive = ? and jomla NOT LIKE ' sent message to you' order by datefield desc",iduser, function(err, result) 
    {
        resolve(result);
      });
  });
}

  function showmessage(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select *, CONCAT(DATE_FORMAT(created_at, '%Y-%m-%d '), DATE_FORMAT(DATE_ADD(created_at, interval 1 hour), '%h:'), DATE_FORMAT(created_at, '%i:%S:%p')) as datefield from notif inner join users on users.id = notif.user_send where user_receive = ? and jomla like ' sent message to you' order by datefield desc",iduser, function(err, result) 
    {
        resolve(result);
      });
  });
}

  function showall(iduser) {
  return new Promise(async (resolve, reject) => {
    params = [iduser, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("select CONCAT(DATE_FORMAT(created_at, '%Y-%m-%d '), DATE_FORMAT(DATE_ADD(created_at, interval 1 hour), '%h:'), DATE_FORMAT(created_at, '%i:%S:%p')) as datefield, users.username, notif.user_receive, REPLACE(notif.jomla, 'you', users.username) as jomla from notif inner join users on users.id = notif.user_receive where notif.user_send = ? and notif.user_receive != ?",params, function(err, result) 
    {
        resolve(result);
      });
  });
}

function showblocked(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from block inner join users on users.id = block.blocked where blocker = ?",iduser, function(err, result) 
    {
        resolve(result);
      });
  });
}

function removeblocked(iduser, blocked) {
  return new Promise(async (resolve, reject) => {
    params = [iduser, blocked];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from block where blocker = ? and blocked = ?",params, function(err, result) 
    {
      if(err)
        reject(err);
      else
        resolve(1);
      });
  });
}

function upditenotif(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("update notif set readit = 0 where user_receive = ? and jomla NOT LIKE ' sent message to you'",iduser, function(err, re) 
    {
      if (err) throw err;
        resolve(re);
    });
  });
}

 function upditemessage(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("update notif set readit = 0 where user_receive = ? and jomla = ' sent message to you'",iduser, function(err, re) 
    {
      if (err) throw err;
        resolve(re);
    });
  });
}

function therisnotif(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from notif where user_receive = ? and readit = 1 and jomla NOT LIKE ' sent message to you'",iduser, function(err, result) 
    {
        resolve(result);
      });
  });
}

  function therismessage(iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from notif where user_receive = ? and readit = 1 and jomla  LIKE ' sent message to you'",iduser, function(err, result) 
    {
        resolve(result);
      });
  });
}

function getchat(token) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from chat where token = ?",token, function(err, result) 
    {
        resolve(result);
      });
  });
}


module.exports.therismessage =  therismessage;
module.exports.therisnotif =  therisnotif;
module.exports.getchat =  getchat;
module.exports.upditenotif =  upditenotif; 
module.exports.upditemessage =  upditemessage;
module.exports.showall =  showall;
module.exports.showmessage =  showmessage;
module.exports.shownotif =  shownotif;
module.exports.showblocked =  showblocked;
module.exports.removeblocked =  removeblocked;
module.exports.notifvisit =  notifvisit;
module.exports.notifunlike =  notifunlike;
module.exports.notifmsg =  notifmsg;
module.exports.notifmatch =  notifmatch;
module.exports.notiflike =  notiflike;