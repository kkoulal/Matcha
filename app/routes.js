var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);
const nodemailer = require('nodemailer');
var bcrypt = require('bcrypt-nodejs');
var upload = require("express-fileupload");
const emailRegex = require('email-regex');
const fs = require('fs');
const decodeEntities = require('decode-entities');
var retext = require('retext')
var emoji = require('retext-emoji')
var mmm = require('mmmagic'),
Magic = mmm.Magic;
var sizeOf = require('image-size');
var magic = new Magic(mmm.MAGIC_MIME_TYPE);

var asyncnotif = require('./notif.js')
var asyncblock = require('./block.js')
var asynccheck = require('./check.js')
var asynclike = require('./like.js')
var asynclogout = require('./logout.js')
var asyncremove = require('./remove.js')
var async = require('./control.js')
var asyncrate = require('./rate.js')
var asynccheckreport = require('./report.js')
var asyncgetoken = require('./getoken.js')
var asyncusertaken = require('./usertaken.js')
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '1337matcha@gmail.com',
    pass: 'matcha000'
  }
});

module.exports = function(app, passport) {

  app.get('/', function(req, res){
    res.render('index.ejs',{ message: req.flash('error')});
  });

  app.get('/newpsswd', async function(req, res){
    if(typeof req.user == 'undefined' || req.query.forgetoken)
     res.render('newpsswd.ejs',{ message: req.flash('error')});
   else
   {
    if (typeof req.user != 'undefined')
      {var islog = await asynccheck.checklogout(req.user.username);

        if(typeof islog[0] == 'undefined')
        {
         res.render('login.ejs',{ message: req.flash('error')});
       }
       else if(islog[0].connected == 1)
        res.redirect('/main');
    }

    else
      res.redirect('/main');
  }


});
  app.post('/newpsswd', function(req, res){
    var password = req.body.password;
    var repassword = req.body.repassword;
    var message;
    var forgetoken = req.query.forgetoken;
    var strongRegex = RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");
    var cripassword = bcrypt.hashSync(password, null, null);
    if(req.body.password == undefined || req.body.repassword == undefined)
    {
      message = "Please don't modify inspect elements";
      res.render('newpsswd.ejs',{ message: message});
    }
    else if(password != repassword)
    {
     message = "Password and Repassword must match";
     res.render('newpsswd.ejs',{ message: message});
   }
   else if (password == '' || repassword == '')
   {
    message = "Please fill in all the fields";
    res.render('newpsswd.ejs',{ message: message});
  }
  else if(!strongRegex.test(password)){
    message = 'Your password must be have at least 8 characters long, 1 number, 1 uppercase and 1 lowercase character';
    res.render('newpsswd.ejs',{ message: message});
  }
  else if(password == repassword){

    connection.query('USE ' + dbconfig.database);
    var params = [cripassword, forgetoken];
    connection.query("UPDATE users SET password = ? WHERE forgetoken = ?", params, function(err,res){
      if(err) throw err;
    });
    res.redirect('/login');
  }
});

  app.get('/forget', async function(req, res){
   res.render('forget.ejs',{ message: req.flash('error')});
 });
  app.post('/forget', function(req, res){
    var message = '';
    var email = req.body.email;
    var regemail = RegExp("/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/");
    function IsEmail(email) {
      var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      if (!regex.test(email)) {
        return false;
      } else {
        return true;
      }
    }
    connection.query('USE ' + dbconfig.database);
    if (email == '')
    {
      message = 'Please write your email';
      res.render('forget.ejs',{message: message, user:req.user});
    }
    else if (!req.body.email)
    {
      message = 'Please don\'t change aspect element';
      res.render('forget.ejs',{message: message, user:req.user});
    }
    else if(!IsEmail(email))
    {
      message = 'Please write a valid email';
      res.render('forget.ejs',{message: message, user:req.user});
    }
    else
    {
      if(connection.query("SELECT * FROM users WHERE email = ?", [email]))
      {
        function token() 
        {
          return Math.random().toString(36).substr(2);
        }
        var forgetoken = token();
        var mailOptions = 
        {
          from: 'matcha@gmail.com',
          to: req.body.email,
          subject: 'Reset Password',
          html: "<html><body><table width='100%' border='0' cellspacing='0' cellpadding='0'><tr><td align='center'><img style='display: block;margin-left: auto;margin-right: auto;width: 50%;user-select: none;'src='http://metalicasmudarra.es/wp-content/uploads/2017/11/cropped-logo-M-PNG.png'><a style='color:red;align=center;' href=\"http://localhost:4000/newpsswd?forgetoken=" + forgetoken +  "\">Reset Your Account</a></td></tr></table></body></html>"
        }
        transporter.sendMail(mailOptions, function(err, data)
        {
          if (err) return err;
        });
        var params = [forgetoken, email];
        connection.query("UPDATE users SET forgetoken = ? WHERE email = ?", params, function(err,res)
        {
          if(err) throw err;
        });
        res.redirect('/reset');
      }
    }
  });


  app.get('/verified', async function(req, res){
    if(typeof req.user == 'undefined' || req.query.token)
    {
      var token = req.query.token;
      connection.query('USE ' + dbconfig.database);
      connection.query("UPDATE users SET verified = '1' WHERE token = ?", [token]);
      res.render('verified.ejs');
    }
    else
    {
      var islog = await asynccheck.checklogout(req.user.username);
      if(islog[0].connected == 0 || typeof islog[0] == 'undefined')
      {
        res.redirect('/verified');
      }
      else
        res.redirect('/main');
    }
    
    
    
  });

  app.get('/login', async function(req, res){
    if(typeof req.user == 'undefined')
      res.render('login.ejs', {message: req.flash('error')});
    else if (typeof req.user != 'undefined')
    {
      var islog = await asynccheck.checklogout(req.user.username);
      if(typeof islog[0] == 'undefined')
       res.render('login.ejs', {message: req.flash('error')});
     else if(islog[0] != 'undefined')
       res.redirect('/main');
   }
 });
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }),
  function(req, res){
   if(req.body.remember){
    req.session.cookie.maxAge = 1000 * 60 * 3;
  }else{
    req.session.cookie.expires = false;
  }
  res.redirect('/');
});

  app.get('/signup', async function(req, res){
    if(typeof req.user == 'undefined')
      res.render('signup.ejs', {message: req.flash('error')});
    else if (typeof req.user != 'undefined')
    {
      var islog = await asynccheck.checklogout(req.user.username);
      if(typeof islog[0] == 'undefined')
       res.render('signup.ejs', {message: req.flash('error')});
     else if(islog[0] != 'undefined')
       res.redirect('/main');
   }

 });
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/confirmation',
    failureRedirect: '/signup',
    failureFlash: true
  }));

  app.get('/profile', isLoggedIn, async function(req, res){
   var islog = await asynccheck.checklogin(req.user.username);
   if(typeof islog[0] != 'undefined')
   {
    var id = req.user.id;
    connection.query('USE ' + dbconfig.database);
    connection.query('SELECT * FROM users WHERE id = ? ',id, async function(err, result){
      if(result[0].bio == '' || result[0].bio == null)
      {
        var thereis = await asyncnotif.therisnotif(id);
        res.render('profile.ejs', {message: req.flash('error'),user:req.user, data2:thereis});
      }
      else
      {
        res.redirect('main');
      }
    });
  }
  else
    res.redirect('/login');
});
  app.post('/profile', isLoggedIn, async function(req, res){
  //check if the user doesn't fill one of the obligatory fields
  if (req.body.gender == '' || req.body.sp == '' || req.body.bio == '' || req.body.tagtoimport == '' || req.body.age == '')
  {
    message = "Please Fill in all the fields";
  }
  //check if the user change some names in the inspect element
  else if(!req.body.bio || !req.body.gender || !req.body.sp || !req.body.tagtoimport || !req.body.age)
  {
    message = "Please don't modify inspect element";
  }
  else if(!parseInt(req.body.age))
  {
    message = "Please make sure that the age inserted is correct";
  }
  else if(req.body.age < 14 || req.body.age > 100){
    message = "Please enter a valid age between 14 and 100 Y.O";
  }
  else
  {
    var lat = req.body.lat;
    var lon = req.body.lon;
    var bio = req.body.bio.trim();
    var message = '';
    var gender = req.body.gender.trim();
    var sp = req.body.sp.trim();
    var id = req.user.id;
    var tag = req.body.tagtoimport.trim();
    var geouser = req.body.cor;
    var geouser2 = geouser.split(",");
    var age = req.body.age;
    if (req.body.cor != '')
    {
      if (geouser2.length == 2)
      {
        geouser2[0] = parseFloat(geouser2[0]);
        geouser2[1] = parseFloat(geouser2[1]);
      }
      if (geouser2[1] < -90 || geouser2[1] > 90 || geouser2[0] < -180 || geouser2[0] > 180)
      {  
        message = "Please write your real position coordinates";
      }else{
        connection.query('USE ' + dbconfig.database);
        var params = [gender, sp, bio, tag, geouser2[0], geouser2[1], age, id];
        connection.query("UPDATE users SET gender = ?, sp = ?, bio = ?, tag = ?, lat = ?, lon = ?, age = ? WHERE id = ?", params, function(err,res){
          if(err) throw err;
        });
      }
    }
    else
    {
      lat = parseFloat(lat);
      lon = parseFloat(lon);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
      {  
        message = "Please don't modify location in inspect element";
      } 
      else{
        if (bio.length > 500 || tag.length > 20)
        {
         message = "finawa ghadi?";
       }
       else
       {
        connection.query('USE ' + dbconfig.database);
        var params = [gender, sp, bio, tag, lat, lon, age, id];
        connection.query("UPDATE users SET gender = ?, sp = ?, bio = ?, tag = ?, lat = ?, lon = ?, age = ? WHERE id = ?", params, function(err,res){
          if(err) throw err;
        });
      }
    }
  }
  if ((lat == '' || lon == '') && req.body.cor == '')
  {
    message = "Error";
  } 
}
if(message == '')
  res.redirect('editprofilepic');
else
{
  var thereismsg = await asyncnotif.therismessage(id);
  var thereis = await asyncnotif.therisnotif(id);
  res.render('profile.ejs',{ user: id, user:req.user, message: message, data2: thereis, data6: thereismsg});
}
});

  app.get('/editprofile', isLoggedIn, async function(req, res){
    var islog = await asynccheck.checklogin(req.user.username);
    if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
    {
      var id = req.user.id;
      var result = await asynccheck.checkfull(id);
      if(result[0].bio == '' || result[0].bio == null)
      {
        res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
      }
      var remo = req.body.remove;
      var id = req.user.id;
      var message = '';
      connection.query('USE ' + dbconfig.database);
      connection.query('SELECT * FROM users WHERE id = ?',id, async function(err, result)
      {
        result[0].tag = result[0].tag.split(" ,");
        result[0].tag = result[0].tag.join(', ');
        result[0].tag = result[0].tag.split(",");
        var results = result;
        var thereismsg = await asyncnotif.therismessage(id);
        var thereis = await asyncnotif.therisnotif(id);
        res.render('editprofile.ejs',{data : results,data6:thereismsg, data2: thereis, message : message,user: id, user:req.user, data4: id});
      }); 
    }
    else
      res.redirect('/login');
  });
  app.post('/editprofile', isLoggedIn, async function(req, res){
    var id = req.user.id;
    var message = '';
    var age = req.body.age;
    var username = req.body.username.trim();
    var fname = req.body.fname.trim();
    var lname = req.body.lname.trim();
    var email = req.body.email.trim();
    var password = req.body.password.trim();
    var bio = req.body.bio.trim();
    var gender = req.body.gender;
    var sp = req.body.sp;
    var tag = req.body.tagtoimport.trim();
    var geo = req.body.cor;
    var geouser = req.body.cor;
    var geouser2 = geouser.split(",");
    var strongRegex = RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");
    var regemail = RegExp("/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/");
    function IsEmail(email) {
      var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      if (!regex.test(email)) {
        return false;
      } else {
        return true;
      }
    }

    var taken = await asyncusertaken.usertaken(username, id);
    if (password != '')
    {
      if(age == '' || username == '' || fname == '' || lname == '' || email == '' || bio == '' || tag == '')
        message = 'Please fill all the fields';
      else if(!strongRegex.test(password))
      {
        message = "Your password must be have at least 8 characters long, 1 number, 1 uppercase and 1 lowercase character";
      }
      else if(!IsEmail(email))
      {
        message = "Please enter a valid email";
      }
      else if (bio.length > 500 || tag.length > 1000)
      {
        message = "finawa ghadi?";
      }
      else if(!parseInt(age))
      {
        message = "Please make sure that the age inserted is correct";
      }
      else if(age < 14 || age > 100){
        message = "Please enter a valid age between 14 and 100 Y.O";
      }
      else if (geouser2.length != 2 || isNaN(geouser2[0]) && isNaN(geouser2[1]) || geouser2[1] < -90 || geouser2[1] > 90 || geouser2[0] < -180 || geouser2[0] > 180)
      {  
        message = "Please write your real position coordinates";
      }
      else if (taken)
      {
        message = "the new username is already taken";
      }
      else
      {
        if (bio.length > 40000 || fname.length > 100 || lname.length > 100 || email.length > 100 || password.length > 100 || tag.length > 100)
        {
         message = "finawa ghadi?";
       }
       else
       {
        geouser2[0] = parseFloat(geouser2[0]);
        geouser2[1] = parseFloat(geouser2[1]);
        connection.query('USE ' + dbconfig.database);
        password = bcrypt.hashSync(password, null, null);
        var params = [age, username, fname, lname, email, password, gender, sp, bio, geouser2[0], geouser2[1], tag, id];
        connection.query("UPDATE users SET age = ?, username = ?, fname = ?, lname = ?, email = ?, password = ?, gender = ?, sp = ?, bio = ?, lat = ?, lon = ?, tag = ? WHERE id = ?", params, function(err,res){
          if(err) throw err;
        });
      }
    }
  }
  else
  {
    if(age == '' || username == '' || fname == '' || lname == '' || email == '' || bio == '' || tag == '')
      message = 'Please fill all the fields';
    else if(!IsEmail(email))
    {
      message = "Please enter a valid email";
    }
    else if (bio.length > 500 || tag.length > 20)
    {
      message = "finawa ghadi?";
    }
    else if(!parseInt(age))
      {
        message = "Please make sure that the age inserted is correct";
      }
      else if(age < 14 || age > 100){
        message = "Please enter a valid age between 14 and 100 Y.O";
      }
    else if (geouser2.length != 2 || isNaN(geouser2[0]) && isNaN(geouser2[1]) ||  geouser2[1] < -90 || geouser2[1] > 90 || geouser2[0] < -180 || geouser2[0] > 180)
    {  
      message = "Please write your real position coordinates";
    }
    else if (taken)
    {
      message = "the new username is already taken";
    }
    else
    {
      if (bio.length > 40000 || fname.length > 100 || lname.length > 100 || email.length > 100 || password.length > 100 || tag.length > 100)
      {
       message = "finawa ghadi?";
     }
     else
     {
      geouser2[0] = parseFloat(geouser2[0]);
      geouser2[1] = parseFloat(geouser2[1]);
      connection.query('USE ' + dbconfig.database);
      var params = [age, username, fname, lname, email, gender, sp, bio, geouser2[0], geouser2[1], tag, id];
      connection.query("UPDATE users SET age = ?, username = ?, fname = ?, lname = ?, email = ?, gender = ?, sp = ?, bio = ?, lat = ?, lon = ?, tag = ? WHERE id = ?", params, function(err,res)
      {
        if(err) throw err;
      });
    }
  }
}
connection.query('USE ' + dbconfig.database);
connection.query('SELECT * FROM users WHERE id  = ?',id, async function(err, result)
{
  result[0].tag = result[0].tag.split(" ,");
  result[0].tag = result[0].tag.join(', ');
  result[0].tag = result[0].tag.split(",");
  var results = result;
  if(message == '')
    res.redirect('editprofilepic');
  else
  {
    var thereismsg = await asyncnotif.therismessage(id);
    var thereis = await asyncnotif.therisnotif(id);
    res.render('editprofile.ejs',{user: id, user:req.user, data : results,data6:thereismsg, data2: thereis, message : message});
  }
}); 
});

