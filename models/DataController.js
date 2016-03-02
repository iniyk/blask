/**
 * Created by iniyk on 16/2/11.
 */

var express = require('express');
var router = express.Router();

var common = require('./Common');
var _ = require('underscore');

var Logger = require('./Logger')();
var logger = Logger.handle("DataController");

var MongoController = require('./MongoController');

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

//POST /data/upload
router.get('/data/upload', function (req, res, next) {
    var name = req.files.thumbnail.name;
    var tmp_path = req.files.thumbnail.path;
    var type = req.files.thumbnail.type;

    if (type == 'json') {
        common.readJson(tmp_path, function (err, json_arr) {
            if (err) {
                logger.error('On reading json file : ' + err);
            } else {
                var keys = _.allKeys(_.first(_.values(json_arr)));
                var schema = {};
                var has_id = true;

                _.each(keys, function (key) {
                    schema[key] = String;
                });

                if (_.indexOf(keys, 'id') < 0) {
                    schema['id'] = Number;
                    has_id = false;
                }

                MongoController.registerSchema(name, schema);

                _.each(_.values(json_arr), function (json) {
                    MongoController.insert(name, json);
                });
            }
        });
    }
});

module.exports.router = router;