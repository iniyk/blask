/**
 * Created by iniyk on 16/3/2.
 */

var express = require('express');
var router = express.Router();

router.get('/upload', function(req, res, next) {
    res.render('test/upload');
});

module.exports.router = router;