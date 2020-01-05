var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function usertaken(username, id) {
  return new Promise(async (resolve, reject) => {
    params = [username, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from users where username = ? and id != ?",params, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

module.exports.usertaken =  usertaken;