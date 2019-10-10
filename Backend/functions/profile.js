//import {envSetup, envGet} from 'env.json'
//envSetup(); // parse environment variables
const express = require('express');
const AuthenticationFunctions = require('../Authentication.js');
const expressValidator = require('express-validator');
const mysql = require('mysql');
const router = express.Router();
const flash = require('connect-flash');

let dbInfo = {
  connectionLimit: 100,
  host: '67.207.85.51',
  user: 'frindrDB',
  password: 'PurdueTesting1!',
  database: 'frindr',
  port: 3306,
  multipleStatements: true
};

export const postProfile = async (req, res) => {
  try {
    if (!req.body.email) {
      throw new Error("At least need email")
    }
    let check = await getProfileStore(req);
    if (check.found === false) {
      let results = await postProfileStore(req);
      if (results.error == false) {
        return res.status('201').send(results);
      }
      else {
        return res.status('400').send(results);
      }
    }
    else {
      return res.status('400').send({ error: true, message: "Profile with that email already exists" });
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

export const getProfile = async (req, res) => {
  try {
    if (!req.body.email) {
      throw new Error("Need email")
    }
    let results = await getProfileStore(req);
    if (results.error == false) {
      return res.status('200').send(results);
    }
    else {
      return res.status('404').send(results);
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

export const getProfileIntern = async (req) => {
  try {
    let results = await getProfileStore(req);
    return results;
    }catch(error){
      return error
    }
}

export const patchName = async (req, res) => {
  try {
    if (!req.body.email || !req.body.name) {
      throw new Error("Need email and name")
    }
    let results = await patchNameStore(req);
    if (results.error == false) {
      return res.status('200').send(results);
    }
    else {
      return res.status('400').send(results);
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

export const patchBio = async (req, res) => {
  try {
    if (!req.body.email || !req.body.bio) {
      throw new Error("Need email and bio")
    }
    let results = await patchBioStore(req);
    if (results.error == false) {
      return res.status('200').send(results);
    }
    else {
      return res.status('400').send(results);
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

export const patchInterests = async (req, res) => {
  try {
    if (!req.body.email || !req.body.interests) {
      throw new Error("Need email and interests")
    }
    let results = await patchInterestsStore(req);
    if (results.error == false) {
      return res.status('200').send(results);
    }
    else {
      return res.status('400').send(results);
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

export const patchCharacteristics = async (req, res) => {
  try {
    if (!req.body.email || !req.body.characteristics) {
      throw new Error("Need email and characteristics")
    }
    let results = await patchCharacteristicsStore(req);
    if (results.error == false) {
      return res.status('200').send(results);
    }
    else {
      return res.status('400').send(results);
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

export const deleteProfile = async (req, res) => {
  try {
    if (!req.body.email) {
      throw new Error("Need email")
    }
    let results = await deleteProfileStore(req);
    if (results.error == false) {
      return res.status('200').send(results);
    }
    else {
      return res.status('400').send(results);
    }
  } catch (error) {
    return res.status('400').send({ error: true, message: error.stack });
  }
}

function postProfileStore(req) {
  let email = req.body.email;
  let name;
  let bio;
  let interests;
  let characteristics;
  if (req.body.name) name = req.body.name;
  else name = '';
  if (req.body.bio) bio = req.body.bio;
  else bio = '';
  if (req.body.characteristics) characteristics = JSON.stringify(req.body.characteristics);
  else characteristics = JSON.stringify({});
  if (req.body.interests) interests = JSON.stringify(req.body.interests);
  else interests = JSON.stringify({});
  let location = JSON.stringify({});
  return new Promise(resolve => {
    try {
      let res;
      let con = mysql.createConnection(dbInfo);
      res = con.query(`INSERT INTO profile (email, name, bio, interests, location, characteristics) VALUES (${mysql.escape(email)}, ${mysql.escape(name)}, ${mysql.escape(bio)}, '${interests}', '${location}', '${characteristics}');`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        if (results) {
          console.log(`${email} profile registered.`);
          con.end();
          req.flash('success', 'Successfully created profile.');
          res = results;
          resolve({ error: false, message: results });
        }
        else {
          con.end();
          req.flash('error', 'Something Went Wrong. Try Again later.');
          resolve({ error: true, message: 'something is wrong' })
        }
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function getProfileStore(req) {
  let email = req.body.email;
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM profile WHERE email=${mysql.escape(email)};`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error, found: false })
        }
        if (results.length == 0) {
          con.end();
          req.flash('error', 'Profile not found');
          resolve({ error: true, message: "No profile found", found: false })
        }
        else if (results) {
          con.end();
          req.flash('success', 'Profile found');
          resolve({ error: false, message: results, found: true })

        }
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function patchNameStore(req) {
  let email = req.body.email;
  let name = req.body.name;
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET name=${mysql.escape(name)} WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        con.end();
        resolve({ error: false, message: resultsUpdate })
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function patchBioStore(req) {
  let email = req.body.email;
  let bio = req.body.bio;
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET bio=${mysql.escape(bio)} WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        con.end();
        resolve({ error: false, message: resultsUpdate })
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function patchInterestsStore(req) {
  let email = req.body.email;
  let interests = JSON.stringify(req.body.interests);
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET interests='${interests}' WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        con.end();
        resolve({ error: false, message: resultsUpdate })
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function patchCharacteristicsStore(req) {
  let email = req.body.email;
  let characteristics = JSON.stringify(req.body.characteristics);
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET characteristics='${characteristics}' WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        con.end();
        resolve({ error: false, message: resultsUpdate })
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function deleteProfileStore(req) {
  let email = req.body.email;
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`DELETE FROM profile WHERE email=${mysql.escape(email)};`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        if (results.affectedRows === 0) {
          resolve({ error: true, message: results })
        }
        con.end();
        resolve({ error: false, message: results })
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}