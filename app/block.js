var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function getblock(blocked, blocker) {
  return new Promise(async (resolve, reject) => {
  	params = [blocked, blocker, blocked, blocker];
  	connection.query('USE ' + dbconfig.database);
    connection.query("select * from block where (blocked = ? and blocker = ?) OR (blocker  = ? and blocked = ?)",params, function(err, re) 
    {
     	if(err)
     		reject(err)
     	if(re.length != 0)
     		resolve(1)
     	else
     		resolve(0);
    });
  });
}

function getblockedids(blocker) {
  return new Promise(async (resolve, reject) => {
    params = [blocker, blocker];
    connection.query('USE ' + dbconfig.database);
    connection.query("SELECT blocked FROM `block` WHERE blocker = ? UNION SELECT blocker from `block` WHERE blocked = ?",params, function(err, re) 
    {
      resolve(re);
    });
  });
}
module.exports.getblockedids =  getblockedids;
module.exports.getblock =  getblock;
