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
        let compare;
        if(!req.body.try){
          compare = 5;
        }else if (req.body.try < 6){
          compare = 5-req.body.try;
        } else {
          throw new Error("No results")
        }
        let results = await getProfileIntern(req);
        if (results.error == true) {
          return results;
        }
        const userProfile = results.message[0];
        
        results = await getProfilesStore(req, userProfile.location);
        if (results.error == true) {
            return results;
          }
        console.log(results);
        let list = [];
        let userInterests = userProfile.interests;
        for (var i = 0; i < results.message.length; i++){
          let current = results.message[i];
          interests = JSON.parse(userInterests);
          let keys = Object.keys(interests);
          let count = 0;
          for(var j = 0; j < keys.length; j++){
            let currKey = keys[i];
            if(current[currKey] === userInterests[currKey]){
              count++;
            }
          }
          if (count >= compare){
            list.push(current);
          }
        }
        return list;
      } catch (error) {
        return { error: true, message: error.stack };
      }
};
export const patchBlock = async (req) => {
  try {
    if (!req.body.email || typeof req.body.block !== undefined) {
      throw new Error("Need email and block boolean")
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
};

function getProfilesStore(req, location){
  return new Promise(resolve => {
      try {
        let con = mysql.createConnection(dbInfo);
        con.query(`SELECT * FROM profile where location = ${location};`, (error, results, fields) => {
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
  let block = req.body.block;
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