/**
 * Created by iniyk on 16/3/3.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');
var async = require('async');
var mongoose = require("mongoose");
var dbs = {};

var common = require('./Common');
var Logger = require('./Logger')();
var logger = Logger.handle("MongoController");
var config = require("./Common").readJsonConfig('./conf.json')['database']['mongodb_app'];
var config_datasets = require("./Common").readJsonConfig('./conf.json')['database']['mongodb_datasets'];

var Models = {};

function model_save(Model, data, res, callbacks) {
    var model = new Model(data);
    model.save(function (err) {
        if (err) {
            logger.error('On save step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({ error: err });
            }
        } else {
            logger.info('Record has been inserted.');
            logger.info(data);
            if (res != null) {
                res.status(201).send({ success: 'Record has been inserted.'});
            }
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(Model, data, res, callbacks);
        }
    });
}

function model_update(Model, data, res, callbacks) {
    Model.findOneAndUpdate(data.index, data.update, function (err) {
        if (err) {
            logger.error('On find and update step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({error: err});
            }
        } else {
            logger.info('Record has been updated.');
            logger.info(data);
            if (res !=null) {

                res.status(201).send({ success: 'Record has been updated.'});
            }
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(Model, data.update, res, callbacks);
        }
    });
}

function model_remove(Model, data, res, callbacks) {
    Model.findOneAndRemove({_id: data._id}, function (err) {
        if (err) {
            logger.error('On remove step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({ error: err });
            }
        } else {
            logger.info('Record has been removed.');
            if (res != null) {
                res.status(201).send({ success: 'Record has been deleted.'});
            }
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(Model, data, res, callbacks);
        }
    });
}

function model_list(Model, data, res, callbacks) {
    Model.find({}, function (err, models) {
        if(err) {
            logger.error('On list step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({ error: err });
            }
            models = null;
        } else {
            //_.map(models, function(model) {
                //model._id = undefined;  //If it should be shown.
                //model.__v = undefined;
            //});
            logger.info('Records listing.');
            if (res != null) {
                res.json(models);
            }
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(Model, models, res, callbacks);
        }
    });
}

function model_find_one(Model, data, res, callbacks) {
    Model.findOne(data, function (err, model) {
        if(err) {
            logger.error('On find one step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({error: err});
            }
            model = null;
        } else {
            if (model == null) {
                logger.info('Request record not find by : ' + data);
                if (res != null) {
                    res.status(500).send({ error: 'No such data.' });
                }
                model = null;
            } else {
                //model._id = undefined;    //If it should be shown.
                //model.__v = undefined;
                if (res != null) {
                    res.json(model);
                }
            }
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(Model, model, res, callbacks);
        }
    });
}

function registerSchema(schema_name, schema, db_name) {
    var db = dbs[db_name];
    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var request_name = schema_name.toLowerCase();
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);

    if (_.has(Models[db_name], schema_name)) {
        return 0;
    }

    var schemaMongoose = new mongoose.Schema(schema);
    var Model = db.model(model_name, schemaMongoose);
    Models[db_name][schema_name] = Model;

    logger.info('Schema Name : ' + schema_name);
    logger.info('Request Name : ' + request_name);
    logger.info('Model Name : ' + model_name);

    logger.info('Register router for ' + schema_name);

    //GET ./${schema}/
    router.get(common.format('/{0}/{1}', db_name, request_name), function(req, res, next) {
        var data = {};
        model_list(Model, data, res, []);
    });

    //GET ./${schema}/${id}/
    router.get(common.format('/{0}/:id(\\d+)/', db_name, request_name), function(req, res, next) {
        var data = {};
        data._id = parseInt(req.params.id);
        model_find_one(Model, data, res, []);
    });

    if (db_name == 'datasets') {
        var data = {name: model_name};
        model_find_one(Models['auto']['dataSet'], data, null, [function(Model, data, res, callbacks) {
            if (data == null) {
                var schema_sample = {};
                _.each(_.pairs(schema), function(pair) {
                    var key = pair[0], value = pair[1];
                    schema_sample[key] = common.gSample(value);
                });
                var dataset = {name: model_name, comment: '', schema_sample: schema_sample};
                model_save(Model, dataset, res, []);
            }
        }]);
    }
}

function init() {
    Models['auto'] = {};
    Models['datasets'] = {};

    dbs['auto'] = mongoose.createConnection(config.host);
    dbs['auto'].on('error', function (err) {
        logger.error(err);
    });
    dbs['auto'].once('open',function(){
        logger.info('MongoDB for Blask connected.');
    });

    dbs['datasets'] = mongoose.createConnection(config_datasets.host);
    dbs['datasets'].on('error', function (err) {
        logger.error(err);
    });
    dbs['datasets'].once('open',function(){
        logger.info('MongoDB for Datasets connected.');
    });

    registerSchema('dataSet', {
        name: String,
        comment: String,
        schema_sample: {}
    }, 'auto');

    registerAllDataSets();
}

function registerAllDataSets() {
    //var db = dbs['auto'];
    var Model = Models['auto']['dataSet'];

    //logger.info(Model);

    model_list(Model, {}, null, [registerOneDataSet,
        function (Model, data, res, callbacks) {
            var next = callbacks.pop();
            _.each(data, function (model) {
                if (next != undefined) {
                    next(Model, model, res, callbacks);
                }
            });
        }
    ]);
}

function registerOneDataSet(Model, data, res, callbacks) {
    logger.info('Data :');
    logger.info(data);
    var pairs = _.pairs(data.schema_sample);
    var schema = {};

    _.each(pairs, function (pair) {
        var key = pair[0], value = pair[1];
        if (value != null) {
            schema[key] = value.constructor;
        } else {
            schema[key] = {};
        }
    });

    registerSchema(data.name, schema, 'datasets');

    var next = callbacks.pop();
    if (next != undefined) {
        next(Model, data, res, callbacks);
    }
}

function dataset_insert(schema_name, data) {
    logger.info('Insert into ' + schema_name);
    logger.info('Data : ');
    logger.info(data);
    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);

    if (_.has(Models['datasets'], schema_name)) {
        var Model = Models['datasets'][schema_name];
    } else {
        logger.error('Trying to insert into a unregistered schema.');
        return 2;
    }

    model_save(Model, data, null, []);

    return 0;
}

module.exports.router = router;
module.exports.init = init;
module.exports.registerSchema = registerSchema;
//module.exports.registerDatasetSchema = registerDatasetSchema;
module.exports.insert = dataset_insert;
