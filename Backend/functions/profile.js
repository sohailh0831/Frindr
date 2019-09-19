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

  export const postProfile = async (req, res) =>{
    let results = await postProfileStore(req);
    return res.status('201').send(results);
}

export const getProfile = async (req, res) => {
    let results = await getProfileStore(req);
    return res.status('200').send(results);
}
export const patchName = async (req, res) =>{
    let results = await patchNameStore(req);
    return res.status('200').send(results);
}
export async function patchBio(req, res){
    let con = mysql.createConnection(dbInfo);
    let email = req.body.email;
    let bio = req.body.bio;
    con.query(`UPDATE profile SET bio=${mysql.escape(bio)} WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return error;
        }
          con.end();
          return res;
      });
}
export async function patchInterests(req, res){
    let email = req.body.email;
    let interests = JSON.stringify(req.body.interests);
    let con = mysql.createConnection(dbInfo);
    con.query(`UPDATE profile SET interests='${interests}' WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return error;
        }
          con.end();
          return res;
      });
}
export async function patchCharacteristics(req, res){
    let email = req.body.email;
    let characteristics = JSON.stringify(req.body.characteristics);

    let con = mysql.createConnection(dbInfo);
    con.query(`UPDATE profile SET characteristics='${mysql.escape(characteristics)}' WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return error;
        }
          con.end();
          return res;
      });
}
function postProfileStore(req){
    let email = req.body.email;
    let name = req.body.name;
    let bio = req.body.bio;
    let characteristics = JSON.stringify(req.body.characteristics);
    let interests = JSON.stringify(req.body.interests);
    let location = JSON.stringify({});

    return new Promise(resolve => {
        let res;
        let con =  mysql.createConnection(dbInfo);
        res =  con.query(`INSERT INTO profile (email, name, bio, interests, location, characteristics) VALUES (${mysql.escape(email)}, ${mysql.escape(name)}, ${mysql.escape(bio)}, '${interests}', '${location}', '${characteristics}');`, (error, results, fields) => {
            if (error) {
                console.log(error.stack);
                con.end();
                resolve({error: true, message: error})
            }
            if (results) {
                console.log(`${email} profile registered.`);
                con.end();
                req.flash('success', 'Successfully created profile.');
                res = results;
                console.log(res)
                resolve({error: false, message: results});
            }
            else {
                con.end();
                req.flash('error', 'Something Went Wrong. Try Again later.');
                resolve({error: true, message: 'something is wrong'})
            }
        });
    });
}
function getProfileStore(req){
    let email = req.body.email;
    return new Promise(resolve => {
        let con = mysql.createConnection(dbInfo);
        con.query(`SELECT * FROM profile WHERE email=${mysql.escape(email)};`, (error, results, fields) => { 
            if (error) {
              console.log(error.stack);
              con.end();
              resolve({error: true, message: error})
            }
            if (results.length == 0) {
                con.end();
                req.flash('error', 'Profile not found');
                resolve({error: true, message: "No profile found"})
            }
            else if (results){
              con.end();
              req.flash('success', 'Profile found');
              resolve({error: false, message: results})

            }
          });
    });
}
function patchNameStore(req){
    let email = req.body.email;
    let name = req.body.name;
    return new Promise(resolve => {
        let con = mysql.createConnection(dbInfo);
        con.query(`UPDATE profile SET name=${mysql.escape(name)} WHERE email=${mysql.escape(email)};`, (error, resultsUpdate, fields) => {
            if (error) {
              console.log(error.stack);
              con.end();
              resolve({error: true, message: error})
            }
              con.end();
              resolve({error: false, message: results})
          });
    });
}