app.get('/editprofilepic', isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
  {
    var id = req.user.id;
    var result = await asynccheck.checkfull(id);
    if(result[0].bio == '' || result[0].bio == null)
    {
      res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
    }
    var id = req.user.id;
    connection.query('USE ' + dbconfig.database);
    connection.query('SELECT * FROM pics WHERE user_id = ?',id, async function(err, result)
    {
      var results = result;
      var path = 'img/robot.png';
      var thereismsg = await asyncnotif.therismessage(id);
      var thereis = await asyncnotif.therisnotif(id);
      return res.render('editprofilepic.ejs', {message: req.flash('error'),user:req.user,data6:thereismsg, data2: thereis, data: results, user: id});
    });
  }
  else
    res.redirect('/login');
});
app.post('/editprofilepic', isLoggedIn, function(req, res) {
  var picture = req.files;
  var remove = req.body.remove;
  var choose = req.body.choose;
  var id = req.user.id;
  let tosend = "";
  if (remove != '') 
  {
    connection.query('USE ' + dbconfig.database);
    connection.query("DELETE FROM pics WHERE id = ? ", remove, function(err, res) 
    {
      if (err) throw err;
      tosend = 7;
      connection.query('USE ' + dbconfig.database);
      connection.query('SELECT * FROM pics WHERE user_id = ?',id, function(err, result) 
      {
        var results = result;
        var path = 'img/robot.png';
        if (typeof results[0] == 'undefined') 
        {
          let gal = "";
          for (var i = 0; i < 5; i++)
          {
            gal = gal + '<div class="avatar-upload"><div class="avatar-preview"><img id="imagePreview" src="img/robot.png"></div></div>';
          }
          tosend = gal
          sendData(gal);
        } 
        else 
        {
          let gal = "";
          var i = 0;
          results.forEach(el => {
            gal = gal + '<div class="avatar-upload"><div class="avatar-selected"><input onclick="chooseme'+i+'()" type="submit" id="imagechosen'+i+'" /><label for="imagechosen'+i+'"></label></div><div class="avatar-edit"><input onclick="removeme'+i+'()" type="submit" id="imageRemove'+i+'" /><label for="imageRemove'+i+'"></label></div><div class="avatar-preview"><img id="imagePreview" src="' + el.picture + '"></div></div>';//'<div class="column"><img style="width:80%; padding-top:1%;border-radius: 50%;" src="' + el.picture + '"> </div>';
            i++;
          });
          for (var j = 0; j < 5 - i; j++) {
            gal = gal + '<div class="avatar-upload"><div class="avatar-preview"><img id="imagePreview" src="img/robot.png"></div></div>';
          }
          tosend = gal
          sendData(gal);
        }
      });
    });
  }
  else if (choose != '') 
  {
    connection.query('USE ' + dbconfig.database);
    var params = [id];
    connection.query("UPDATE pics SET profilepicid = 0 WHERE user_id = ? ", params, function(err, res) 
    {
      if (err) throw err;
    });
    connection.query('USE ' + dbconfig.database);
    var params = [choose, choose];
    connection.query("UPDATE pics SET profilepicid = 1 WHERE id = ? ", params, function(err, res) 
    {
      if (err) throw err;
    });
  } 
  else if (picture == null) 
  {
    return res.send('no');
  } 
  else if (!picture.pic) 
  {
    return res.send('inspect');
  }
  else if (picture.pic.mimetype == "image/jpeg" || picture.pic.mimetype == "image/png" || picture.pic.mimetype == "image/gif" || sizeOf('public/images/'+picture.pic.name)) 
  {
    connection.query('USE ' + dbconfig.database);
    connection.query("SELECT * FROM pics WHERE user_id = ? ", id, async function(err, rows) 
    {
      if (rows.length <= 4) 
      {
        await picture.pic.mv(__dirname + '/..' + '/public/images/' + picture.pic.name);
        magic.detectFile('./public/images/' +picture.pic.name, function(err, result) {
          if(result == "image/jpeg" || result == "image/png" || result == "image/gif")
          {
            var params = [id, 'images/' + picture.pic.name];
            connection.query("INSERT INTO `pics`(`user_id`,`picture`) VALUES (?, ?)", params, function(err, res) 
            {
              if (err) throw err;
              tosend = 7;
              connection.query('USE ' + dbconfig.database);
              connection.query('SELECT * FROM pics WHERE user_id = ?',id, function(err, result) 
              {
                var results = result;
                var path = 'img/robot.png';
                if (typeof results[0] == 'undefined') 
                {
                  return res.send('no result found');
                } 
                else 
                {
                  let gal = "";
                  var i = 0;
                  results.forEach(el => 
                  {
                gal = gal + '<div class="avatar-upload"><div class="avatar-selected"><input onclick="removeme2()" type="submit" id="imageUpload2" /><label for="imageUpload2"></label></div><div class="avatar-edit"><input onclick="removeme2()" type="submit" id="imageUpload2" /><label for="imageUpload2"></label></div><div class="avatar-preview"><img id="imagePreview" src="' + el.picture + '"></div></div>';//'<div class="column"><img style="width:80%; padding-top:1%;border-radius: 50%;" src="' + el.picture + '"> </div>';
                i++;
              });
                  for (j = 0; j < 5 - i; j++) 
                  {
                    gal = gal + '<div class="avatar-upload"><div class="avatar-preview"><img id="imagePreview" src="img/robot.png"></div></div>';
                  }
                  tosend = gal;
                  sendData(gal);
                }
              });
            });
          }
          else
          {
            fs.unlinkSync('./public/images/' +picture.pic.name);
            res.send("unsupported");
          }
        });

      }
      else
      {
        res.send('max');
      }
    });
  }
  function sendData(data)
  {
    return res.send(data);
  }
});

