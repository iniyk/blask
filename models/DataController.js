/**
 * Created by iniyk on 16/2/11.
 */

var express = require('express');
var router = express.Router();

var common = require('./Common');
var _ = require('underscore');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var Logger = require('./Logger')();
var logger = Logger.handle("DataController");

var MongoController = require('./MongoController');

//GET /data/:id
router.get('/:id(\\d+)', function(req, res, next) {
    //TODO 显示单个数据集
});

//GET /data/:id/edit
router.get('/:id(\\d+)/edit', function(req, res, next) {
    //TODO 编辑数据集信息
});

//GET /data/:id/create
router.get('/:id(\\d+)/create', function(req, res, next) {
    //TODO 创建新的数据集
});

//GET /data/
router.get('/', function(req, res, next) {
    //TODO 列出所有数据集
});

//POST /data/upload
router.post('/upload', upload.single('datafile'), function (req, res, next) {
    logger.info('Start upload.');
    logger.info(req.file);

    var name = req.file.originalname.split('.')[0];
    var tmp_path = req.file.path;
    var type = req.file.originalname.split('.')[1];

    logger.info('Receive file : ' + name);
    logger.info('File type : ' + type);

    if (type == 'json') {
        logger.info('Set read json callback.');
        common.readJson(tmp_path, function (err, json_arr) {
            if (err) {
                logger.error('On reading json file.');
                logger.error(err);
            } else {
                var keys = _.allKeys(_.first(json_arr));
                var pairs = _.pairs(_.first(json_arr));
                var schema = {};

                _.each(pairs, function (pair) {
                    var key = pair[0], value = pair[1];
                    schema[key] = value.constructor;
                });

                logger.info(schema);
                MongoController.registerSchema(name, schema, 'datasets');

                _.each(_.values(json_arr), function (json) {
                    MongoController.insert(name, json);
                });
            }
        });
        res.status(201).send({info: 'Upload successed.'});
    } else {
        var err = type + ' is not a support data set file type.';
        logger.warn(err);
        res.status(500).send({ error: err });
    }

});

module.exports.router = router;