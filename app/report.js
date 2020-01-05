var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function getreport(reporter) {
  return new Promise(async (resolve, reject) => {
  	connection.query('USE ' + dbconfig.database);
    connection.query("select * from report where reporter = ?",reporter, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

module.exports.getreport =  getreport;