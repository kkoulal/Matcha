require('dotenv').config();
var LocalStrategy = require("passport-local").Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);
const nodemailer = require('nodemailer');
var asynccontrol = require('./controlconfig.js')
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '1337matcha@gmail.com',
    pass: 'matcha000'
  }
});

connection.query('USE ' + dbconfig.database);

module.exports = function(passport) {
 passport.serializeUser(function(user, done){
  done(null, user.id);
});

 passport.deserializeUser(function(id, done){
  connection.query("SELECT * FROM users WHERE id = ? ", [id],
   function(err, rows){
    done(err, rows[0]);
  });
});
 function token() {
  return Math.random().toString(36).substr(2);
};

var token = token();

passport.use
(
  'local-signup',
  new LocalStrategy
  (
  {
    usernameField : 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done)
  {
    function escapeHtml(text) {
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };

      return text.replace(/[&<>"']/g, function(m) { return map[m]; });}
      function CheckValid(str){
        var re = /^\S<>()":'/;+$/g;
        return re.test(str);

      }
      var fname = escapeHtml(req.body.fname);
      var lname = escapeHtml(req.body.lname);
      var email = escapeHtml(req.body.email);
      var password = escapeHtml(password);
      var repassword = escapeHtml(req.body.repassword);
      var mailOptions = 
      {
        from: 'matcha@gmail.com',
        to: req.body.email,
        subject: 'Account confirmation',
        html: "<html><body><table width='100%' border='0' cellspacing='0' cellpadding='0'><tr><td align='center'><img style='display: block;margin-left: auto;margin-right: auto;width: 50%;user-select: none;'src='http://metalicasmudarra.es/wp-content/uploads/2017/11/cropped-logo-M-PNG.png'><a href=\"http://localhost:4000/verified?token=" + token +  "\">Verify Your Account</a></td></tr></table></body></html>"
      };
      if(username != undefined && fname != undefined && lname != undefined && email != undefined && password != undefined && repassword != undefined)
      {
        if(username == '' || fname == '' || lname == '' || email == '' || password == '' || repassword == '')
        {
          return done(null, false, {message: 'Errorddd'});
        }
        else if (username != "") {
          if ( /[^A-Za-z\d]/.test(username)) {
            return done(null, false, {message: 'Please enter only letter and numeric characters'});
          }
        }
        else if(password != repassword)
        {
          return done(null, false, {message: 'Password and Repassword must match'});
        }
        var strongRegex = RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");
        function IsEmail(email) {
          var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
          if (!regex.test(email)) {
            return false;
          } else {
            return true;
          }
        }
        if(!strongRegex.test(password))
        {
          return done(null, false, {message: 'Your password must be have at least 8 characters long, 1 number, 1 uppercase and 1 lowercase character'});
        }
        else if(!IsEmail(email))
        {
          return done(null, false, {message: 'Error'});
        }
        connection.query("SELECT * FROM users WHERE email = ? ", [email], function(err, rows)
        {
          if(err)
            return done(err);
          if(rows.length)
          {
            return done(null, false, {message: 'This email already taken'});
          }
          else
          {
            connection.query("SELECT * FROM users WHERE username = ? ", [username], function(err, rows)
            {
              if(err)
                return done(err);
              if(rows.length)
              {
                return done(null, false, {message: 'This username already taken'});
              }
              else
              {
                var newUserMysql = 
                {
                  username: username,
                  fname: fname,
                  lname: lname,
                  email: email,
                  password: bcrypt.hashSync(password, null, null)
                };
                transporter.sendMail(mailOptions, function(err, data)
                {
                  if (err) throw err;
                });
                var insertQuery = "INSERT INTO users (username, fname, lname, email, password, token) values (?, ?, ?, ?, ?, ?)";
                connection.query(insertQuery, [newUserMysql.username, newUserMysql.fname, newUserMysql.lname, newUserMysql.email, newUserMysql.password, token],function(err, rows)
                {
                  newUserMysql.id = rows.insertId;
                  return done(null, newUserMysql);
                });
              }
            });
          }
        });
      }
      else
        return done(null, false, {message: 'Error'});
    })
);

passport.use(
  'local-login',
  new LocalStrategy({
   usernameField : 'username',
   passwordField: 'password',
   passReqToCallback: true
 },
 async function(req, username, password, done)
 {
  var checkreport5 = await asynccontrol.getreport5(username);
  if (checkreport5[0].nb >= 20)
  {
    connection.query("delete from users, report, pics using users inner join report inner join pics on users.id = report.reported and report.reported = pics.user_id where users.username = ?", [username],function(err, rows)
    {
      return done(null, false, {message: 'Your account id has been deleted because of: "a lot of users report you"'});
    });
  }
  else
  {
    connection.query("SELECT * FROM users WHERE username = ? ", [username], async function(err, rows)
    {
      if(err)
        return done(err);
      if(!rows.length)
      {
        return done(null, false, {message: 'No User Found'});
      }
      if(!bcrypt.compareSync(password, rows[0].password))
        return done(null, false, {message: 'Wrong Password'});
      if(rows[0].verified != 1)
        return done(null, false, {message: 'Please verify your account'});
      var check = await asynccontrol.checkexist(username);
      if(check[0] != undefined)
        await asynccontrol.loginupdate(username);
      else
        await asynccontrol.logininsert(username);
      return done(null, rows[0]);
    });
  }
}
)
  );
};