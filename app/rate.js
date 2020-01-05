var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function getrate(idsearch, iduser) {
  return new Promise(async (resolve, reject) => {
    params = [idsearch, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from rates where user_id = ? and rater_id = ?",params, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

module.exports.getrate =  getrate;