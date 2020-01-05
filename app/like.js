var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);

 function gettype(user, liker) {
  return new Promise(async (resolve, reject) => {
    params = [user, liker];
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from likes where user_id = ? and liker_id = ?",params, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

 function getlikeme(iduser, idsearch) {
  return new Promise(async (resolve, reject) => {
    params = [iduser, idsearch];
    connection.query('USE ' + dbconfig.database);
    connection.query("select count(*) AS nb from likes where user_id = ? and liker_id = ? and likenum = 1",params, function(err, re) 
    {
      resolve(re[0].nb);
    });
  });
}

function getmatcho(idsearch, iduser) {
  return new Promise(async (resolve, reject) => {
    params = [idsearch, idsearch, iduser, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("select match1, match2 from matcho where (match1 = ? or match2 = ?) and (match1 = ? or match2 = ?)",params, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

 
 function helikesyou(idsearch, iduser) {
  return new Promise(async (resolve, reject) => {
    params = [iduser, idsearch];
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from likes where user_id = ? and liker_id = ? and likenum = 1",params, function(err, re) 
    {
      resolve(re[0]);
    });
  });
}

 function showchatlist(iduser) {
  return new Promise(async (resolve, reject) => {
    params = [iduser, iduser, iduser, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("select users.id, users.username, matcho.token from users, matcho where users.id in (select match2 from matcho where match1 = ? UNION select match1 from matcho where match2 = ?) and (users.id = matcho.match2 AND matcho.match1 = ?) or (users.id = matcho.match1 and matcho.match2 = ?)",params, function(err, re) 
    {
      if (err) throw err;
        resolve(re);
    });
  });
}

function updatelike(idsearch, iduser) {
  return new Promise(async (resolve, reject) => {
    params = [idsearch, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("update likes set likenum = 1 where user_id = ? and liker_id = ?",params, function(err, result0) 
      {
        resolve(result0);
      });
  });
}

 function insertchat(sender, receiver, msg, token) {
  return new Promise(async (resolve, reject) => {
    params = [sender, receiver, msg, token];
    connection.query('USE ' + dbconfig.database);
    connection.query("insert into chat (sender, receiver, msg, token) values(?,?,?,?)",params, function(err, re) 
    {
      if(err)
        reject(err)
      else
        resolve(1);
    });
  });
}

module.exports.insertchat =  insertchat;
module.exports.updatelike =  updatelike;
module.exports.showchatlist =  showchatlist;
module.exports.getmatcho =  getmatcho;
module.exports.helikesyou =  helikesyou;
module.exports.getlikeme =  getlikeme;
module.exports.gettype =  gettype;