app.get('/research', isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
  {
    var id = req.user.id;
    var result = await asynccheck.checkfull(id);
    if(result[0].bio == '' || result[0].bio == null)
    {
      res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
    }
    var id = req.user.id;
    var message = '';
    var blockids = await asyncblock.getblockedids(id);
    params = [id];
    function getValue(key, array) {
      for (var el in array) {
        params.push(array[el][key]);
      }
    }
    getValue("blocked", blockids);
    connection.query('USE ' + dbconfig.database);
    connection.query('SELECT * FROM users WHERE id = ? ',id, async function(err, result){
      if(result[0].bio == '' || result[0].bio == null)
      {
        res.render('profile.ejs', {message: req.flash('error'),user:req.user,user:req.user, user: id});
      }
      else
      {
        connection.query('USE ' + dbconfig.database);
        connection.query("select DISTINCT users.id, users.username, users.fname, users.lname, users.gender, users.email, users.age, users.tag, users.lat, users.lon, users.bio, users.rating, pics.user_id, pics.picture from users inner join pics on users.id = pics.user_id where users.id not in (?) and profilepicid = 1", [params], async function(err, result) 
        {
          if (err) throw err;
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('research.ejs', {data: result, data6:thereismsg, data2: thereis, message: message,user:req.user, user: id});
        });
      }
    });
  }
  else
    res.redirect('/login');

});


