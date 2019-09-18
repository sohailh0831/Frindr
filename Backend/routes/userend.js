const express = require('express');
const _ = require('lodash');
const session = require('express-session');
const expressValidator = require('express-validator');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const uuidv4 = require('uuid/v4');
var passport = require("passport");
var request = require("request");
const mysql = require('mysql');
const moment = require('moment');
const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'FrindrPurdue@gmail.com',
        pass: 'Okaydone1234!'
    }
});
let dbInfo = {
  connectionLimit: 100,
  host: '67.207.85.51',
  user: 'frindrDB',
  password: 'PurdueTesting1!',
  database: 'frindr',
  port: 3306,
  multipleStatements: true
};

const LocalStrategy = require('passport-local').Strategy;
const AuthenticationFunctions = require('../Authentication.js');

router.get('/', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  return res.redirect('/dashboard');
});

router.get('/login', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/login.hbs', {
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/login', AuthenticationFunctions.ensureNotAuthenticated, passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/login', failureFlash: true }), (req, res) => {
  res.redirect('/dashboard');
});

passport.use(new LocalStrategy({ passReqToCallback: true, },
  function (req, username, password, done) {
    let con = mysql.createConnection(dbInfo);
    con.query(`SELECT * FROM users WHERE username=${mysql.escape(username)};`, (error, results, fields) => {
      if (error) {
        console.log(error.stack);
        con.end();
        return;
      }
      if (results.length === 0) {
        con.end();
        return done(null, false, req.flash('error', 'Username or Password is incorrect.'));
      } else {
        if (bcrypt.compareSync(password, results[0].password)) {
          let user = {
            identifier: results[0].id,
            username: results[0].username,
            firstName: results[0].first_name,
            lastName: results[0].last_name,
          };
          con.end();
          return done(null, user);
        } else {
          con.end();
          return done(null, false, req.flash('error', 'Username or Password is incorrect.'));
        }

      }
    });

  }));

passport.serializeUser(function (uuid, done) {
  done(null, uuid);
});

passport.deserializeUser(function (uuid, done) {
  done(null, uuid);
});

router.get('/register', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/register.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.post('/register', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  req.checkBody('firstName', 'First Name field is required.').notEmpty();
  req.checkBody('lastName', 'Last Name field is required.').notEmpty();
  req.checkBody('email', 'Email field is required.').notEmpty();
  req.checkBody('username', 'Username field is required.').notEmpty();
  req.checkBody('password', 'Password field is required.').notEmpty();
  req.checkBody('password2', 'Confirm password field is required.').notEmpty();
  req.checkBody('password2', 'Password does not match confirmation password field.').equals(req.body.password);

  let formErrors = req.validationErrors();
  if (formErrors) {
    req.flash('error', formErrors[0].msg);
    return res.redirect('/register');
  }

  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users WHERE username=${mysql.escape(req.body.username)};`, (error, results, fields) => { //checks to see if username is already taken
    if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
    }

    if (results.length == 0) {
      let userid = uuidv4();
      let salt = bcrypt.genSaltSync(10);
      let hashedPassword = bcrypt.hashSync(req.body.password, salt);
      con.query(`INSERT INTO users (id,username, password, email, first_name, last_name) VALUES (${mysql.escape(userid)}, ${mysql.escape(req.body.username)}, '${hashedPassword}', ${mysql.escape(req.body.email)} , ${mysql.escape(req.body.firstName)}, ${mysql.escape(req.body.lastName)});`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return;
        }
        if (results) {
          console.log(`${req.body.email} successfully registered.`);
          con.end();
          req.flash('success', 'Successfully registered. You may now login.');
          return res.redirect('/login');
        }
        else {
          con.end();
          req.flash('error', 'Something Went Wrong. Try Registering Again.');
          return res.redirect('/register');
        }


      });
    }
    else {
      con.end();
      req.flash('error', 'Username is already taken');
      return res.redirect('/register');
    }
  });
});

router.get('/logout', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.logout();
  req.session.destroy();
  return res.redirect('/login');
});

router.get('/forgot-password', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/forgot-password.hbs', {
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/forgot-password', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  req.flash('success', "If this email exists in our system, you will get a password reset email.");
  res.redirect('/login');
  let userEmail = req.body.username;
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/forgot-password');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users WHERE username=${mysql.escape(userEmail)} OR email=${mysql.escape(userEmail)};`, (error, results, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
    }
    if (results.length === 1) {
      let randomID = uuidv4(); // get random new ID. this will be added to the password reset URL we email them so it's fulyl randomized and can't be bruteforced.
      con.query(`UPDATE users SET forgot_password='${randomID}' WHERE username=${mysql.escape(userEmail)} OR email=${mysql.escape(userEmail)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return;
        }
          // let passwordResetURL = `http://67.207.85.51/reset-password/${randomID}`;
          let passwordResetURL = `http://localhost:3000/reset-password/${randomID}`;
          let emailContent = `<p>Hi ${results[0].first_name} ${results[0].last_name},<br><br>Please use the following link to reset your password: ${passwordResetURL}</p><p><br>Best,</p><p>Frindr Team</p>`;
          const mailOptions = {
            from: 'FrindrPurdue@gmail.com',
            to: results[0].email,
            subject: 'Frindr Password Reset',
            html: emailContent
          };
          transporter.sendMail(mailOptions, function (err, info) {
             if(err)
               console.log(err)
             else
               console.log(info);
          });
          con.end();
      });
    } else {
      con.end();
    }
  });
});

