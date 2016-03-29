/**
 * Created by Administrator on 2016/3/23.
 */
var child_process = require('child_process');

var express = require('express');
var router = express.Router();

var _ = require('underscore');
var async = require('async');
//var lodash = require('lodash');

var common = require('./Common');
var Logger = require('./Logger')();
var MongoController = require('./MongoController');

var logger;
//var models;
var playground_path;
var scripts;

init();

function show_running_list(res) {
    var RunningModel = MongoController.gModel('running', 'auto');
    RunningModel.find({}, function (err, running_list) {
        if (! err) {
            res.json(running_list);
        } else {
            logger.error("On find running list.");
            logger.error(err);
            res.status(500).send({error: err});
        }
    });
}

function init() {
    if (!logger) {
        logger = Logger.handle("ModelingController");
        //models = {};
        playground_path = require("./Common").readJsonConfig('./conf.json')['playground']['path'];
        scripts = require("./Common").readJsonConfig('./conf.json')['playground']['scripts'];

        router.get('/', function(req, res, next) {
            show_running_list(res);
        });

        router.get('/status', function(req, res, next) {
            show_running_list(res);
        });

        router.get('/status/:id([a-z0-9]+)', function(req, res, next) {
            var RunningModel = MongoController.gModel('running', 'auto');
            RunningModel.findOne({_id: req.params.id}, function (err, running) {
                if (! err) {
                    res.json(running);
                } else {
                    logger.error(`On find running status ${req.params.id}.`);
                    logger.error(err);
                    res.status(500).send({error: err});
                }
            });
        });

        router.post('/', function(req, res, next) {
            logger.debug("Post Request:");
            logger.debug(req.body);
            execModel(req.body, function(run_id) {
                res.json({"run-id": run_id});
            });
        });
    }
}

// function registerModel(model) {
//     init();
//     models[model.name] = model;
//     var ModelInMongo = MongoController.gModel('model', 'auto');
//     var model_in_mongo = new ModelInMongo(model);
//     model_in_mongo.markModified('fields');
//     model_in_mongo.markModified('arguments');
//     model_in_mongo.markModified('outputs');
//     model_in_mongo.save();
// }

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
/*
    _.map(data_post.fields_selected, function(field_info, field_name) {
        var db_name = field_info['from-database'],
            collection = field_info['from-table'],
            col_name = field_info['field-name'];
        logger.debug(`Field info of ${field_name}`);
        logger.debug(field_info);
        logger.debug(`gModel of ${collection} in ${db_name}`);
        logger.debug(`col name is ${col_name}`);
        var ModelTarget = MongoController.gModel(collection, db_name);
        var query = ModelTarget.find({}, `${col_name}`, function(err, records) {
            logger.debug('Records : ');
            logger.debug(records);
            var cols = [];
            _.map(records, function(record, key) {
                cols.push(record);
            });

            running.input.fields[field_info.target_field_name] = cols;
        });
    });
*/
    async.eachSeries(_.pairs(data_post.fields_selected), function(field, callback) {
        var field_name = field[0];
        var field_info = field[1];
        var db_name = field_info['from-database'],
            collection = field_info['from-table'],
            col_name = field_info['field-name'];
        logger.debug(`Field info of ${field_name}`);
        logger.debug(field_info);
        logger.debug(`gModel of ${collection} in ${db_name}`);
        logger.debug(`col name is ${col_name}`);
        var ModelTarget = MongoController.gModel(collection, db_name);
        var query = ModelTarget.find({}, `${col_name}`, function(err, records) {
            var cols = [];
            _.map(records, function(record, key) {
                cols.push(record);
            });

            running.input.fields[field_info['target-field-name']] = cols;

            callback(err, cols);
        });
    }, function(err) {
        if (err) {
            logger.error("Error in async func.");
            logger.error(err);
        } else {
            _.map(data_post.arguments, function (argument, name) {
                running.input[`${name}`] = argument;
            });

            gRunning(running, function (model_running) {
                startExec(running, model_running);
                callback(model_running._id);
            });
        }
    });
}

function replaceArguments(exec_str, args_table) {
    var ret = new String(exec_str);
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
    logger.debug(`Exec : ${running.exec}`);
    logger.debug(`Arg0 : ${arg0}`);
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
            logger.debug(stdout);
            logger.debug(stderr);
            fs.writeFile(`${dir_path}/${run_id}.json`, JSON.stringify(running.input), 'utf-8', function(err) {
                if (! err) {
                    logger.debug(`Executing command : ${real_exec}`);

                    child_process.exec(real_exec, function(err, stdout, stderr) {
                        if (! err) {
                            logger.debug(stdout);
                            logger.debug(stderr);
                            common.readJson(`${dir_path}/${run_id}-result.json`, function(err, result) {
                                if (! err) {
                                    child_process.exec(remove_files, function(err, stdout, stderr) {
                                        if (! err) {
                                            logger.debug(stdout);
                                            logger.debug(stderr);
                                            running.output = result;
                                            model_running.output = result;
                                            model_running.markModified('output');
                                            model_running.save(function(err) {
                                                if (!err) {
                                                    //TODO: I think it should do something, but I couldn't realize what should it do here.
                                                } else {
                                                    //Error on saving running result to database.
                                                    logger.error("Error on writing result to database.");
                                                }
                                            });
                                        } else {
                                            //Remove files error.
                                            logger.error("Error on removing temp files.");
                                            logger.debug(stdout);
                                            logger.debug(stderr);
                                        }
                                    });
                                } else {
                                    //Read back helper result error.
                                    logger.error("Error on reading back the result file of json.");
                                }
                            });
                        } else {
                            //Exec third helper error.
                            logger.error("Error on executing helper.");
                            logger.debug(stdout);
                            logger.debug(stderr);
                        }
                    });
                } else {
                    //Write json input error.
                    logger.error("Error on writing json file for helper's input.");
                }
            });
        } else {
            //Copy files error.
            logger.error("Error on copy files.");
            logger.debug(stdout);
            logger.debug(stderr);
        }
    });
}

function gRunning(running, callback) {
    logger.debug("Running data for mongodb");
    logger.debug(running);
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
//module.exports.registerModel = registerModel;
module.exports.execModel = execModel;