

var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);


function fetchme(t){
return new Promise((resolve, reject) => {
connection.query("select * from users inner join pics on users.id = pics.user_id WHERE users.id = ? ",t, function(err, re) 
{

	resolve(re[0]);
})

})
}





 function getfinal(ids) {
  return new Promise(async (resolve, reject) => {
  	var z = 0;
  	 connection.query('USE ' + dbconfig.database);
    var final = [];
  	 var t = 0;
  	  while (z < ids.length)
      {
         t = ids[z];
         var topush = await fetchme(t);
        final.push(topush);
        z++;
      } 
      resolve(final);
    
  });
}

module.exports.getfinal =  getfinal;