router.get('/reset-password/:resetPasswordID', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users WHERE forgot_password=${mysql.escape(req.params.resetPasswordID)};`, (error, results, fields) => {
    if (error) {
          console.log(error.stack);
          con.end();
          return;
    }
    if (results.length === 0) {
      req.flash('error', 'Error.');
      con.end();
      return res.redirect('/login');
    } else if (results.length === 1) {
      con.end();
      return res.render('platform/reset-password.hbs', {
        resetPasswordID: req.params.resetPasswordID,
        email: results[0].email,
        error: req.flash('error'),
      });
    } else {
      con.end();
      req.flash('error', 'Error.');
      return res.redirect('/login');
    }
  });
});

router.post('/reset-password/:resetPasswordID', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  let newPassword = req.body.newPassword;
  let newPassword2 = req.body.newPassword2;
  if (newPassword.includes(' ') || newPassword2.includes(' ')) {
      req.flash('error', 'New Password cannot contain spaces.');
      return res.redirect(`/reset-password/${req.params.resetPasswordID}`);
    }
    if (newPassword.length < 4 || newPassword2.length < 4) {
      req.flash('error', 'Password must be longer than 3 characters.');
      return res.redirect(`/reset-password/${req.params.resetPasswordID}`);
    }
    req.checkBody('newPassword', 'New password field is required.').notEmpty();
    req.checkBody('newPassword2', 'Confirm New password field is required.').notEmpty();
	  req.checkBody('newPassword2', 'New password does not match confirmation password field.').equals(req.body.newPassword);
    let formErrors = req.validationErrors();
    if (formErrors) {
		    req.flash('error', formErrors[0].msg);
        return res.redirect(`/reset-password/${req.params.resetPasswordID}`);
	  }
    let con = mysql.createConnection(dbInfo);
    con.query(`SELECT * FROM users WHERE forgot_password=${mysql.escape(req.params.resetPasswordID)};`, (error, results, fields) => {
      if (error) {
            console.log(error.stack);
            con.end();
            return;
      }
      if (results.length === 0) {
        con.end();
        req.flash('error', 'Error.');
        return res.redirect('/login');
      } else if (results.length === 1) {
        let salt = bcrypt.genSaltSync(10);
        let hashedPassword = bcrypt.hashSync(req.body.newPassword, salt);
        con.query(`UPDATE users SET password='${hashedPassword}', forgot_password='' WHERE forgot_password=${mysql.escape(req.params.resetPasswordID)};`, (error, results, fields) => {
          if (error) {
            console.log(error.stack);
            con.end();
            return;
          }
          con.end();
          req.flash('success', 'Password successfully changed. You may now login.');
          return res.redirect('/login');
        });
      } else {
        con.end();
        req.flash('error', 'Error.');
        return res.redirect('/login');
      }
    });
});

router.get('/dashboard', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  return res.render('platform/dashboard.hbs');
});


module.exports = router;
