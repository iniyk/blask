/**
 * Created by iniyk on 16/2/11.
 */

var express = require('express');
var router = express.Router();

var async = require('async');

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

router.post('/export', function(req, res, next) {
    var name = req.body.name;
    var text = req.body.text;
    var data_selected = req.body.data;
    var run_id = req.body.run_id;

    var data = {};
    MongoController.find('auto', 'running', {_id: run_id}, function(err, running) {
        _.map(data_selected, function (selected, index) {
           data[selected] = running[0].output[selected];
        });

        registerJsonAndUpdateInfo(name, text, data, res);
    });
});

router.post('/create', function (req, res, next) {
    var name = req.body.name;
    var text = req.body.text;
    var data = req.body.data;

    registerJsonAndUpdateInfo(name, text, data, res);
});

//POST /data/upload/:filetype
router.post('/upload/:filetype([a-z0-9]+)', upload.single('datafile'), function (req, res, next) {
    var type = req.params.filetype;
    var name = req.body.name;
    var text = req.body.text;
    var tmp_path = req.file.path;

    if (type == 'json') {
        common.readJson(tmp_path, function (err, data) {
            if (err) {
                logger.error('On reading json file.');
                logger.error(err);
            } else {
                registerJsonAndUpdateInfo(name, text, data, res);
            }
        });
    } else if (type == 'csv') {
        var separator = req.body.separator;
        common.readPlainTextByLine(tmp_path, function(err, lines) {
            if (err) {
                logger.error('On reading txt / csv file.');
                logger.error(err);
                res.status(500).send({info: 'Upload failed.'});
            } else {
                var keys = lines[0].split(separator);
                var schema = {};

                _.map(lines[1].split(separator), function(cell, index) {
                    schema[keys[index]] = common.gStringType(cell);
                });

                MongoController.registerSchema(name, schema, 'datasets', function(err) {
                    updateDatasetInfo(name, text);

                    async.each(lines.slice(1), function (line, callback) {
                        var record = {};
                        _.map(line.split(separator), function (cell, index) {
                            record[keys[index]] = common.realType(cell);
                        });
                        MongoController.insert('datasets', name, record, callback);
                    }, function(err, results) {
                        if (err) {
                            logger.error("Error while insert from csv /txt file.");
                            logger.error(err);
                            res.status(500).send({info: 'Upload failed.'});
                        } else {
                            res.status(201).send({info: 'Upload successed.'});
                        }
                    });
                });
            }
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

function registerJsonAndUpdateInfo(name, text, data, res, callback) {
    registerJson(name, data, function(err) {
        if (err) {
            if (res) res.json({status: 'failed', info: err});
            if (callback) {
                callback(err);
            }
        } else {
            updateDatasetInfo(name, text, res, callback);
        }
    });
}

function updateDatasetInfo(name, text, res, callback) {
    MongoController.update(
        'auto', 'dataset',
        {name: common.gName(name)['model_name']},
        {text: text, source: 'datasets', "source-name": '数据仓库'},
        function (err) {
            if (err) {
                logger.error("Error on update extra info of datasets.");
                logger.error(err);
                if (res) res.json({status: 'failed', info: '服务器错误,导入数据失败'});
            } else {
                if (res) res.json({status: 'success'});
            }
            if (callback) {
                callback(err);
            }
        }
    );
}

function registerJson(name, json_arr, callback) {
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
    var RESERVED_KEY = ['on', 'emit', '_events',
                        'db', 'get', 'set', 'init',
                        'isNew', 'errors', 'schema',
                        'options', 'modelName',
                        'collection', '_pres',
                        '_posts', 'toObject'
                        ];

    _.each(pairs, function (pair) {
        var key = pair[0], value = pair[1];
        schema[key] = common.gSchema(value.constructor);
        if (_.indexOf(RESERVED_KEY, key) >= 0) {
            callback(`不可使用MongoDB保留字${key}`);
        }
    });

    MongoController.registerSchema(name, schema, 'datasets', function (err) {
        if (err) {
            logger.error("Error on register Schema.");
            logger.error(err);
        } else {
            async.each(_.values(json_arr), function(json, callback) {
                MongoController.insert('datasets', name, json, callback);
            }, function(err) {
                if (err) {
                    logger.error('Error on insert data to new collection.');
                    logger.error(err);
                    callback('服务器错误,导入数据失败');
                } else {
                    callback(null);
                }
            });
        }
    });
}