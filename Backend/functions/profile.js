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

export const postProfile = async (req) => {
  try {
    if (!req.body.email) {
      return {error: true, message: "Email is needed."};
    }
    let check = await getProfileStore(req.body.email);
    if (check.found === false) {
      let results = await postProfileStore(req);
      if (results.error == false) {
        return {error: false, message: results};
      }
      else {
        return {error: true, message: results};
      }
    }
    else {
      return {error: true, message: "This profile already exists."};
    }
  } catch (error) {
    return {error: true, message: "Error."};
  }
}

export const getProfile = async (email) => {
  try {
    if (!email) {
      throw new Error("Need email");
    }
    let results = await getProfileStore(email);
    if (results.error == false) {
      results.message.interests = JSON.parse(results.message.interests);
      results.message.characteristics = JSON.parse(results.message.characteristics);
      results.message.pictures = JSON.parse(results.message.pictures);
      results.message.seen = JSON.parse(results.message.seen);
      results.message.potentialMatchList = JSON.parse(results.message.potentialMatches);
      results.message.matches = JSON.parse(results.message.matches);
      return {error: false, message: results};
    }
    else {
      return {error: true, message: "Profile not found."};
    }
  } catch (error) {
    return error;
  }
}

export const makeMatch = async (currentUserEmail,email) => {
  try {
    if (!email || !currentUserEmail) {
      throw new Error("Need email");
    }

    getProfile(email).then( firstResult => {
          if(firstResult.error == false){
              var firstMatchList;
              if(!firstResult.message.message.matches){
                firstMatchList = [];
              }
              else{
                firstMatchList = firstResult.message.message.matches;
              }
              firstMatchList.push(currentUserEmail);
              let con = mysql.createConnection(dbInfo);
              con.query(`UPDATE profile SET matches='${JSON.stringify(firstMatchList)}' WHERE email=${mysql.escape(email)};`, (error, results, fields) => {
                if (error) {
                  console.log(error.stack);
                  con.end();
                  //resolve({ error: true, message: error })
                }
                else if (results) {
                  con.end();
                  //resolve({ error: false, message: "Added" })
                }
              });
          }
      }).catch(error => {
        console.log(error);
        req.flash('error', 'Error.');
        return res.redirect('/dashboard');
      });


      getProfile(currentUserEmail).then( secondResult => {
            if(secondResult.error == false){
                var secondMatchList;

                if(!secondResult.message.message.matches){
                  secondMatchList = [];
                }
                else{
                  secondMatchList = secondResult.message.message.matches;
                }
                secondMatchList.push(email);
                let con = mysql.createConnection(dbInfo);
                con.query(`UPDATE profile SET matches='${JSON.stringify(secondMatchList)}' WHERE email=${mysql.escape(currentUserEmail)};`, (error, results, fields) => {

                  if (error) {
                    console.log(error.stack);
                    con.end();
                  }
                  else if (results) {
                    con.end();

                  }
                });
            }
        }).catch(error => {
          console.log(error);
          req.flash('error', 'Error.');
          return res.redirect('/dashboard');
        });

    } catch (error) {
        return error;
    }

}




export const getProfileIntern = async (req) => {
  try {

    let results = await getProfileStore(req.body.email);
    return results;
    }catch(error){
      return error
    }
}

export const patchName = async (req, res) => {
  try {
    if (!req.user.email || !req.body.name) {
      throw new Error("Need email and name")
    }
    let results = await patchNameStore(req);
    if (results.error == false) {
      return results;
    }
    else {
      return results;
    }
  } catch (error) {
    return { error: true, message: error.stack };
  }
}

export const patchBio = async (req) => {
  try {
    if (!req.user.email || !req.body.bio) {
      throw new Error("Need email and bio")
    }
    let results = await patchBioStore(req);
    if (results.error == false) {
      return results;
    }
    else {
      return results;
    }
  } catch (error) {
    return { error: true, message: error.stack };
  }
}

export const patchInterests = async (req) => {
  try {
    if (!req.user.email) {
      throw new Error("Need email")
    }
    let results = await patchInterestsStore(req);
    if (results.error == false) {
      return {results: JSON.parse(results.interests)};
    }
    else {
      return results;
    }
  } catch (error) {
    return { error: true, message: error.stack };
  }
}

export const patchCharacteristics = async (req) => {
  try {
    if (!req.user.email || !req.body) {
      throw new Error("Need email and characteristics")
    }
    let results = await patchCharacteristicsStore(req);
    if (results.error == false) {
      return results;
    }
    else {
      return results;
    }
  } catch (error) {
    return { error: true, message: error.stack };
  }
}

export const deleteProfile = async (req) => {
  try {
    let results = await deleteProfileStore(req, req.user.email);
    if (results.error == false) {
      return {error: false, message: results};
    }
    else {
      return {error: true, message: results};
    }
  } catch (error) {
    return error;
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
      res = con.query(`INSERT INTO profile (email, password, name, bio, interests, location, characteristics) VALUES (${mysql.escape(email)}, ${mysql.escape(req.body.password)}, ${mysql.escape(name)}, ${mysql.escape(bio)}, '${interests}', '${location}', '${characteristics}');`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          resolve({ error: true, message: error })
        }
        if (results) {
          console.log(`${email} profile registered.`);
          con.end();
          resolve({ error: false, message: results });
        }
        else {
          con.end();
          resolve({ error: true, message: 'Something Went Wrong. Try Again later.' })
        }
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function getProfileStore(email) {
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
          resolve({ error: true, message: "This profile does not exist.", found: false })
        }
        else if (results) {
          con.end();
          resolve({ error: false, message: results[0], found: true })

        }
      });
    } catch (error) {
      resolve({ error: true, message: error })
    }
  });
}

function patchNameStore(req) {
  let email = req.user.email;
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
  let email = req.user.email;
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
  let email = req.user.email;
  let list;
  if( typeof req.body.param === 'string'){
    list = req.body.param.split(' ')
  }else{
    list = req.body.param;
  }
  //let interests = req.body.param;
  if (!list) list = "";
  let interests = JSON.stringify(list);
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
  let email = req.user.email;
  let characteristics = JSON.stringify(req.body);

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

function deleteProfileStore(req, email) {
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
