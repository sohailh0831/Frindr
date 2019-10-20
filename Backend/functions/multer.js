const express = require('express');
const flash = require('connect-flash');

const multer = require("multer");

module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req,file,cb) => {
        if (!file.mimetype.match(/jpe|jpeg|png|gif$i/)) {
            //cb (new Error('File is not supported'), false)
            //req.flash('error', 'Error uploading photo.');
            //return res.redirect('/profile');
        }
        cb(null, true)
    }
})