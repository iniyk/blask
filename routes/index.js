var express = require('express');
var router = express.Router();
var Panel = require("../models/Panel");

var users = require('./users');
var mongo_controller = require('../models/MongoController');
var data_controller = require('../models/DataController');
var test_controller = require('../models/TestController');

router.use('/users', users);
router.use('/mongodb', mongo_controller.router);
router.use('/data', data_controller.router);
router.use('/test', test_controller.router);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { project_name: 'Blask', current_page: 'index'});
});

/* GET data management page. */
router.get('/data', function(req, res, next) {
    var datas = [];

    datas.push(Panel.Panel(0, "Retial Data", "Retail market basket data", "fa fa-database fa-5x", "panel panel-info"));
    datas.push(Panel.Panel(1, "A Data Folder", "Dataset Folder", "fa fa-folder-open fa-5x", "panel panel-primary"));

    res.render('data', { project_name: 'Blask', title: 'Data Management', current_page: 'data', models: datas});
});

/* GET data mining modules page. */
router.get('/mining', function(req, res, next) {
    var models = [];

    models.push(Panel.Panel(0, "FP-Growth", "Frequent itemset mining algorithm", "fa fa-compress fa-5x", "panel panel-info"));
    models.push(Panel.Panel(1, "Machine Learning", "Folder of machine learning", "fa fa-folder-open fa-5x", "panel panel-primary"));
    models.push(Panel.Panel(2, "FP-Growth", "Frequent itemset mining algorithm", "fa fa-compress fa-5x", "panel panel-info"));
    models.push(Panel.Panel(3, "FP-Growth very loooooooooooooooooooooog", "Frequent itemset mining algorithm", "fa fa-compress fa-5x", "panel panel-info"));
    models.push(Panel.Panel(4, "FP-Growth short short short", "Frequent itemset mining algorithm", "fa fa-compress fa-5x", "panel panel-info"));
    models.push(Panel.Panel(5, "FP-Growth", "Frequent itemset mining algorithm", "fa fa-compress fa-5x", "panel panel-info"));

    res.render('mining', { project_name: 'Blask', title: 'Data Mining', current_page: 'mining', models: models});
});

module.exports = router;