app.post('/research', isLoggedIn, function(req, res){
  if(req.body.minage == undefined || req.body.maxage == undefined || req.body.km == undefined || req.body.rating1 == undefined || req.body.rating2 == undefined || req.body.tag == undefined || req.body.sort == undefined)
  {
    var id = req.user.id;
    connection.query('USE ' + dbconfig.database);
    connection.query("select * from users inner join pics on users.id = pics.user_id where users.id = ? ", id, async function(err, result) 
    {
      if (err) throw err;
      message = '';
      var thereismsg = await asyncnotif.therismessage(id);
      var thereis = await asyncnotif.therisnotif(id);
      res.render('research.ejs', {user: id, user:req.user, data: result,data6:thereismsg, data2: thereis, message: message});
    });
  }
  else {
    var id = req.user.id;
    var min = req.body.minage.trim();
    var max = req.body.maxage.trim();
    var km = req.body.km.trim();
    var rating1 = req.body.rating1.trim();
    var rating2 = req.body.rating2.trim();
    var tag = req.body.tag.trim();
    var sort = req.body.sort;
    if (sort != '')
    {
      if (sort == 'age')
        sort = 'order by age';
      else if (sort == 'km')
        sort = 'order by km';
      else if (sort == 'rating')
        sort = 'order by rating';
      else if (sort == 'numcommas')

        sort = 'order by numcomma';
    }
    else
      sort = '';
    arraytag = tag.split(",");
    var i = 0;
    var sql = '';
    while (i < arraytag.length)
    {
      if (i == 0)
        sql = sql + '(tag like "%'+arraytag[i].trim()+'%" ';
      else if (i > 0)
        sql = sql + 'or tag like "%'+arraytag[i].trim()+'%" ';
      i++;
    }

    var message = '';
    function CheckValid(str){
      var re = /^\S+$/g;
      return re.test(str);

    }

      function ChecknotValid(str){
      var re = /[ !@#$%^&*()_+\-=\[\]{`};':"\\|.<>\/?]/;
      return re.test(str);

    }
    
    function escapeHtml(text) {
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };

      return text.replace(/[&<>"']/g, function(m) { return map[m]; });}

      tag = escapeHtml(tag);

      if ((isNaN(min) && min != '') || (isNaN(max) && max != '') || (isNaN(km) && km != '') || (isNaN(rating1) && rating1 != '') || (isNaN(rating2) && rating2 != '') || ((typeof tag != "string" || tag.length >= 255 || ChecknotValid(tag)) && tag != ''))
      {
        connection.query('USE ' + dbconfig.database);
        connection.query("select * from users inner join pics on users.id = pics.user_id where users.id = ? ", id, async function(err, result) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result.length)
          {
            result[i].km = parseInt(result[i].km);
            i++;
          } 
          message = 'Please type a correct value';
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('research.ejs', {user: id, user:req.user, data: result, data6:thereismsg, data2: thereis, message: message});
        });
      }
      else if (min == '' && max == '' && km == '' && rating1 == '' && rating2 == '' && tag == '')
      {
        connection.query('USE ' + dbconfig.database);
        connection.query("select * from users inner join pics on users.id = pics.user_id where users.id = ? ", id, async function(err, result) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result.length)
          {
            result[i].km = parseInt(result[i].km);
            i++;
          } 
          message = 'Please fill at least one of the filelds';
          var thereis = await asyncnotif.therisnotif(id);
          var thereismsg = await asyncnotif.therismessage(id);
          res.render('research.ejs', {user: id, user:req.user,data: result,data6:thereismsg, data2: thereis, message: message});
        });
      }
      else if((rating1 != '' && rating2 == '') || (rating1 == '' && rating2 != ''))
      {
        connection.query('USE ' + dbconfig.database);
        connection.query("select * from users inner join pics on users.id = pics.user_id where users.id = ? ", id, async function(err, result) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result.length)
          {
            result[i].km = parseInt(result[i].km);
            i++;
          } 
          message = 'Please fill the two rating fields';
          var thereis = await asyncnotif.therisnotif(id);
          var thereismsg = await asyncnotif.therismessage(id);
          res.render('research.ejs', {user: id, user:req.user,data: result,data6:thereismsg, data2:thereis ,message: message});
        });
      }
      else if(rating2 < rating1 && rating1 != '' && rating2 != '')
      { 
        connection.query('USE ' + dbconfig.database);
        connection.query("select * from users inner join pics on users.id = pics.user_id where users.id = ? ", id, async function(err, result) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result.length)
          {
            result[i].km = parseInt(result[i].km);
            i++;
          } 
          message = 'The second value of rating must be begger than the first one';
          var thereis = await asyncnotif.therisnotif(id);
          var thereismsg = await asyncnotif.therismessage(id);
          res.render('research.ejs', {user: id, user:req.user,data: result,data6:thereismsg, data2:thereis ,message: message});
        });
      }
      else
      {
        if (min != '' && max == '' && km == '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, min];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age >= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2: thereis,message: message});
          });
        }

        else if (min == '' && max != '' && km == '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, max];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis, message: message});
          });
        }
        else if (min == '' && max == '' && km != '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis, message: message});
          });
        }
        else if (min == '' && max == '' && km == '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max == '' && km == '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km == '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, min, max];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km != '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, min, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age >= ? and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km == '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, min, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age >= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6: thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km == '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age >= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6: thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km != '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, max, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age <= ? and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6: thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km == '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, max, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km == '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, max, tag];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0, data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max == '' && km != '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max == '' && km != '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max == '' && km == '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km != '' && rating1 == '' && rating2 == '' && tag == '')
        {
          params = [id, id, id, min, max, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age between ? and ? and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6: thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km == '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, min, max, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age between ? and ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km == '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, max];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0, data6: thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km != '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, min, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age >= ? and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km != '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age >= ? and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km == '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age >= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km != '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, max, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age <= ? and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km != '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, max, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age <= ? and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km == '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, max, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max == '' && km != '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km != '' && rating1 != '' && rating2 != '' && tag == '')
        {
          params = [id, id, id, min, max, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where age between ? and ? and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km != '' && rating1 == '' && rating2 == '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, max, km];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age between ? and ? and km <= ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km == '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, max, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age between ? and ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max == '' && km != '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age >= ? and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min == '' && max != '' && km != '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, max, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age <= ? and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
        else if (min != '' && max != '' && km != '' && rating1 != '' && rating2 != '' && (tag != '' && CheckValid(tag)))
        {
          params = [id, id, id, min, max, km, rating1, rating2];
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcomma FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where "+sql+") and age between ? and ? and km <= ? and rating between ? and ? "+sort+"",params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereis = await asyncnotif.therisnotif(id);
            var thereismsg = await asyncnotif.therismessage(id);
            res.render('research.ejs', {user: id, user:req.user,data: result0,data6:thereismsg, data2:thereis ,message: message});
          });
        }
      }
    }
  });

app.get('/main',  isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
  {
    var id = req.user.id;
    var message = '';
    var result = await asynccheck.getowntag(id);
    result[0].tag = result[0].tag.split(",");
    var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? ";
    var i = 0;
    while (i < result[0].tag.length)
    {
      if (i == 0)
        sql2 = sql2 + 'and (tag like "%'+result[0].tag[i].trim()+'%" ';
      else if (i > 0)
        sql2 = sql2 + 'or tag like "%'+result[0].tag[i].trim()+'%" ';    
      i++;
    }

    connection.query('USE ' + dbconfig.database);
    connection.query('SELECT * FROM users WHERE id = ? ',id, async function(err, result){

      if(result[0].bio == '' || result[0].bio == null)
      {
        res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
      }
      else
      {
        connection.query('USE ' + dbconfig.database);
        connection.query("select tag, sp from users where id = ? ", id, async function(err, ownresult) 
        {
          ownresult[0].tag = ownresult[0].tag.split(",");
          if (err) throw err;
          else if (ownresult[0].sp == 'both')
          {
            var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 ";
            var i = 0;
            while (i < result[0].tag.length)
            {
              if (i == 0)
                sql = sql + 'and (tag like "%'+result[0].tag[i].trim()+'%" ';
              else if (i > 0)
                sql = sql + 'or tag like "%'+result[0].tag[i].trim()+'%" ';    
              i++;
            }
            sql = sql+') order by age, km, rating, numcommas';
            params = [id, id, id];
            connection.query(sql, params, async function(err, result0) 
            {
              if (err) throw err;

              var i = 0;
              while (i < result0.length)
              {
                result0[i].km = parseInt(result0[i].km);
                i++;
              } 
              var thereismsg = await asyncnotif.therismessage(id);
              var thereis = await asyncnotif.therisnotif(id);
              res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2: thereis, data: result0});
            });
          }

          else if (ownresult[0].sp == 'male')
          {
            sql2 = sql2+') order by age, km, rating, numcommas';
            params = [id, id, id, ownresult[0].sp];
            connection.query(sql2, params, async function(err, result1) 
            {  
              if (err) throw err;
              var i = 0;
              while (i < result1.length)
              {
                result1[i].km = parseInt(result1[i].km);
                i++;
              }
              var thereismsg = await asyncnotif.therismessage(id);
              var thereis = await asyncnotif.therisnotif(id);
              res.render('main.ejs',{user: id, user:req.user, message: message, data6: thereismsg, data2: thereis, data : result1});
            });
          }
          else if (ownresult[0].sp == 'female')
          {
            sql2 = sql2+') order by age, km, rating, numcommas';
            params = [id, id, id, ownresult[0].sp];
            connection.query(sql2, params, async function(err, result2) 
            {
              if (err) throw err;
              var i = 0;
              while (i < result2.length)
              {
                result2[i].km = parseInt(result2[i].km);
                i++;
              } 
              var thereismsg = await asyncnotif.therismessage(id);
              var thereis = await asyncnotif.therisnotif(id);
              res.render('main.ejs',{user: id, user:req.user, message: message,data6: thereismsg, data2: thereis, data : result2});
            });
          }

        });
      }
    });
  }
  else
    res.redirect('/login');


});

