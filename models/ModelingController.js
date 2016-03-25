/**
 * Created by Administrator on 2016/3/23.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var common = require('./Common');
var Logger = require('./Logger')();
var MongoController = require('./MongoController');

var logger;
var models;

function init() {
    if (!models) {
        logger = Logger.handle("ModelingController");
        models = {};
    }
}

function registerModel(model) {
    init();
    models[model.name] = model;
    var ModelInMongo = MongoController.gModel('model', 'auto');
    var model_in_mongo = new ModelInMongo(model);
    model_in_mongo.markModified('fields');
    model_in_mongo.markModified('arguments');
    model_in_mongo.markModified('outputs');
    model_in_mongo.save();
}

function execModel(data_post, callback) {
    init();
    var run_id = -1;
    var running = {
        "model": data_post.model_selected,
        "type": data_post.model_type,
        "exec": '',
        "user": '',
        "input": {
            "fields": {}
        },
        "output": {}
    };

    _.map(data_post.fields_selected, function(field_info, field_name) {
        var db_name = field_info.from_database,
            collection = field_info.from_table,
            col_name = field_info.field_name;
        var ModelTarget = MongoController.gModel(collection, db_name);
        var query = ModelTarget.find({}, `${col_name}`, function(err, records) {
            var cols = _.reduce(records, function(memo, record) {
                memo.append(record[`${col_name}`]);
            }, []);

            running.input.fields[field_info.target_field_name] = cols;
        });
    });

    _.map(data_post.arguments, function(argument, name) {
        running.input[`${name}`] = argument;
    });

    gRunning(running, function(run_id) {
        callback(run_id);
    });
}

function gRunning(running, callback) {
    var RunningModel = MongoController.gModel('running', 'auto');
    var model_running = new RunningModel(running);
    model_running.markModified('input');
    model_running.markModified('output');
    model_running.save(function(err) {
       if (!err) {
            callback(model_running._id);
       }
    });
}

module.exports.router = router;
module.exports.registerModel = registerModel;
module.exports.execModel = execModel;