var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

function logoutupdate(id) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("update login set logout_time = (now()), connected = 0 where user_id = ?",id, function(err, re) 
    {
      if(err)
        reject(err);
      else
        resolve(re);
    });
  });
}

 function getlogout(id) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select *, CONCAT(DATE_FORMAT(logout_time, '%Y-%m-%d '), DATE_FORMAT(DATE_ADD(logout_time, interval 1 hour), '%H:'), DATE_FORMAT(logout_time, '%i:%S %p')) as datefield from login where user_id = ?",id, function(err, re) 
    {
      resolve(re);
    });
  });
}

module.exports.getlogout =  getlogout;
module.exports.logoutupdate =  logoutupdate;