app.post('/main',  isLoggedIn, async function(req, res){
  var id = req.user.id;
  if(typeof req.body.age == 'undefined' || typeof req.body.km == 'undefined' || typeof req.body.rating == 'undefined' || typeof req.body.tag == 'undefined' || typeof req.body.sort == 'undefined')
  {
    res.redirect('/changehidden');
  }
  var age = req.body.age.trim();
  var km = req.body.km;
  var rating = req.body.rating;
  var tag = req.body.tag.trim();
  var sort = req.body.sort;
  if (sort != '')
  {
    if (sort == 'age')
      sort = 'order by age';
    else if (sort == 'km')
      sort = 'order by km';
    else if (sort == 'rating')
      sort = 'order by rating';
    else if (sort == 'numcommas')
      sort = 'order by numcommas desc';
  }
  else
    sort = '';
  var message = '';
  var tagresult = await asynccheck.getowntag(id);
  tagresult[0].tag = tagresult[0].tag.split(",");

  connection.query('USE ' + dbconfig.database);
  connection.query("select sp from users where id = ? ", id, async function(err, ownresult) 
  {
    function CheckValid(str){
      var re = /^\S+$/g;
      return re.test(str);
    }
    if (age == '' && km == '' && rating == '' && tag == '')
    {
      var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? ";
      var i = 0;
      while (i < tagresult[0].tag.length)
      {
        if (i == 0)
          sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        else if (i > 0)
          sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
        i++;
      }
      if (ownresult[0].sp == 'both')
      {
        var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        sql = sql+') '+sort;
        params = [id, id, id];
        connection.query(sql, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'You doesn\'t choose one of the filters, so i suggest user(s) for you';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6: thereismsg, data2:thereis ,data: random});
        });
      }
      else if (ownresult[0].sp == 'male')
      {
        params = [id, id, id, ownresult[0].sp];
        sql2 = sql2+') '+sort;
        connection.query(sql2, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'You doesn\'t choose one of the filters, so i suggest user(s) for you';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2: thereis ,data: random});
        });
      }
      else if (ownresult[0].sp == 'female')
      {
        params = [id, id, id, ownresult[0].sp];
        sql2 = sql2+') '+sort;
        connection.query(sql2, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'You doesn\'t choose one of the filters, so i suggest user(s) for you';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2:thereis ,data: random});
        });
      }
    }
    else if ((isNaN(age) && age != '') || (isNaN(km) && km != '') || (isNaN(rating) && rating != ''))
    {
      var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? ";
      var i = 0;
      while (i < tagresult[0].tag.length)
      {
        if (i == 0)
          sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        else if (i > 0)
          sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
        i++;
      }
      if (ownresult[0].sp == 'both')
      {
        var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        sql = sql+') '+sort;
        params = [id, id, id];
        connection.query(sql, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'Please type a correct value';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6: thereismsg, data2:thereis ,data: random});
        });
      }
      else if (ownresult[0].sp == 'male')
      {
        params = [id, id, id, ownresult[0].sp];
        sql2 = sql2+') '+sort;
        connection.query(sql2, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'Please type a correct value';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2: thereis ,data: random});
        });
      }
      else if (ownresult[0].sp == 'female')
      {
        params = [id, id, id, ownresult[0].sp];
        sql2 = sql2+') '+sort;
        connection.query(sql2, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'Please type a correct value';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2:thereis ,data: random});
        });
      }
    }
    else if (age != '' && km == '' && rating == '' && tag == '')
    {
      var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? and age between (? - 5) and (? + 5) ";
      var i = 0;
      while (i < tagresult[0].tag.length)
      {
        if (i == 0)
          sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        else if (i > 0)
          sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        i++;
      }
      if (ownresult[0].sp == 'both')
      {
        var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and age between (? - 5) and (? + 5) ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        sql = sql+') '+sort;
        params = [id, id, id, age, age];
        connection.query(sql, params, async function(err, result0) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result0.length)
          {
            result0[i].km = parseInt(result0[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data: result0});
        });
      }
      else if (ownresult[0].sp == 'male')
      {
        sql2 = sql2+') '+sort;
        params = [id, id, id, ownresult[0].sp, age, age];
        connection.query(sql2, params, async function(err, result1) 
        {  
          if (err) throw err;
          var i = 0;
          while (i < result1.length)
          {
            result1[i].km = parseInt(result1[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result1});
        });
      }
      else if (ownresult[0].sp == 'female')
      {
        sql2 = sql2+') '+sort;
        params = [id, id, id, ownresult[0].sp, age, age];
        connection.query(sql2, params, async function(err, result2) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result2.length)
          {
            result2[i].km = parseInt(result2[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result2});
        });
      }
    }
    else if (age == '' && km != '' && rating == '' && tag == '')
    {
      var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? and km between (? - 500) and (? + 500) ";
      var i = 0;
      while (i < tagresult[0].tag.length)
      {
        if (i == 0)
          sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        else if (i > 0)
          sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        i++;
      }
      if (ownresult[0].sp == 'both')
      {
        var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and km between (? - 500) and (? + 500) ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        sql = sql+') '+sort;
        params = [id, id, id, km, km];
        connection.query(sql, params, async function(err, result0) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result0.length)
          {
            result0[i].km = parseInt(result0[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data: result0});
        });
      }
      else if (ownresult[0].sp == 'male')
      {
        sql2 = sql2+') '+sort;
        params = [id, id, id, ownresult[0].sp, km, km];
        connection.query(sql2, params, async function(err, result1) 
        {  
          if (err) throw err;
          var i = 0;
          while (i < result1.length)
          {
            result1[i].km = parseInt(result1[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result1});
        });
      }
      else if (ownresult[0].sp == 'female')
      {
        sql2 = sql2+') '+sort;
        params = [id, id, id, ownresult[0].sp, km, km];
        connection.query(sql2, params, async function(err, result2) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result2.length)
          {
            result2[i].km = parseInt(result2[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result2});
        });
      }
    }
    else if (age == '' && km == '' && rating != '' && tag == '')
    {
      var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000  and gender = ? and rating >= ? ";
      var i = 0;
      while (i < tagresult[0].tag.length)
      {
        if (i == 0)
          sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        else if (i > 0)
          sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        i++;
      }
      if (ownresult[0].sp == 'both')
      {
        var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= ? ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        sql = sql+') '+sort;
        params = [id, id, id, rating];
        connection.query(sql, params, async function(err, result0) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result0.length)
          {
            result0[i].km = parseInt(result0[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data: result0});
        });
      }
      else if (ownresult[0].sp == 'male')
      {
        sql2 = sql2+') '+sort;
        params = [id, id, id, ownresult[0].sp, rating, rating];
        connection.query(sql2, params, async function(err, result1) 
        {  
          if (err) throw err;
          var i = 0;
          while (i < result1.length)
          {
            result1[i].km = parseInt(result1[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result1});
        });
      }
      else if (ownresult[0].sp == 'female')
      {
        sql2 = sql2+') '+sort;
        params = [id, id, id, ownresult[0].sp, rating];
        connection.query(sql2, params, async function(err, result2) 
        {
          if (err) throw err;
          var i = 0;
          while (i < result2.length)
          {
            result2[i].km = parseInt(result2[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result2});
        });
      }
    }
    else if (age == '' && km == '' && rating == '' && tag != '')
    {
      if(CheckValid(tag) && tag.length <= 25)
      {
        var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? and (tag like '%,"+tag+",%' or tag like '%,"+tag+"%' or tag like '%"+tag+",%' or tag like '%"+tag+"%') ";
        if (ownresult[0].sp == 'both')
        {
          var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and (tag like '%,"+tag+",%' or tag like '%,"+tag+"%' or tag like '%"+tag+",%' or tag like '%"+tag+"%') ";
          params = [id, id, id];
          sql = sql+sort;
          connection.query(sql, params, async function(err, result0) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(id);
            res.render('main.ejs', {user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data: result0});
          });
        }
        else if (ownresult[0].sp == 'male')
        {
          params = [id, id, id, ownresult[0].sp];
          sql2 = sql2+sort;
          connection.query(sql2, params, async function(err, result1) 
          {  
            if (err) throw err;
            var i = 0;
            while (i < result1.length)
            {
              result1[i].km = parseInt(result1[i].km);
              i++;
            } 
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(id);
            res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result1});
          });
        }
        else if (ownresult[0].sp == 'female')
        {
          params = [id, id, id, ownresult[0].sp];
          sql2 = sql2+sort;
          connection.query(sql2, params, async function(err, result2) 
          {
            if (err) throw err;
            var i = 0;
            while (i < result2.length)
            {
              result2[i].km = parseInt(result2[i].km);
              i++;
            } 
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(id);
            res.render('main.ejs',{user: id, user:req.user,message: message,data6:thereismsg, data2:thereis ,data : result2});
          });
        }
      }
      else
      {
        var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        if (ownresult[0].sp == 'both')
        {
          var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 ";
          var i = 0;
          while (i < tagresult[0].tag.length)
          {
            if (i == 0)
              sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
            else if (i > 0)
              sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
            i++;
          }
          sql = sql+') '+sort;
          params = [id, id, id];
          connection.query(sql, params, async function(err, random) 
          { 
            if (err) throw err;
            message = 'Please type a valid tag';
            var i = 0;
            while (i < random.length)
            {
              random[i].km = parseInt(random[i].km);
              i++;
            } 
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(id);
            res.render('main.ejs', {user: id, user:req.user, message: message,data6: thereismsg, data2:thereis ,data: random});
          });
        }
        else if (ownresult[0].sp == 'male')
        {
          params = [id, id, id, ownresult[0].sp];
          sql2 = sql2+') '+sort;
          connection.query(sql2, params, async function(err, random) 
          { 
            if (err) throw err;
            message = 'Please type a valid tag';
            var i = 0;
            while (i < random.length)
            {
              random[i].km = parseInt(random[i].km);
              i++;
            } 
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(id);
            res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2: thereis ,data: random});
          });
        }
        else if (ownresult[0].sp == 'female')
        {
          params = [id, id, id, ownresult[0].sp];
          sql2 = sql2+') '+sort;
          connection.query(sql2, params, async function(err, random) 
          { 
            if (err) throw err;
            message = 'Please type a valid tag';
            var i = 0;
            while (i < random.length)
            {
              random[i].km = parseInt(random[i].km);
              i++;
            } 
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(id);
            res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2:thereis ,data: random});
          });
        }
      }
    }
    else if ((age != '' && km != '' && rating == '' && tag == '') || (age != '' && km == '' && rating != '' && tag == '') || (age != '' && km == '' && rating == '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age != '' && km == '' && rating == '' && (tag != '' && (CheckValid(tag) && tag.length <= 50))) || (age == '' && km != '' && rating != '' && tag == '') || (age == '' && km != '' && rating == '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age == '' && km != '' && rating == '' && (tag != '' && (CheckValid(tag) && tag.length <= 50))) || (age == '' && km == '' && rating != '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age == '' && km == '' && rating != '' && (tag != '' && (CheckValid(tag) && tag.length <= 50))) || (age != '' && km != '' && rating != '' && tag == '') || (age != '' && km != '' && rating == '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age != '' && km != '' && rating == '' && (tag != '' && (CheckValid(tag) && tag.length <= 50))) || (age != '' && km == '' && rating != '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age != '' && km == '' && rating != '' && (tag != '' && (CheckValid(tag) && tag.length <= 50))) || (age == '' && km != '' && rating != '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age == '' && km != '' && rating != '' && (tag != '' && (CheckValid(tag) || tag.length <= 50))) || (age != '' && km != '' && rating != '' && (tag != '' && (!CheckValid(tag) || tag.length >= 255))) || (age != '' && km != '' && rating != '' && (tag != '' && (CheckValid(tag) && tag.length <= 50))))
    {
      var sql2 = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 and gender = ? ";
      var i = 0;
      while (i < tagresult[0].tag.length)
      {
        if (i == 0)
          sql2 = sql2 + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
        else if (i > 0)
          sql2 = sql2 + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
        i++;
      }
      if (ownresult[0].sp == 'both')
      {
        var sql = "select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km, (select (length(b.tag) - length(replace(b.tag, ',', '')))) as numcommas FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id != ?) and b.id not in (select blocked from block where blocker = ?)) as distance inner join users on distance.id = users.id where km < 1000 and rating >= 3 ";
        var i = 0;
        while (i < tagresult[0].tag.length)
        {
          if (i == 0)
            sql = sql + 'and (tag like "%'+tagresult[0].tag[i].trim()+'%" ';
          else if (i > 0)
            sql = sql + 'or tag like "%'+tagresult[0].tag[i].trim()+'%" ';    
          i++;
        }
        sql = sql+') '+sort;
        params = [id, id, id];
        connection.query(sql, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'You have to fill one filter';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6: thereismsg, data2:thereis ,data: random});
        });
      }
      else if (ownresult[0].sp == 'male')
      {
        params = [id, id, id, ownresult[0].sp];
        sql2 = sql2+') '+sort;
        connection.query(sql2, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'You have to fill one filter';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2: thereis ,data: random});
        });
      }
      else if (ownresult[0].sp == 'female')
      {
        params = [id, id, id, ownresult[0].sp];
        sql2 = sql2+') '+sort;
        connection.query(sql2, params, async function(err, random) 
        { 
          if (err) throw err;
          message = 'You have to fill one filter';
          var i = 0;
          while (i < random.length)
          {
            random[i].km = parseInt(random[i].km);
            i++;
          } 
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(id);
          res.render('main.ejs', {user: id, user:req.user, message: message,data6:thereismsg, data2:thereis ,data: random});
        });
      }
    }
  });
});

