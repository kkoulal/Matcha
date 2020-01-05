var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function getreport5(reporter) {
  return new Promise(async (resolve, reject) => {
  	connection.query('USE ' + dbconfig.database);
    connection.query("select Count(*) as nb from report inner join users on users.id = report.reported where users.username = ?",reporter, function(err, re) 
    {
    	if(err)
    		reject(err);
    	else
    		resolve(re);
    });
  });
}

function logininsert(username) {
  return new Promise(async (resolve, reject) => {
    params = [username, username];
    connection.query('USE ' + dbconfig.database);
    connection.query("insert into login (user_id, username, connected) values ((select id from users where username like ?),(select username from users where username like ?), 1)",params, function(err, re) 
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

function loginupdate(username) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("update login set login_time = (now()), connected = 1 where user_id = (select id from users where username like ?)",username, function(err, re) 
    {
      if(err)
        reject(err);
      else
        resolve(re);
    });
  });
}

function checkexist(username) {
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

function getid(name) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select id from users where username = ?",name, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

module.exports.getid =  getid;
module.exports.logininsert =  logininsert;
module.exports.loginupdate =  loginupdate;
module.exports.checkexist =  checkexist;
module.exports.getreport5 =  getreport5;