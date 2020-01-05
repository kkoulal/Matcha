var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function checkpic(user) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select picture from pics where user_id = ?",user, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

function checkfull(id) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("SELECT * FROM users WHERE id = ? ",id, function(err, re) 
    {
      resolve(re);
    });
  });
}

function checklogin(username){
    return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from login where user_id = (select id from users where username like ?) and connected = 1",username, function(err, re) 
    {
      if(err)
        reject(err);
      else
      {
        resolve(re);

      }

    });
  });
}

function checklogout(username){
    return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from login where user_id = (select id from users where username like ?)",username, function(err, re) 
    {
      if(err)
        reject(err);
      else
      {
        resolve(re);

      }

    });
  });
}

function checkuserexist(id){
    return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select id from users where id = ?",id, function(err, re) 
    {
      if(err)
        reject(err);
      else
      {
        resolve(re);

      }

    });
  });
}

function getowntag(id){
    return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select tag from users where id = ?",id, function(err, re) 
    {
      if(err)
        reject(err);
      else
      {
        resolve(re);

      }

    });
  });
}

function insertpic(id){
    return new Promise(async (resolve, reject) => {
    params = [id, 'img/robot.png'];
    connection.query('USE ' + dbconfig.database);
    connection.query("insert into pics (user_id, picture, profilepicid) values(?, ?, 1)",params, function(err, re) 
    {
      if(err)
        reject(err);
      else
      {
        resolve(re);

      }

    });
  });
}

module.exports.insertpic = insertpic;
module.exports.getowntag = getowntag;
module.exports.checkuserexist = checkuserexist;
module.exports.checklogin = checklogin;
module.exports.checklogout = checklogout;
module.exports.checkfull =  checkfull;
module.exports.checkpic =  checkpic;