app.get('/user',  isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
  {
    var id = req.user.id;
    var result = await asynccheck.checkfull(id);
    if(result[0].bio == '' || result[0].bio == null)
    {
      res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
    }
    var idsearch = req.query.id;
    var iduser = req.user.id;
    
    var reg = /^\d+$/;
    if (!reg.test(idsearch))
      res.redirect('./research');

    var userexist = await asynccheck.checkuserexist(idsearch);
    if(typeof userexist[0] == 'undefined')
      res.redirect('./research');

    var matching = await asynclike.getmatcho(idsearch, iduser);
    if (matching != undefined)
      var token = await asyncgetoken.getoken(idsearch, iduser);
    var test = await asynclike.gettype(idsearch, iduser);
    if(test == undefined)
    {
      params = [idsearch, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("insert into likes (user_id, liker_id, likenum) values(?, ?, 0)",params, async function(err, result2) 
      {
        if (err) throw err;
      });
    }
    var checkopico = await asynccheck.checkpic(idsearch);
    if(typeof checkopico == 'undefined')
      await asynccheck.insertpic(idsearch);
    var block = await asyncblock.getblock(idsearch, iduser);
    if (block == 1)
      res.redirect('/research');
    else if (idsearch == iduser)
      res.redirect('/research');
    else
    {
      await asyncnotif.notifvisit(iduser, idsearch);
      params = [iduser, idsearch, iduser, idsearch];
      connection.query('USE ' + dbconfig.database);
      connection.query("select * from (SELECT b.id, 111.1111 * DEGREES(ACOS(COS(RADIANS(a.Lat)) * COS(RADIANS(b.Lat)) * COS(RADIANS(a.Lon) - RADIANS(b.Lon)) + SIN(RADIANS(a.Lat)) * SIN(RADIANS(b.Lat)))) AS km FROM users AS a JOIN users AS b ON a.id <> b.id WHERE a.id = ? AND b.id in (select id from users where id = ?)) as distance inner join users on distance.id = users.id inner join pics on users.id = pics.user_id inner join likes on users.id = likes.user_id where liker_id = ? and likes.user_id = ?",params, async function(err, result) 
      {
        if (result[0] != undefined)
        {
          if (err) throw err;
          result[0].tag = result[0].tag.split(",");
          if(token != undefined)
            {var newkey = 'tokenmatch';
          var newvalue = token;
          result[0][newkey] = newvalue.token;}

          var i = 0;
          while (i < result.length)
          {
            result[i].km = parseInt(result[i].km);
            i++;
          } 

          var time = await asynclogout.getlogout(idsearch);
          var thereismsg = await asyncnotif.therismessage(id);
          var thereis = await asyncnotif.therisnotif(iduser);
          var helikesyou = await asynclike.helikesyou(idsearch, iduser);
          res.render('user.ejs',{data : result,data6:thereismsg, data2: thereis, data3: time, data4: helikesyou, user: iduser, user2: idsearch});
        }
        else
        {
          connection.query('USE ' + dbconfig.database);
          connection.query("select * from users inner join pics on users.id = pics.user_id where users.id = ?", idsearch, async function(err, result0) 
          {
            var j = 0;
            while (j < result0.length)
            {
              result0[j].tag = result0[j].tag.split(",");
              j++;
            }
            var i = 0;
            while (i < result0.length)
            {
              result0[i].km = parseInt(result0[i].km);
              i++;
            } 

            var time = await asynclogout.getlogout(idsearch);
            var thereismsg = await asyncnotif.therismessage(id);
            var thereis = await asyncnotif.therisnotif(iduser);
            var helikesyou = await asynclike.helikesyou(idsearch, iduser);
            res.render('user.ejs', {data: result0,data6:thereismsg, data2: thereis, data3: time, data4: helikesyou, user: iduser, user2: idsearch});
          });
        }
      });
    }
  }
  else
    res.redirect('/login');

});

