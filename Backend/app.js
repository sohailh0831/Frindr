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


const app = express();

// Start HTTP Server
const port = 80;


// Certificate
// const privateKey = fs.readFileSync('/etc/letsencrypt/live/frindr.tk/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/frindr.tk/cert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/frindr.tk/chain.pem', 'utf8');
// const credentials = {
// 	key: privateKey,
// 	cert: certificate,
// 	ca: ca
// };


app.engine('.hbs', exphbs({
  extname: 'hbs',
  defaultLayout: null,
  partialsDir: path.join(__dirname, 'views/partials'),
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
    secret: 'q3lk4gnk3ngkl3kgnq3klgn',
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

//AIzaSyDsppSm82CGZMZQTuEuNFPK5hikt9aquPs

// Static folder
app.use(express.static(path.join(__dirname, '/public')));

app.listen(port, () =>{
  console.log(`Server started on port ${port}`);
});
// const httpsServer = https.createServer(credentials, app);

// httpsServer.listen(443, () => {
// 	console.log(`Got SSL up in this bish`);
// });
