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
var NodeGeocoder = require('node-geocoder');
const dotenv = require('dotenv');
var cloudinary = require('cloudinary').v2;
const multer = require('multer'); // file storing middleware
cloudinary.config({
  cloud_name: 'frindr',
  api_key: '977515228941379',
  api_secret: '06MnR5rWItBmatsb9RQWRu_TjQE'
});

dotenv.config();

import {
  postProfile,
  patchBio,
  patchCharacteristics,
  patchInterests,
  patchName,
  getProfile,
  deleteProfile,
  makeMatch
} from "../functions/profile";

import {
  getMatches,
  patchBlock,
} from "../functions/matching";

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NOTIFCATION_EMAIL,
    pass: process.env.NOTIFICATION_PASS
  }
});

let dbInfo = {
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  multipleStatements: true
};

const LocalStrategy = require('passport-local').Strategy;
const AuthenticationFunctions = require('../Authentication.js');

/**Profile stuff */
router.post('/api/profile', postProfile);
router.get('/api/profile', getProfile);
router.delete('/api/profile', deleteProfile);
router.patch('/api/name', patchName);
router.patch('/api/bio', patchBio);
router.patch('/api/interests', patchInterests);
router.patch('/api/characteristics', patchCharacteristics);

/**Matching algorithm */
router.get('/api/matches', getMatches)

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
  async function (req, username, password, done) {
    //location
    var geocoder = NodeGeocoder({
      provider: 'google',
      httpAdapter: 'https',
      apiKey: process.env.API_KEY,
      formatter: null
    });

    var myLocationVariable = 'just initialing it here'
    await geocoder.reverse({ lat: req.body.latitude, lon: req.body.longitude })
      .then(function (res) {
        var city = res[0].administrativeLevels.level2short.replace(/\s/g, '');
        var state = res[0].administrativeLevels.level1short.replace(/\s/g, '');
        myLocationVariable = city + state;
      })
      .catch(function (err) {
        console.log(err);
      });
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
          con.query(`UPDATE profile SET location=${mysql.escape(myLocationVariable)} WHERE email=${mysql.escape(user.email)};`, (error, results, fields) => {
            if (error) {
              console.log(error.stack);
              con.end();
              return;
            }
            con.end();
            return done(null, user);
          });
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
          if (err)
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

router.get('/dashboard', AuthenticationFunctions.ensureAuthenticated, async (req, res) => {
  req.body = req.user;

  let email = await getMatches(req);
  if (email.error === true) { //if no user found
    return res.render('platform/dashboard.hbs', {
      usersDoNotExist: true,
    });
  }

  await getProfile(email.message).then(user => {
    if (user.error == false) {
      console.log();
      return res.render('platform/dashboard.hbs', {
        pageName: 'Dashboard',
        currentUser: req.user,
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
        user_pictures: user.message.message.pictures,
        user_name: user.message.message.name,
        user_email: user.message.message.email
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

router.get('/profile', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  getProfile(req.user.email).then(result => {
    if (result.error == false) {
      if (Object.entries(result.message.message.interests).length === 0 && result.message.message.interests.constructor === Object) {
        result.message.message.interests = [];
      }
      return res.render('platform/profile.hbs', {
        pageName: 'Profile',
        currentUser: req.user,
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
        user_pictures: result.message.message.pictures,
        user_email: result.message.message.email
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

router.post('/profile/update', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.checkBody('name', 'Name field is required.').notEmpty();
  req.checkBody('bio', 'Bio field is required.').notEmpty();
  let formErrors = req.validationErrors();
  if (formErrors) {
    req.flash('error', formErrors[0].msg);
    return res.redirect('/profile');
  }
  console.log(req.body);
  patchName(req.body.name, req.user.email).then(result => {
    if (result.error == false) {
      patchBio(req.body.bio, req.user.email).then(resultBio => {
        if (result.error == false) {
          let con = mysql.createConnection(dbInfo);
          if (req.body.notifications) {
            con.query(`UPDATE profile SET notifications=1 WHERE email=${mysql.escape(req.user.email)};`, (error, resultsUpdate, fields) => {
              if (error) {
                console.log(error);
                con.end();
                req.flash('error', "Error.");
                return res.redirect('/profile');
              }
              con.end();
              req.flash('success', 'Updated your profile.');
              return res.redirect('/profile');
            });
          } else {
            con.query(`UPDATE profile SET notifications=0 WHERE email=${mysql.escape(req.user.email)};`, (error, resultsUpdate, fields) => {
              if (error) {
                console.log(error);
                con.end();
                req.flash('error', "Error.");
                return res.redirect('/profile');
              }
              con.end();
              req.flash('success', 'Updated your profile.');
              return res.redirect('/profile');
            });
          }
        }
      }).catch(error => {
        req.flash('error', "Error.");
        return res.redirect('/profile');
      });
    } else {
      req.flash('error', "Error.");
      return res.redirect('/profile');
    }
  }).catch(error => {
    console.log(error);
    req.flash('error', "Error.");
    return res.redirect('/profile');
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

router.post(`/profile/update-block`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  console.log("UPDATING BLOCK STATUS");
  console.log(req.user);
  patchBlock(req).then(result => {
    req.flash('success', 'Status updated');
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

router.post(`/checkmatch`, AuthenticationFunctions.ensureAuthenticated, async (req, res) => {
  let email = req.body.email;
  let currentUserEmail = req.user.email;
  let userChoice = req.body.choice;
  //add to seen listen
  await getProfile(currentUserEmail).then(results => {
    if (results.error == false) {
      var seenList;// = results.message.message.seen;
      var potentialMatchList;

      if (!results.message.message.potentialMatchList) {
        potentialMatchList = [];
      }
      else {
        potentialMatchList = results.message.message.potentialMatchList;
      }

      /*
        Add user to potentialMatchList if selected Yes
      */
      if (userChoice === 'yes') {
        potentialMatchList.push(email);
      }

      /*
        Add user to seen list
      */
      if (!results.message.message.seen) {
        seenList = [];
      }
      else {
        seenList = results.message.message.seen;
      }
      seenList.push(email);

      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET seen='${JSON.stringify(seenList)}', potentialMatches='${JSON.stringify(potentialMatchList)}' WHERE email=${mysql.escape(currentUserEmail)};`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return;
        }


        if (userChoice === 'yes') {
          getProfile(email).then(seenResult => {
            if (seenResult.error == false) {
              if (!seenResult.message.message.potentialMatchList || seenResult.message.message.potentialMatchList.length == 0) {

              }
              else {
                if (seenResult.message.message.potentialMatchList.includes(currentUserEmail)) {
                  makeMatch(currentUserEmail, email);
                }
              }

            }
          }).catch(error => {
            console.log(error);
            req.flash('error', 'Error.');
            return res.redirect('/dashboard');
          });

        }
        con.end();
      });
      return res.redirect('/dashboard');

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


router.get('/matches', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  getProfile(req.user.email).then(result => {
    if (result.error == false) {
      if (!result.message.message.matches || (Object.entries(result.message.message.matches).length === 0 && result.message.message.matches.constructor === Object)) {
        return res.render('platform/matches.hbs', {
          noMatches: true,
        });
      }
      if (result.message.message.matches.length === 0) {
        return res.render('platform/matches.hbs', {
          noMatches: true,
        });
      }
      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM profile WHERE email IN (?);`, [result.message.message.matches], (error, results, fields) => {
        if (error) {
          con.end();
          console.log(error);
          return res.send();
        }
        con.end();
        return res.render('platform/matches.hbs', {
          pageName: 'My Matches',
          currentUser: req.user,
          matches: results,
          error: req.flash('error'),
          success: req.flash('success'),
        });
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

const upload = require("../functions/multer");

router.post('/profile/photo', upload.single("image"), AuthenticationFunctions.ensureAuthenticated, async (req, res) => {

  let result;
  try {
    result = await cloudinary.uploader.upload(req.file.path);
  } catch (error) {

    req.flash('error', 'Error: no photo selected.');
    return res.redirect('/profile');
  }


  var photo_url = result.secure_url;
  let email = req.user.email;
  //get the current users current photo array, may be updated late to be more efficient
  getProfile(email).then(currentValues => {
    var currentPhotoList;
    if (!currentValues.message.message.pictures) {
      currentPhotoList = [];
    }
    else {
      currentPhotoList = currentValues.message.message.pictures;
    }
    currentPhotoList.push(photo_url);
    let con = mysql.createConnection(dbInfo);
    con.query(`UPDATE profile SET pictures='${JSON.stringify(currentPhotoList)}' WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
      if (error) {
        console.log(error.stack);
        con.end();
        req.flash('error', 'Error uploading photo.');
        return res.redirect('/profile');
      }
      con.end();
      req.flash('success', 'Successfully uploaded photo.');
      return res.redirect('/profile');
    });
  }).catch(error => {
    console.log(error);
    req.flash('error', 'Error uploading photo.');
    return res.redirect('/profile');
  });
});


router.post('/profile/photo_delete', AuthenticationFunctions.ensureAuthenticated, async (req, res) => {
  //console.log(req.body.subject);
  let image_to_delete = req.body.subject;
  let email = req.user.email;
  //get the current users current photo array, may be updated late to be more efficient
  getProfile(email).then(currentValues => {
    var currentPhotoList;
    currentPhotoList = currentValues.message.message.pictures;

    if (currentPhotoList) {
      var index = currentPhotoList.indexOf(image_to_delete);
      if (index > -1) {
        currentPhotoList.splice(index, 1);
      }

      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET pictures='${JSON.stringify(currentPhotoList)}' WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          req.flash('error', 'Error deleting photo.');
          return res.redirect('/profile');
        }
        con.end();
        req.flash('success', 'Successfully deleted photo.');
        return res.redirect('/profile');
      });
    }
  }).catch(error => {
    console.log(error);
    req.flash('error', 'Error deleting photo.');
    return res.redirect('/profile');
  });
  let file_to_delete = image_to_delete.substring(image_to_delete.lastIndexOf("/") + 1,
    image_to_delete.lastIndexOf("."));
  cloudinary.uploader.destroy(file_to_delete, function (result) { });
});

router.get(`/matches/unmatch`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let unmatchEmail = req.query.user;
  getProfile(req.user.email).then(currentUser => {
    if (currentUser.error == false) {
      if (!currentUser.message.message.matches || (Object.entries(currentUser.message.message.matches).length === 0 && currentUser.message.message.matches.constructor === Object)) {
        req.flash('error', 'User not found.');
        return res.redirect('/dashboard');
      }
      if (!currentUser.message.message.matches.includes(unmatchEmail)) {
        req.flash('error', 'User not found.');
        return res.redirect('/matches');
      }
      getProfile(unmatchEmail).then(unmatchEmailUser => {
        if (unmatchEmailUser.error == false) {
          if (!unmatchEmailUser.message.message.matches.includes(req.user.email)) {
            req.flash('error', 'User not found.');
            return res.redirect('/matches');
          }
          _.remove(currentUser.message.message.matches, function (email) {
            return email === unmatchEmail;
          });
          _.remove(unmatchEmailUser.message.message.matches, function (email) {
            return email === req.user.email;
          });
          let con = mysql.createConnection(dbInfo);
          con.query(`UPDATE profile SET matches='${JSON.stringify(currentUser.message.message.matches)}' WHERE email=${mysql.escape(req.user.email)};`, (error, updatingCurrentUserResult, fields) => {
            if (error) {
              console.log(error);
              con.end();
              req.flash('error', 'Error.');
              return res.redirect('/matches');
            }
            con.query(`UPDATE profile SET matches='${JSON.stringify(unmatchEmailUser.message.message.matches)}' WHERE email=${mysql.escape(unmatchEmail)};`, (error, updatingCurrentUserResult, fields) => {
              if (error) {
                console.log(error);
                con.end();
                req.flash('error', 'Error.');
                return res.redirect('/matches');
              }
              con.query(`DELETE FROM messages WHERE (sender=${mysql.escape(req.user.email)} AND recipient=${mysql.escape(unmatchEmail)}) OR (sender=${mysql.escape(unmatchEmail)} AND recipient=${mysql.escape(req.user.email)});`, (error, deleteResults, fields) => {
                if (error) {
                  console.log(error);
                  con.end();
                  req.flash('error', 'Error.');
                  return res.redirect('/matches');
                }
                con.end();
                req.flash('success', 'Successfully unmatched.');
                return res.redirect('/matches');
              });
            });
          });
        } else {
          console.log('here1');
          req.flash('error', 'Error.');
          return res.redirect('/matches');
        }
      }).catch(error => {
        console.log('here2');
        console.log(error);
        req.flash('error', "Error.");
        return res.redirect('/matches');
      });
    } else {
      console.log('here3');
      req.flash('error', 'Error.');
      return res.redirect('/matches');
    }
  }).catch(error => {
    console.log('here4');
    console.log(error);
    req.flash('error', "Error.");
    return res.redirect('/matches');
  });
});

router.get(`/matches/chat/`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  getProfile(req.user.email).then(result => {
    if (result.error == false) {
      if (!result.message.message.matches || (Object.entries(result.message.message.matches).length === 0 && result.message.message.matches.constructor === Object)) {
        req.flash('error', 'User not found.');
        return res.redirect('/matches');
      }
      if (!result.message.message.matches.includes(req.query.recipient)) {
        req.flash('error', 'User not found.');
        return res.redirect('/matches');
      }
      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM profile WHERE email IN (?);`, [result.message.message.matches], (error, results, fields) => {
        if (error) {
          con.end();
          console.log(error);
          return res.send();
        }
        con.end();

        return res.render('platform/chat.hbs', {
          pageName: 'Chat',
          currentUser: req.user,
          recipientUser: req.query.recipient,
          error: req.flash('error'),
          success: req.flash('success'),
        });
      });
    } else {
      req.flash('error', 'Error.');
      return res.redirect('/matches');
    }
  }).catch(error => {
    req.flash('error', "Error.");
    return res.redirect('/matches');
  });
});

router.get(`/matches/chat/messages`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM messages WHERE (sender=${mysql.escape(req.query.currentUser)} AND recipient=${mysql.escape(req.query.recipientUser)}) OR (sender=${mysql.escape(req.query.recipientUser)} AND recipient=${mysql.escape(req.query.currentUser)}) ORDER BY date DESC;`, (error, messages, fields) => {
    if (error) {
      console.log(error);
      con.end();
      return res.send();
    }
    return res.send(messages);
  });
});

router.post(`/matches/chat/messages`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`INSERT INTO messages (id, sender, recipient, message_content) VALUES (${mysql.escape(req.body.id)}, ${mysql.escape(req.body.currentUser)}, ${mysql.escape(req.body.recipientUser)}, ${mysql.escape(req.body.sendMessageContent)});`, (error, result, fields) => {
    if (error) {
      console.log(error);
      con.end();
      return res.send();
    }
    req.io.sockets.emit('message', req.body);
    return res.sendStatus(200);
  });
});

router.get(`/matches/chat/like/:id`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM messages WHERE id=${mysql.escape(req.params.id)};`, (error, messages, fields) => {
    if (error) {
      console.log(error);
      req.flash('error', 'Error.');
      con.end();
      return res.redirect('/matches');
    }
    if (messages.length === 1) {
      con.query(`UPDATE messages SET liked=1 WHERE id=${mysql.escape(req.params.id)};`, (error, updateResult, fields) => {
        if (error) {
          console.log(error);
          req.flash('error', 'Error.');
          con.end();
          return res.redirect(`/matches/chat?recipient=${messages[0].sender}`);
        }
        req.flash('success', 'Liked message.');
        con.end();
        return res.redirect(`/matches/chat?recipient=${messages[0].sender}`);
      });
    } else {
      req.flash('error', 'Error.');
      con.end();
      return res.redirect('/matches');
    }
  });
});

router.get(`/matches/chat/unlike/:id`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM messages WHERE id=${mysql.escape(req.params.id)};`, (error, messages, fields) => {
    if (error) {
      console.log(error);
      req.flash('error', 'Error.');
      con.end();
      return res.redirect('/matches');
    }
    if (messages.length === 1) {
      con.query(`UPDATE messages SET liked=0 WHERE id=${mysql.escape(req.params.id)};`, (error, updateResult, fields) => {
        if (error) {
          console.log(error);
          req.flash('error', 'Error.');
          con.end();
          return res.redirect(`/matches/chat?recipient=${messages[0].sender}`);
        }
        req.flash('success', 'Unliked message.');
        con.end();
        return res.redirect(`/matches/chat?recipient=${messages[0].sender}`);
      });
    } else {
      req.flash('error', 'Error.');
      con.end();
      return res.redirect('/matches');
    }
  });
});



module.exports = router;