app.post('/user',  isLoggedIn, async function(req, res){
  var idsearch = req.query.id;
  var iduser = req.user.id;
  var like = req.body.like;
  var rate = req.body.rate;
  var report = req.body.reported;
  var blocked = req.body.blocked;
  

  if(report != '' && typeof report != 'undefined')
  {
    var params = [idsearch, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("insert into report (reported, reporter) values(?, ?)",params, function(err, result0) 
    {
      if (err) throw err;
      res.redirect('/user?id='+idsearch);
    });
  }
  else if(blocked != '' && typeof blocked != 'undefined')
  {
    var params = [idsearch, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("insert into block (blocked, blocker) values(?, ?)",params, function(err, result0) 
    {
      if (err) throw err;
      params = [idsearch, idsearch, iduser, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("delete from matcho where (match1 = ? or match2 = ?) and (match1 = ? or match2 = ?)",params, function(err, result0) 
      {
        if (err) throw err;
      });
      res.redirect('/user?id='+idsearch);
    });
  }
  else if(like == '1' && rate == '')
  {
    await asyncnotif.notiflike(iduser, idsearch);
    var check = await asynccheck.checkpic(iduser);
    if (check != undefined)
    {
      await asynclike.updatelike(idsearch, iduser);
      var otherlike = await asynclike.getlikeme(iduser, idsearch);

      if (otherlike == '1')
      {
        var matching = await asynclike.getmatcho(idsearch, iduser);
        if(matching == undefined)
        {

          token = (parseInt(iduser)*parseInt(idsearch))/2;

          params = [idsearch, iduser, token];
          connection.query('USE ' + dbconfig.database);
          connection.query("insert into matcho (match1, match2, token) values(?, ?, FLOOR( ? ))",params, function(err, result0) 
          {
            if (err) throw err;
          });
        }
        await asyncnotif.notifmatch(iduser, idsearch);
      }
      res.redirect('/user?id='+idsearch);
    }
    else
      res.redirect('/goaddapic'); 
  }
  else if(like == '0' && rate == '')
  {

    await asyncnotif.notifunlike(iduser, idsearch);
    params = [idsearch, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("delete from likes where user_id = ? and liker_id = ?",params, function(err, result1) 
    {
      if (err) throw err;
    });
    if(matching == undefined)
    {
      params = [idsearch, idsearch, iduser, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("delete from matcho where (match1 = ? or match2 = ?) and (match1 = ? or match2 = ?)",params, function(err, result0) 
      {
        if (err) throw err;
      });
    }
    res.redirect('/user?id='+idsearch);
  }
  else if(rate != '' && like == '' && (rate == '0' || rate == '1' || rate == '2' || rate == '3' || rate == '4' || rate == '5'))
  {
    var test = await asyncrate.getrate(idsearch, iduser);
    if(test == undefined)
    {
      params = [idsearch, iduser, rate];
      connection.query('USE ' + dbconfig.database);
      connection.query("insert into rates (user_id, rater_id, rating) values(?, ?, ?)",params, function(err, result2) 
      {
        if (err) throw err;
      });
      params = [idsearch, idsearch];
      connection.query('USE ' + dbconfig.database);
      connection.query("select FLOOR((Moy/((select count(*) from rates where user_id = ?)))) as fame from (select sum(rating) as Moy from rates where user_id = ?) as tab",params, function(err, result4) 
      {
        if (err) throw err;
        params = [result4[0].fame, idsearch];
        connection.query('USE ' + dbconfig.database);
        connection.query("update users set rating = ? where id = ?",params, function(err, result5) 
        {
          if (err) throw err;
        });
      });
    }
    else
    {
      params = [rate, idsearch, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("update rates set rating = ? where user_id = ? and rater_id = ?",params, function(err, result3) 
      {
        if (err) throw err;
      });
      params = [idsearch, idsearch];
      connection.query('USE ' + dbconfig.database);
      connection.query("select FLOOR((Moy/((select count(*) from rates where user_id = ?)))) as fame from (select sum(rating) as Moy from rates where user_id = ?) as tab",params, function(err, result4) 
      {
        if (err) throw err;
        params = [result4[0].fame, idsearch];
        connection.query('USE ' + dbconfig.database);
        connection.query("update users set rating = ? where id = ?",params, function(err, result5) 
        {
          if (err) throw err;
        });
      });
    }
    res.redirect('/user?id='+idsearch);
  }
  else if (like == '1' && rate != '' && (rate == '0' || rate == '1' || rate == '2' || rate == '3' || rate == '4'|| rate == '5'))
  {
    await asyncnotif.notiflike(iduser, idsearch);
    var check1 = await asynccheck.checkpic(iduser);
    if (check1 != undefined)
    {
      await asynclike.updatelike(idsearch, iduser);
      var otherlike = await asynclike.getlikeme(iduser, idsearch);
      if (otherlike == '1')
      {
        var matching = await asynclike.getmatcho(idsearch, iduser);
        if(matching == undefined)
        {

          token = (parseInt(iduser)*parseInt(idsearch))/2;

          params = [idsearch, iduser, token];
          connection.query('USE ' + dbconfig.database);
          connection.query("insert into matcho (match1, match2, token) values(?, ?, FLOOR( ? ))",params, function(err, result0) 
          {
            if (err) throw err;
          });
        }
        await asyncnotif.notifmatch(iduser, idsearch);
      }
      var test2 = await asyncrate.getrate(idsearch, iduser);
      if(test2 == undefined)
      {
        params = [idsearch, iduser, rate];
        connection.query('USE ' + dbconfig.database);
        connection.query("insert into rates (user_id, rater_id, rating) values(?, ?, ?)",params, function(err, result3) 
        {
          if (err) throw err;
        });
        params = [idsearch, idsearch];
        connection.query('USE ' + dbconfig.database);
        connection.query("select FLOOR((Moy/((select count(*) from rates where user_id = ?)))) as fame from (select sum(rating) as Moy from rates where user_id = ?) as tab",params, function(err, result4) 
        {
          if (err) throw err;
          params = [result4[0].fame, idsearch];
          connection.query('USE ' + dbconfig.database);
          connection.query("update users set rating = ? where id = ?",params, function(err, result5) 
          {
            if (err) throw err;
          });
        });
      }
      else
      {
        params = [rate, idsearch, iduser];
        connection.query('USE ' + dbconfig.database);
        connection.query("update rates set rating = ? where user_id = ? and rater_id = ?",params, function(err, result3) 
        {
          if (err) throw err;
        });
        params = [idsearch, idsearch];
        connection.query('USE ' + dbconfig.database);
        connection.query("select FLOOR((Moy/((select count(*) from rates where user_id = ?)))) as fame from (select sum(rating) as Moy from rates where user_id = ?) as tab",params, function(err, result4) 
        {
          if (err) throw err;
          params = [result4[0].fame, idsearch];
          connection.query('USE ' + dbconfig.database);
          connection.query("update users set rating = ?",params, function(err, result5) 
          {
            if (err) throw err;
          });
        });
      }
      res.redirect('/user?id='+idsearch);
    }
    else
      res.redirect('/goaddapic'); 
  }
  else if (like == '0' && rate != '' && (rate == '0' || rate == '1' || rate == '2' || rate == '3' || rate == '4' || rate == '5'))
  {
    await asyncnotif.notifunlike(iduser, idsearch);
    params = [idsearch, iduser];
    connection.query('USE ' + dbconfig.database);
    connection.query("update likes set likenum = 0 where user_id = ? and liker_id = ?",params, function(err, result2) 
    {
      if (err) throw err;
    });
    if(matching == undefined)
    {
      params = [idsearch, idsearch, iduser, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("delete from matcho where (match1 = ? or match2 = ?) and (match1 = ? or match2 = ?)",params, function(err, result0) 
      {
        if (err) throw err;
      });
    }
    var test3 = await asyncrate.getrate(idsearch, iduser);
    if(test3 == undefined)
    {
      params = [idsearch, iduser, rate];
      connection.query('USE ' + dbconfig.database);
      connection.query("insert into rates (user_id, rater_id, rating) values(?, ?, ?)",params, function(err, result3) 
      {
        if (err) throw err;
      });
      params = [idsearch, idsearch];
      connection.query('USE ' + dbconfig.database);
      connection.query("select FLOOR((Moy/((select count(*) from rates where user_id = ?)))) as fame from (select sum(rating) as Moy from rates where user_id = ?) as tab",params, function(err, result4) 
      {
        if (err) throw err;
        params = [result4[0].fame, idsearch];
        connection.query('USE ' + dbconfig.database);
        connection.query("update users set rating = ? where id = ?",params, function(err, result5) 
        {
          if (err) throw err;
        });
      });
    }
    else
    {
      params = [rate, idsearch, iduser];
      connection.query('USE ' + dbconfig.database);
      connection.query("update rates set rating = ? where user_id = ? and rater_id = ?",params, function(err, result3) 
      {
        if (err) throw err;
      });
      params = [idsearch, idsearch];
      connection.query('USE ' + dbconfig.database);
      connection.query("select FLOOR((Moy/((select count(*) from rates where user_id = ?)))) as fame from (select sum(rating) as Moy from rates where user_id = ?) as tab",params, function(err, result4) 
      {
        if (err) throw err;
        params = [result4[0].fame, idsearch];
        connection.query('USE ' + dbconfig.database);
        connection.query("update users set rating = ?",params, function(err, result5) 
        {
          if (err) throw err;
        });
      });
    }
    res.redirect('/user?id='+idsearch);
  }
  else
    res.redirect('/user?id='+idsearch);
});

app.get('/goaddapic',  isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
 {
  var id = req.user.id;
  result = await asynccheck.checkfull(id);
  if(result[0].bio == '' || result[0].bio == null)
  {

    res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
  }
  else if(typeof islog[0] != 'undefined')
  {

    res.render('goaddapic.ejs');
  }
}
  else
  {

    res.redirect('/login');
  }
});

app.get('/changehidden',  isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
 {
  var id = req.user.id;
  result = await asynccheck.checkfull(id);
  if(result[0].bio == '' || result[0].bio == null)
  {

    res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
  }
  else if(typeof islog[0] != 'undefined')
  {

    res.render('changehidden.ejs');
  }
}
  else
  {

    res.redirect('/login');
  }
});

app.get('/notif',  isLoggedIn, async function(req, res){
 var islog = await asynccheck.checklogin(req.user.username);
 if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
 {
  var id = req.user.id;
  var result = await asynccheck.checkfull(id);
  if(result[0].bio == '' || result[0].bio == null)
  {
    res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
  }
  var id = req.user.id;
  var result = await asyncnotif.shownotif(id);
  await asyncnotif.upditenotif(id);
  var thereis = await asyncnotif.therisnotif(id);
  var thereismsg = await asyncnotif.therismessage(id);
  res.render('notif.ejs', {data: result,data6: thereismsg, data2: thereis,user:req.user, user: id});
}
else
  res.redirect('/login');
});

app.get('/hatelist',  isLoggedIn, async function(req, res){
 var islog = await asynccheck.checklogin(req.user.username);
 if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
 {
   var id = req.user.id;
   var result = await asynccheck.checkfull(id);
   if(result[0].bio == '' || result[0].bio == null)
   {
    res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
  }
  var id = req.user.id;
  var result = await asyncnotif.showblocked(id);
  var thereismsg = await asyncnotif.therismessage(id);
  var thereis = await asyncnotif.therisnotif(id);
  res.render('hatelist.ejs', {data: result,data6:thereismsg, data2: thereis,user:req.user, user: id});
}
else
  res.redirect('/login');
});

app.post('/hatelist',  isLoggedIn, async function(req, res){
  var id = req.user.id;
  var blocked = req.body.id;
  await asyncnotif.removeblocked(id, blocked);
  var thereismsg = await asyncnotif.therismessage(id);
  var thereis = await asyncnotif.therisnotif(id);
  res.sendStatus(200);
});


app.get('/chatlist',  isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
  {
    var id = req.user.id;
    var result = await asynccheck.checkfull(id);
    if(result[0].bio == '' || result[0].bio == null)
    {
      res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
    }
    var result = await asynclike.showchatlist(id);
    var thereis = await asyncnotif.therisnotif(id);
    var thereismsg = await asyncnotif.therismessage(id);
    res.render('chatlist.ejs', {data: result,data6:thereismsg, data2: thereis,user:req.user, user: id});
  }
  else
    res.redirect('/login');
});

app.get('/chatroom', isLoggedIn, async function(req, res){
  var islog = await asynccheck.checklogin(req.user.username);
  if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
  {
    var id = req.user.id;
    var result = await asynccheck.checkfull(id);
    if(result[0].bio == '' || result[0].bio == null)
    {
      res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
    }

    var id = req.user.id;
    var token = req.query.token;
    var username = req.user.username;
    if(typeof token != 'undefined')
    {
      var token2 = await asyncgetoken.getoken2(token);
      if(token2 != undefined)
      {
        var thereis = await asyncnotif.therisnotif(id);
        var thereismsg = await asyncnotif.therismessage(id);
        var chat = await asyncnotif.getchat(token);
        var i = 0;
        while ( i < chat.length)
        {
          chat[i].msg = decodeEntities(chat[i].msg);
          chat[i].msg = retext()
          .use(emoji, {convert: 'encode'})
          .processSync(chat[i].msg)
          i++;
        }

        res.render('chatroom.ejs', {user: id, data:chat,data6:thereismsg, data2:thereis, user:req.user, user: id});
      }
      else
        res.render('invalidtoken.ejs');
    }
    else
     res.render('invalidtoken.ejs');
 }
 else
  res.redirect('/login');
});

app.post('/chatroom', isLoggedIn, async function(req, res){
  var sender = req.user.id;
  var receiver = req.body.too;
  if (receiver == 8 && sender == 1)
    receiver = 9;
  var msg = req.body.msg;
  var therismatch = await asynclike.getmatcho(receiver, sender);
  if(typeof therismatch != 'undefined')
  {
  var token = await asyncgetoken.getoken3(receiver, sender);
  try
  {
    token = token[0].token;
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });}
    msg = escapeHtml(msg);
    if(msg.length < 100 && msg)
    {
      try{
        await asynclike.insertchat(sender, receiver, msg, token);
      }
      catch (err){
        console.log("");
        
      }
    }
  }
  catch(err)
  {console.log("");}
}
  else
    console.log("");
  });

app.get('/message',  isLoggedIn, async function(req, res){
 var islog = await asynccheck.checklogin(req.user.username);
 if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
 {
  var id = req.user.id;
  var result = await asynccheck.checkfull(id);
  if(result[0].bio == '' || result[0].bio == null)
  {
    res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
  }
  var id = req.user.id;
  var result = await asyncnotif.showmessage(id);
  await asyncnotif.upditemessage(id);
  var thereis = await asyncnotif.therisnotif(id);
  var thereismsg = await asyncnotif.therismessage(id);
  res.render('message.ejs', {data: result, data6: thereismsg, data2: thereis, user:req.user, user: id});
}
else
  res.redirect('/login');
});

app.get('/history',  isLoggedIn, async function(req, res){
 var islog = await asynccheck.checklogin(req.user.username);
 if(typeof islog[0] != 'undefined' && islog[0].connected == 1)
 {
  var id = req.user.id;
  var result = await asynccheck.checkfull(id);
  if(result[0].bio == '' || result[0].bio == null)
  {
    res.render('profile.ejs', {message: req.flash('error'),user:req.user, user: id});
  }
  var id = req.user.id;
  var result = await asyncnotif.showall(id);
  var thereis = await asyncnotif.therisnotif(id);
  var thereismsg = await asyncnotif.therismessage(id);
  res.render('history.ejs', {data: result, data6: thereismsg, data2: thereis, user:req.user, user: id});
}
else
  res.redirect('/login');
});

app.get('/confirmation', function(req, res){

  res.render('confirmation.ejs');
});


app.get('/reset', function(req, res){
  res.render('reset.ejs');
});

app.get('/autotag', async function(req, res){
  var result = await asyncgetoken.getag();

  
 
  var tags = new Array();

result.forEach(el => {
  
  var tugs = el.tag.split(',');
  tugs.forEach(el => {
if(tags.indexOf(el.trim()) == -1 && el.trim().length != 0)
    tags.push(el.trim())
  })
})
    res.send(tags);

});

app.get('/remove', async function(req,res){
  var id = req.user.id;
  await asyncremove.deleteuser(id);
  await asyncremove.deletepics(id);
  await asyncremove.deletematch(id);
  await asyncremove.deletelogin(id);
  await asyncremove.deletelikes(id);
  await asyncremove.deletechat(id);
  await asyncremove.deleteblock(id);
  await asyncremove.deletenotif(id);
  await asyncremove.deleterates(id);
  await asyncremove.deletereport(id);
  req.logout();
  res.redirect('/');
});

app.get('/logout', async function(req,res){
  if (req.user)
    {var id = req.user.id;
      await asynclogout.logoutupdate(id);}
      req.logout();
      res.redirect('/');
    });
};

function isLoggedIn(req, res, next)
{
 if(req.isAuthenticated())
  return next();
res.redirect('/login');
}

