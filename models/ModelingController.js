/**
 * Created by Administrator on 2016/3/23.
 */
var child_process = require('child_process');

var express = require('express');
var router = express.Router();

var _ = require('underscore');
//var lodash = require('lodash');

var common = require('./Common');
var Logger = require('./Logger')();
var MongoController = require('./MongoController');

var logger;
var models;
var playground_path;
var scripts;

function init() {
    if (!models) {
        logger = Logger.handle("ModelingController");
        models = {};
        playground_path = require("./Common").readJsonConfig('./conf.json')['playground']['path'];
        scripts = require("./Common").readJsonConfig('./conf.json')['playground']['scripts'];
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

function execModel(data_post, callback) {  //callback is for return run_id
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

    gRunning(running, function(model_running) {
        startExec(running, model_running);
        callback(model_running._id, pid);
    });
}

function replaceArguments(exec_str, args_table) {
    var ret = new string(exec_str);
    _.map(args_table, function(value, key) {
        var re = new RegExp("${" + key + "}", 'gi');
        ret = ret.replace(re, value);
        //ret = lodash.replace(ret, "${" + key + "}", value);
    });
    return ret;
}

function startExec(running, model_running) {
    var run_id = model_running._id;
    var fs = require('fs');
    var arg0 =running.exec.split(' ')[0];
    if (_.indexOf(scripts, arg0) == -1) {
        arg0 = running.exec.split(' ')[1];
    }
    var dir_path = `./playground/${run_id}`;
    var mkdir = `mkdir ${dir_path}`;
    var copy_files = `cp ./runnable/${arg0} ${dir_path}`;
    var remove_files = `rm -r ${dir_path}`;
    var args_table = {
        "run_id": run_id
    };
    var real_exec = replaceArguments(running.exec, args_table);
    real_exec = `cd ${dir_path} & ${real_exec}`;
    child_process.exec(copy_files, function(err, stdout, stderr) {
        if (! err) {
            fs.writeFile(`${dir_path}/${run_id}.json`, JSON.stringify(running.input), 'utf-8', function(err) {
                if (! err) {
                    child_process.exec(real_exec, function(err, stdout, stderr) {
                        if (! err) {
                            common.readJson(`${dir_path}/${run_id}-result.json`, function(err, result) {
                                if (! err) {
                                    child_process.exec(remove_files, function(err, stdout, stderr) {
                                        if (! err) {
                                            running.output = result;
                                            model_running.output = result;
                                            model_running.markModified('output');
                                            model_running.save(function(err) {
                                                if (!err) {
                                                    //TODO I think it should do something, but I couldn't realize what should it do here.
                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            });
        }
    })
}

function gRunning(running, callback) {
    var RunningModel = MongoController.gModel('running', 'auto');
    var model_running = new RunningModel(running);
    model_running.markModified('input');
    model_running.markModified('output');
    model_running.save(function(err) {
       if (!err) {
            callback(model_running);
       }
    });
}

module.exports.router = router;
module.exports.registerModel = registerModel;
module.exports.execModel = execModel;