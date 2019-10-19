const express = require('express');
const path = require('path');
const mysql = require('mysql');
const hbs = require('hbs');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
var passport = require("passport");
var request = require("request");
const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Start HTTP Server
const port = process.env.PORT;

//comment lines out if testing locally
//Certificate
var privateKey = 'test';
var certificate = 'test';
var ca = 'test';
var credentials = 'test';

if(process.env.NODE_ENV === 'server'){
  privateKey = fs.readFileSync('/etc/letsencrypt/live/frindr.tk/privkey.pem', 'utf8');
  certificate = fs.readFileSync('/etc/letsencrypt/live/frindr.tk/cert.pem', 'utf8');
  ca = fs.readFileSync('/etc/letsencrypt/live/frindr.tk/chain.pem', 'utf8');
  credentials = {
  	key: privateKey,
  	cert: certificate,
  	ca: ca
  };
}

app.engine('.hbs', exphbs({
  extname: 'hbs',
  defaultLayout: null,
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: require("./helpers/handlebars.js").helpers,
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Load routes
const userend = require('./routes/userend');

// Static folder
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Express Session
app.use(session({
    secret: process.env.PASS_SECRET,
    saveUninitialized: false,
    resave: false
}));
app.use(flash());
app.use(expressValidator());
// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use('/', userend);

// Static folder
app.use(express.static(path.join(__dirname, '/public')));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

if(process.env.NODE_ENV === 'server'){
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(process.env.SSLPORT, () => {
	   console.log(`SSL started`);
  });
}

const socketApp = express();
const socketServer = socketApp.listen(process.env.SOCKETPORT, () => {
  console.log(`Socket server started on port ${process.env.SOCKETPORT}`);
});

const io = require("socket.io")(socketServer);
io.on('connection', (socket) => {
  console.log("New user connected");
});
