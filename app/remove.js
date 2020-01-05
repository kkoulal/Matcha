var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function deleteuser(id) {
  return new Promise(async (resolve, reject) => {
  	connection.query('USE ' + dbconfig.database);
    connection.query("delete from users where id = ?",id, function(err, re) 
    {
     	if(err)
     		reject(err)
     	else
     		resolve(1);
    });
  });
}

 function deletepics(id) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from pics where user_id = ?",id, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

 function deletematch(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from matcho where match1 = ? or match2 = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deletelogin(id) {
  return new Promise(async (resolve, reject) => {
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from login where user_id = ?",id, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deletelikes(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from likes where user_id = ? or liker_id = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deletechat(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from chat where sender = ? or receiver = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deleteblock(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from block where blocked = ? or blocker = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deletenotif(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from notif where user_send = ? or user_receive = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deleterates(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from rates where user_id = ? or rater_id = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

function deletereport(id) {
  return new Promise(async (resolve, reject) => {
    params = [id, id];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from report where reported = ? or reporter = ?",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

module.exports.deleteuser =  deleteuser;
module.exports.deletepics =  deletepics;
module.exports.deletematch =  deletematch;
module.exports.deletelogin =  deletelogin;
module.exports.deletelikes =  deletelikes;
module.exports.deletechat =  deletechat;
module.exports.deleteblock =  deleteblock;
module.exports.deletenotif =  deletenotif;
module.exports.deleterates =  deleterates;
module.exports.deletereport =  deletereport;