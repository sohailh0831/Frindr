const express = require('express');
const AuthenticationFunctions = require('../Authentication.js');
const expressValidator = require('express-validator');
const mysql = require('mysql');
const router = express.Router();
const flash = require('connect-flash');
import {
   getProfileIntern
  } from "./profile";


let dbInfo = {
  connectionLimit: 100,
  host: '67.207.85.51',
  user: 'frindrDB',
  password: 'PurdueTesting1!',
  database: 'frindr',
  port: 3306,
  multipleStatements: true
};

export const getMatches = async (req) => {
    try {
        if (!req.body.email) {
          throw new Error("Need email")
        }
        let results = await getProfileIntern(req);
        if (results.error == true) {
          return results;
        }
        const userProfile = results.message;
        let seenList = JSON.parse(userProfile.seen);
        if (seenList === null){
          seenList = [];
        }
        results = await getProfilesStoreMatches(req,userProfile.location);
        if (results.error == true) {
            return results;
          }
        console.log(results);
        let list = [];
        let userInterests = userProfile.interests;
        for (var i = 0; i < results.message.length; i++){
          let current = results.message[i];
          if (seenList.includes(current.email)){
            continue;
          }
          interests = JSON.parse(userInterests);
          let count = 0;
          for(var j = 0; j < interests.length; j++){
            let currKey = interests[i];
            if(current[currKey] === userInterests[currKey]){
              count++;
            }
          }
          list.push({user: current, count: count})
        }
        for (var i = 1; i < list.length; i++){ //sort list
          for (var j = i; j > 0; j--){
            if(list[j].count < list[j-1].count){
              let temp = list[j];
              list[j] = list[j-1];
              list[j-1] = temp;
            }
          }
        }
        console.log(list);
        return {message: list[0].email, error: false};
      } catch (error) {
        return { error: true, message: error.stack };
      }
};

export const patchBlock = async (req) => {
  try {
    if (!req.body.email || typeof req.body.block !== undefined) {
      throw new Error("Need email and block boolean")
    }
    let results = await patchBlockStore(req);
    if (results.error == false) {
      return results;
    }
    else {
      return results;
    }
  } catch (error) {
    return { error: true, message: error.stack };
  }
};

export const patchSeen = async (req) => {
  try {
    if (!req.body.email || typeof req.body.block !== undefined) {
      throw new Error("Need email and block boolean")
    }
    let results = await patchSeenStore(req);
    if (results.error == false) {
      return results;
    }
    else {
      return results;
    }
  } catch (error) {
    return { error: true, message: error.stack };
  }
};


function getProfilesStoreMatches(req,location){
  return new Promise(resolve => {
      try {
        let con = mysql.createConnection(dbInfo);
        con.query(`SELECT * FROM profile WHERE location='${location}';`, (error, results, fields) => {
          if (error) {
            console.log(error.stack);
            con.end();
            resolve({ error: true, message: error, found: false })
          }
          if (results.length == 0) {
            con.end();
            req.flash('error', 'Profiles not found');
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

function patchBlockStore(req) {
  let email = req.body.email;
  let block = JSON.stringify(req.body.block);
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET block=${mysql.escape(block)} WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
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

function patchSeenStore(req) {
  let email = req.body.email;
  let block = JSON.stringify(req.body.seen);
  return new Promise(resolve => {
    try {
      let con = mysql.createConnection(dbInfo);
      con.query(`UPDATE profile SET seen=${mysql.escape(block)} WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
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
