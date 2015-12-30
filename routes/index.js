var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { project_name: 'Blask', current_page: 'index'});
});

/* GET data management page. */
router.get('/data', function(req, res, next) {
    //res.send("Data");
    res.render('data', { project_name: 'Blask', title: 'Data Management', current_page: 'data'});
});

module.exports = router;
