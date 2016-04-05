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
    var DatasetModel = MongoController.gModel('dataset', 'auto');
    DatasetModel.find({}, function (err, datasets) {
        if (! err) {
            var datasets_tree_arr = transDatasetToTree(datasets);
            res.json(datasets_tree_arr);
        } else {
            logger.error("List Datasets Error!");
            logger.error(err);
        }
    });
});

router.post('/create', function (req, res, next) {
    var name = req.body.name;
    var data = req.body.data;
    logger.debug(`Post Data:`);
    logger.debug(req.body);

    registerJson(name, data);

    res.json({status: 'success'});
});

//POST /data/upload
router.post('/upload', upload.single('datafile'), function (req, res, next) {
    logger.debug('Upload file : ');
    logger.debug(req.file);

    var name = req.file.originalname.split('.')[0];
    var tmp_path = req.file.path;
    var type = req.file.originalname.split('.')[1];

    logger.info('Receive file : ' + name);
    logger.info('File type : ' + type);

    if (type == 'json') {
        // logger.debug('Set read json callback.');
        common.readJson(tmp_path, function (err, json_arr) {
            if (err) {
                logger.error('On reading json file.');
                logger.error(err);
            } else {
                registerJson(name, json_arr);
                //var keys = _.allKeys(_.first(json_arr));
                //var pairs = _.pairs(_.first(json_arr));
                //var schema = {};
                //
                //_.each(pairs, function (pair) {
                //    var key = pair[0], value = pair[1];
                //    schema[key] = value.constructor;
                //});
                //
                //// logger.debug(schema);
                //MongoController.registerSchema(name, schema, 'datasets');
                //
                //_.each(_.values(json_arr), function (json) {
                //    MongoController.insert('datasets', name, json);
                //});
            }
        });
        res.status(201).send({info: 'Upload successed.'});
    } else if (type == 'txt' || type == 'csv') {
        var separator = req.body.separator;
        // logger.debug('Set read txt / csv callback.');
        common.readPlainTextByLine(tmp_path, function(err, lines) {
            if (err) {
                logger.error('On reading txt / csv file.');
                logger.error(err);
            } else {
                var keys = lines[0].split(separator);
                var schema = {};

                _.map(lines[1].split(separator), function(cell, index) {
                    schema[keys[index]] = common.gStringType(cell);
                });

                // logger.debug(schema);
                MongoController.registerSchema(name, schema, 'datasets');

                _.each(lines.slice(1), function (line) {
                    var record = {};
                    _.map(line.split(separator), function (cell, index) {
                        record[keys[index]] = common.realType(cell);
                    });
                    MongoController.insert('datasets', name, record);
                });
            }
            res.status(201).send({info: 'Upload successed.'});
        });
    } else {
        var err = type + ' is not a support data set file type.';
        logger.warn(err);
        res.status(500).send({ error: err });
    }

});

function transDatasetToTree(datasets) {
    var tree = {};
    var tree_arr = [];
    _.map(datasets, function(dataset, index) {
        if (! _.has(tree, dataset.source)) {
            tree[dataset.source] = {
                "text": dataset["source-name"],
                "name": dataset.source,
                "catalog": "catalog",
                "nodes": []
            };
        }
        var node = {
            "text": dataset.text,
            "name": dataset.name,
            "catalog": dataset.source,
            "data": dataset["dataset-schema"]
        };
        tree[node.catalog]["nodes"].push(node);
    });
    _.map(tree, function(node, key) {
        tree_arr.push(node);
    });
    return tree_arr;
}

module.exports.router = router;
module.exports._registerJson = registerJson;
//module.exports.transDatasetToTree = transDatasetToTree;

function registerJson(name, json_arr) {
    if (!_.isArray(json_arr)) {
        var real_json_arr = [];
        var json_length = 0;
        for (var field_name in json_arr) {
            var field = json_arr[field_name];
            json_length = json_length > field.length ? json_length : field.length;
        }
        for (var index=0; index<json_length; index++) {
            var record = {};
            for (var field_name in json_arr) {
                record[field_name] = json_arr[field_name][index];
            }
            real_json_arr.push(record);
        }
        json_arr = real_json_arr;
    }

    var keys = _.allKeys(_.first(json_arr));
    var pairs = _.pairs(_.first(json_arr));
    var schema = {};

    _.each(pairs, function (pair) {
        var key = pair[0], value = pair[1];
        schema[key] = common.gSchema(value.constructor);
    });

    logger.debug(schema);
    MongoController.registerSchema(name, schema, 'datasets');

    logger.debug(json_arr[0]);

    _.each(_.values(json_arr), function (json) {
        MongoController.insert('datasets', name, json);
    });
}