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

export const getMatches = async (req, res) => {
    try {
        if (!req.body.email) {
          throw new Error("Need email")
        }
        let results = await getProfileIntern(req);
        if (results.error == true) {
          return res.status('400').send(results);
        }
        const userProfile = results.message[0];

        results = await getProfilesStore(req);
        if (results.error == true) {
            return res.status('400').send(results);
          }
        console.log(results);
        

          return;







      } catch (error) {
        return res.status('400').send({ error: true, message: error.stack });
      }
};

function getProfilesStore(req){
    return new Promise(resolve => {
        try {
          let con = mysql.createConnection(dbInfo);
          con.query(`SELECT * FROM profile;`, (error, results, fields) => {
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


