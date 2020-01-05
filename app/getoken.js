var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function getoken(idsearch, iduser) {
  return new Promise(async (resolve, reject) => {
  	connection.query('USE ' + dbconfig.database);
    params = [idsearch, idsearch, iduser, iduser];
    connection.query("select token from matcho where (match1 = ? or match2 = ?) and (match1 = ? or match2 = ?)",params, function(err, re) 
    {
      if(err)
        reject(err);
      else
      resolve(re[0]);
    });
  });
}

function getoken2(token) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from matcho where token = ?",token, function(err, re) 
    {
      if(err)
        reject(err);
      else
      resolve(re[0]);
    });
  });
}

 function getoken3(idsearch, iduser) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    params = [idsearch, idsearch, iduser, iduser];
    connection.query("select token from matcho where (match1 = ? or match2 = ?) and (match1 = ? or match2 = ?)",params, function(err, re) 
    {
      if(err)
        reject(err);
      else
      resolve(re);
    });
  });
}

function getag() {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("select DISTINCT tag from users", function(err, re) 
    {
      if(err)
        reject(err);
      else
      resolve(re);
    });
  });
}

module.exports.getoken =  getoken;
module.exports.getoken2 =  getoken2;
module.exports.getoken3 =  getoken3;
module.exports.getag =  getag;