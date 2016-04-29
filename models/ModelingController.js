/**
 * Created by Administrator on 2016/3/23.
 */
var child_process = require('child_process');

var express = require('express');
var router_digging = express.Router();
var router_exchanging = express.Router();

var _ = require('underscore');
var async = require('async');

var common = require('./Common');
var Logger = require('./Logger')();
var MongoController = require('./MongoController');

var logger;
var playground_path;
var scripts;

init();

function show_running_list(res, condition) {
    var RunningModel = MongoController.gModel('running', 'auto');
    RunningModel.find(condition, function (err, running_list) {
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
        playground_path = require("./Common").readJsonConfig('./conf.json')['playground']['path'];
        scripts = require("./Common").readJsonConfig('./conf.json')['playground']['scripts'];

        router_digging.get('/', function(req, res, next) {
            show_running_list(res, {type: 'digging'});
        });

        router_digging.get('/status', function(req, res, next) {
            show_running_list(res, {type: 'digging'});
        });

        router_digging.get('/status/:id([a-z0-9]+)', function(req, res, next) {
            var RunningModel = MongoController.gModel('running', 'auto');
            RunningModel.findOne({_id: req.params.id}, function (err, running) {
                if (! err) {
                    var HelperModel = MongoController.gModel('model', 'auto');
                    HelperModel.findOne({name: running.model}, function(err, helper) {
                        var res_json = {
                            running: running,
                            helper: helper
                        };
                        res.json(res_json);
                    });
                } else {
                    logger.error(`On find running status ${req.params.id}.`);
                    logger.error(err);
                    res.status(500).send({error: err});
                }
            });
        });

        router_digging.post('/', function(req, res, next) {
            logger.debug("Post Request:");
            logger.debug(req.body);
            execModel(req.body, function(run_id) {
                res.json({"run-id": run_id});
            });
        });

        router_exchanging.get('/', function(req, res, next) {
            show_running_list(res, {type: 'exchanging'});
        });

        router_exchanging.get('/status', function(req, res, next) {
            show_running_list(res, {type: 'exchanging'});
        });

        router_exchanging.get('/status/:id([a-z0-9]+)', function(req, res, next) {
            var RunningModel = MongoController.gModel('running', 'auto');
            RunningModel.findOne({_id: req.params.id}, function (err, running) {
                if (! err) {
                    var HelperModel = MongoController.gModel('model', 'auto');
                    HelperModel.findOne({name: running.model}, function(err, helper) {
                        var res_json = {
                            running: running,
                            helper: helper
                        };
                        res.json(res_json);
                    });
                } else {
                    logger.error(`On find running status ${req.params.id}.`);
                    logger.error(err);
                    res.status(500).send({error: err});
                }
            });
        });

        router_exchanging.post('/', function(req, res, next) {
            logger.debug("Post Request:");
            logger.debug(req.body);
            execModel(req.body, function(run_id) {
                res.json({"run-id": run_id});
            });
        });
    }
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
        "output": {},
        "start": new Date()
    };

    async.each(_.pairs(data_post.fields_selected), function(field, callback) {
        var field_name = field[0];
        var field_info = field[1];
        if (_.isArray(field_info)) {
            logger.debug('One post field is an Array.');
            async.map(field_info, function(field_value, callback) {
                gCol(field_value['field-name'], field_value['from-table'], field_value['from-database'], callback);
            }, function(err, vector_cols) {
                if (! err) {
                    running.input.fields[field_name] = vector_cols;
                }
                callback(err);
            });
        } else {
            gCol(field_info['field-name'], field_info['from-table'], field_info['from-database'], function(err, cols) {
                if (! err) {
                    running.input.fields[field_info['target-field-name']] = cols;
                }
                callback(err);
            });
        }
    }, function(err) {
        if (err) {
            logger.error("Error in async func.");
            logger.error(err);
        } else {
            _.map(data_post.arguments, function (argument, name) {
                running.input[`${name}`] = argument;
            });

            var HelperModel = MongoController.gModel('model', 'auto');
            HelperModel.findOne({name: data_post.model_selected}, function(err, helper) {
                running.exec = helper.exec;
                logger.info('Running : ');
                logger.info(running);

                gRunning(running, function (model_running) {
                    startExec(running, model_running);
                    callback(model_running._id);
                });
            });
        }
    });
}

function gCol(col_name, collection, db_name, callback) {
    var ModelTarget = MongoController.gModel(collection, db_name);
    var query_obj = {};
    query_obj[col_name] = 1;
    var query = ModelTarget.find({}, query_obj, function(err, records) {
        logger.debug(`Records in ${col_name}`);
        logger.debug(records);
        var cols = [];
        if (! err) {
            _.map(records, function (record, key) {
                cols.push(record[col_name]);
            });
        }

        callback(err, cols);
    });
}

function replaceArguments(exec_str, args_table) {
    var ret = new String(exec_str);
    _.map(args_table, function(value, key) {
        var re = new RegExp("\\$\\{" + key + "\\}", 'gi');
        logger.debug(re);
        ret = ret.replace(re, value);
    });
    return ret;
}

function startExec(running, model_running) {
    var tasks = [
        {
            "func": putInput,
            "name": 'copy input files'
        },
        {
            "func": doExec,
            "name": 'exec helper program'
        },
        {
            "func": exportOutput,
            "name": "import output to database"
        },
        {
            "func": removeFiles,
            "name": "remove temp files"
        }
    ];
    async.eachSeries(tasks, function(task, callback) {
        task.func(running, model_running, function(err, stdout, stderr) {
            if (err) {
                logger.error(`Error while ${task.name}.`);
                if (stdout) {
                    logger.error(stdout);
                }
                if (stderr) {
                    logger.error(stderr);
                }
            }
            callback(err);
        });
    });
}

function putInput(running, model_running, callback) {
    var fs = require('fs');
    var run_id = model_running._id;
    fs.writeFile(`runnable/${run_id}.json`, JSON.stringify(running.input), 'utf-8', callback);
}

function exportOutput(running, model_running, callback) {
    var run_id = model_running._id;
    common.readJson(`runnable/${run_id}-result.json`, function(err, result) {
        if (! err) {
            running.output = result;
            model_running.output = result;
            model_running.finish = new Date();
            model_running.markModified('output');
            model_running.save(callback);
        } else {
            callback(err);
        }
    });
}

function doExec(running, model_running, callback) {
    var args_table = {
        "run_id": model_running._id
    };
    var real_exec = replaceArguments(running.exec, args_table);
    real_exec = `cd runnable && ${real_exec}`;
    child_process.exec(real_exec, callback);
}

function removeFiles(running, model_running, callback) {
    var run_id = model_running._id;
    var remove_files = `rm runnable/${run_id}.json && rm runnable/${run_id}-result.json`;
    child_process.exec(remove_files, callback);
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

module.exports.router_digging = router_digging;
module.exports.router_exchanging = router_exchanging;
module.exports.execModel = execModel;