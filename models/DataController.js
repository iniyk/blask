/**
 * Created by iniyk on 16/2/11.
 */

var express = require('express');
var router = express.Router();

var common = require('./Common');
var _ = require('underscore');

var Logger = require('./Logger')();
var logger = Logger.handle("DataController");

//GET /data/:id
router.get('/data/:id(\\d+)', function(req, res, next) {
    //TODO 显示单个数据集
});

//GET /data/:id/edit
router.get('/data/:id(\\d+)/edit', function(req, res, next) {
    //TODO 编辑数据集信息
});

//GET /data/:id/create
router.get('/data/:id(\\d+)/create', function(req, res, next) {
    //TODO 创建新的数据集
});

//GET /data/
router.get('/data', function(req, res, next) {
    //TODO 列出所有数据集
});

module.exports.router = router;