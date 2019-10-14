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
const geolib = require('geolib');
import {
  postProfile,
  patchBio,
  patchCharacteristics,
  patchInterests,
  patchName,
  getProfile,
  deleteProfile,
} from "../functions/profile";

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

/**Profile stuff */
router.post('/api/profile',  postProfile);
router.get('/api/profile',  getProfile);
router.delete('/api/profile',  deleteProfile);
router.patch('/api/name', patchName);
router.patch('/api/bio', patchBio);
router.patch('/api/interests', patchInterests);
router.patch('/api/characteristics', patchCharacteristics);



router.get('/', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  return res.redirect('/dashboard');
});

router.get('/login', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/login.hbs', {
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/location', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/locationTestPage.hbs', {
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
    con.query(`SELECT * FROM profile WHERE email=${mysql.escape(username)};`, (error, results, fields) => {
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
            email: results[0].email,
            name: results[0].name,
          };
          // con.query(`UPDATE users SET latitude=${mysql.escape(req.body.latitude)}, longitude=${mysql.escape(req.body.longitude)} WHERE username=${mysql.escape(user.username)};`, (error, results, fields) => {
          //     //need some error checking here

          //     con.end();


          // });
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
  req.checkBody('name', 'Name field is required.').notEmpty();
  req.checkBody('email', 'Email field is required.').notEmpty();
  req.checkBody('password', 'Password field is required.').notEmpty();
  req.checkBody('password2', 'Confirm password field is required.').notEmpty();
  req.checkBody('password2', 'Password does not match confirmation password field.').equals(req.body.password);
  if (req.body.password.length < 3) {
      req.flash('error', 'Password must be longer than 3 characters.');
      return res.redirect('/register');
  } else if (req.body.password.includes(' ')) {
    req.flash('error', 'Password cannot contain spaces.');
    return res.redirect('/register');
  }
  let formErrors = req.validationErrors();
  if (formErrors) {
    req.flash('error', formErrors[0].msg);
    return res.redirect('/register');
  }
  let salt = bcrypt.genSaltSync(10);
  let hashedPassword = bcrypt.hashSync(req.body.password, salt);
  req.body.password = hashedPassword;
  postProfile(req).then(result => {
    console.log(result);
    if (result.error == false) {
      req.flash('success', "Successfully registered. You may now login.");
      return res.redirect('/login');
    } else {
      req.flash('error', result.message);
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
  let userEmail = req.body.email;
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/forgot-password');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM profile WHERE email=${mysql.escape(userEmail)};`, (error, results, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
    }
    if (results.length === 1) {
      let randomID = uuidv4(); // get random new ID. this will be added to the password reset URL we email them so it's fulyl randomized and can't be bruteforced.
      con.query(`UPDATE profile SET forgot_password='${randomID}' WHERE email=${mysql.escape(userEmail)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return;
        }
          let passwordResetURL = `http://67.207.85.51/reset-password/${randomID}`;
          let emailContent = `<p>Hi ${results[0].name},<br><br>Please use the following link to reset your password: ${passwordResetURL}</p><p><br>Best,</p><p>Frindr Team</p>`;
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
  let email = req.user.email;
  getProfile(email).then(user => {
    if (user.error == false) {
      return res.render('platform/dashboard.hbs', {
        user: user.message.message,
        error: req.flash('error'),
        success: req.flash('success'),
        user_characteristics: user.message.message.characteristics,
        height: user.message.message.characteristics['height'],
        exercise: user.message.message.characteristics['exercise'],
        education: user.message.message.characteristics['education'],
        drinking: user.message.message.characteristics['drinking'],
        smoking: user.message.message.characteristics['smoking'],
        pets: user.message.message.characteristics['pets'],
        religious: user.message.message.characteristics['religious'],
        user_interests: user.message.message.interests,
      });
    } else {
      req.flash('error', 'Error.');
      return res.redirect('/dashboard');
    }
  }).catch(error => {
    console.log(error);
    req.flash('error', 'Error.');
    return res.redirect('/dashboard');
  });
});


router.get('/distance/:lat1/:lng1/:lat2/:lng2', function(req, res){
  var distance = geolib.getDistance({latitude: req.params.lat1, longitude: req.params.lng1 }, {latitude: req.params.lat2, longitude: req.params.lng2});

  res.send('Distance from ' + req.params.lat1 + ',' + req.params.lng1 + ' to ' + req.params.lat2 + ',' + req.params.lng2 + ' is ' + distance + ' km');
});

router.get('/profile', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  getProfile(req.user.email).then(result => {
    if (result.error == false) {
      if (Object.entries(result.message.message.interests).length === 0 && result.message.message.interests.constructor === Object) {
          result.message.message.interests = [];
      }
      return res.render('platform/profile.hbs', {
        user: result.message.message,
        error: req.flash('error'),
        success: req.flash('success'),
        user_characteristics: result.message.message.characteristics,
        height: result.message.message.characteristics['height'],
        exercise: result.message.message.characteristics['exercise'],
        education: result.message.message.characteristics['education'],
        drinking: result.message.message.characteristics['drinking'],
        smoking: result.message.message.characteristics['smoking'],
        pets: result.message.message.characteristics['pets'],
        religious: result.message.message.characteristics['religious'],
        user_interests: result.message.message.interests,
      });
    } else {
      req.flash('error', 'Error.');
      return res.redirect('/dashboard');
    }
  }).catch(error => {
    req.flash('error', "Error.");
    return res.redirect('/dashboard');
  });
});

router.post(`/profile/change-password`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.checkBody('currentPassword', 'Current Password field is required.').notEmpty();
  req.checkBody('newPassword2', 'New password does not match confirmation password field.').equals(req.body.newPassword);
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/profile');
	}
  if (req.body.newPassword.length < 3) {
      req.flash('error', 'Password must be longer than 3 characters.');
      return res.redirect('/profile');
  } else if (req.body.newPassword.includes(' ')) {
    req.flash('error', 'Password cannot contain spaces.');
    return res.redirect('/profile');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM profile WHERE email=${mysql.escape(req.user.email)};`, (error, results, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      return;
    }
    if (results.length == 1) {
      if (bcrypt.compareSync(req.body.currentPassword, results[0].password)) {
          let salt = bcrypt.genSaltSync(10);
          let hashedPassword = bcrypt.hashSync(req.body.newPassword, salt);
          con.query(`UPDATE profile SET password=${mysql.escape(hashedPassword)} WHERE email=${mysql.escape(req.user.email)};`, (error, results, fields) => {
            if (error) {
              console.log(error.stack);
              con.end();
              return res.send();
            }
            con.end();
            req.flash('success', 'Password successfully updated.');
            return res.redirect('/profile');
          });
      } else {
        req.flash('error', 'Current password is incorrect.')
        con.end();
        return res.redirect('/profile');
      }
    }
  });
});

router.post(`/profile/delete-profile`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  deleteProfile(req).then(result => {
    if (result.error == false) {
      req.logout();
      req.session.destroy();
      return res.redirect('/login');
    } else {
      req.flash('error', 'Error deleting profile.');
      return res.redirect('/profile');
    }
  }).catch(error => {

  });
});

router.post(`/profile/update-interests`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  patchInterests(req).then(result => {
    req.flash('success', 'Updated interests.');
    return res.redirect('/profile');
  }).catch(error => {
    req.flash('error', 'Error.');
    return res.redirect('/profile');
  });
});

router.post(`/profile/update-characteristics`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  patchCharacteristics(req).then(result => {
    req.flash('success', 'Updated characteristics.');
    return res.redirect('/profile');
  }).catch(error => {
    req.flash('error', 'Error.');
    return res.redirect('/profile');
  });
});



module.exports = router;
