const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const flash = require('connect-flash');
const passport = require('passport');
const fileUpload = require('express-fileupload');
var favicon = require('serve-favicon');
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
  pingTimeout: 60000,
});
users = [];
connections = [];
const port = 4000;

require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());
app.use(favicon(__dirname + '/public/img/matcha.ico'));
app.set('view engine', 'ejs');

app.use(session({
 secret: 'hamzaros',
 resave:true,
 saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);

app.use(function(req, res, next) {
  res.status = 404;
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }
});
server.listen(4000, function(){
});

io.on('connection', function (socket) {
	connections.push(socket);

	
	socket.on('disconnect', function(data){
		users.splice(users.indexOf(socket.username), 1);
	connections.splice(connections.indexOf(socket), 1);
	
});
	socket.on('send message', function(data, data2, data3){
    io.emit('room'+data2, {id: data3, msg: data, token: data2, user: socket.username});
  });

socket.on('send notif', function(data){
    io.emit('notif', {id: data});
  });
socket.on('notif message', function(data){
    io.emit('msg', {id: data});
  });



});