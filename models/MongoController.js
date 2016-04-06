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

function model_save(Model, data, res) {
    var model = new Model(data);
    model.save(function (err) {
        if (err) {
            logger.error('On save step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({ error: err });
            }
        } else {
            if (res != null) {
                res.status(201).send({ success: 'Record has been inserted.'});
            }
        }
    });
}

function model_update(Model, data, res) {
    Model.findOneAndUpdate(data.index, data.update, function (err) {
        if (err) {
            logger.error('On find and update step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({error: err});
            }
        } else {
            if (res != null) {
                res.status(201).send({success: 'Record has been updated.'});
            }
        }
    });
}

function model_remove(Model, data, res) {
    Model.findOneAndRemove({_id: data._id}, function (err) {
        if (err) {
            logger.error('On remove step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({ error: err });
            }
        } else {
            if (res != null) {
                res.status(201).send({success: 'Record has been deleted.'});
            }
        }
    });
}

function model_list(Model, data, res) {
    Model.find({}, function (err, models) {
        if(err) {
            logger.error('On list step.');
            logger.error(err);
            if (res != null) {
                res.status(500).send({ error: err });
            }
            models = null;
        } else {
            if (res != null) {
                res.json(models);
            }
        }
    });
}

function model_find_one(Model, data, res) {
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
                if (res != null) {
                    res.status(500).send({ error: 'No such data.' });
                }
                model = null;
            } else {
                if (res != null) {
                    res.json(model);
                }
            }
        }
    });
}

function registerRouters(Model, db_name, request_name) {
    //GET ./${database}/${schema}/
    router.get(`/${db_name}/${request_name}/`, function(req, res, next) {
        var data = {};
        model_list(Model, data, res);
    });

    //GET ./${database}/${schema}/${id}/
    router.get(`/${db_name}/${request_name}/:id([a-z0-9]+)/`, function(req, res, next) {
        var data = {};
        data._id = req.params.id;
        model_find_one(Model, data, res);
    });

    //POST ./${database}/${schema}/create/
    router.post(`/${db_name}/${request_name}/create/`, function(req, res, next) {
        var data = req.body;
        model_save(Model, data, res);
    });

    //POST ./${database}/${schema}/${id}/update/
    router.post(`/${db_name}/${request_name}/:id([a-z0-9]+)/update/`, function(req, res, next) {
        var data = {update: req.body, index: {_id: req.params.id}};
        model_update(Model, data, res);
    });

    //GET ./${database}/${schema}/${id}/delete/
    router.post(`/${db_name}/${request_name}/:id([a-z0-9]+)/delete/`, function(req, res, next) {
        var data = {_id: req.params.id};
        model_remove(Model, data, res);
    });
}

function registerSchema(schema_name, schema, db_name, callback) {
    var db = dbs[db_name];
    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var request_name = schema_name.toLowerCase();
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);

    if (_.has(Models[db_name], schema_name)) {
        logger.error("Register same schema name twice.");
    } else {
        logger.debug(`Schema : ${schema_name}`);
        logger.debug(schema);
        var schemaMongoose = new mongoose.Schema(schema);
        var Model = db.model(model_name, schemaMongoose);
        Models[db_name][schema_name] = Model;

        logger.info('Register router for ' + schema_name);

        registerRouters(Model, db_name, request_name);

        if (db_name == 'datasets') {
            var data = {name: model_name};
            var ModelDataset = Models['auto']['dataset'];
            ModelDataset.findOne(data, function (dataset, err) {
                if (err) {
                    logger.error("Error on find dataset in blask.");
                    logger.error(err);
                    if (callback) {
                        callback(err);
                    }
                } else {
                    if (dataset == null) {
                        var dataset_schema = {};
                        _.map(schema, function (value, key) {
                            dataset_schema[key] = common.gType(value);
                        });
                        var dataset = {name: model_name, "dataset-schema": dataset_schema};
                        logger.debug(dataset);
                        var model_dataset = new ModelDataset(dataset);
                        model_dataset.save(function (err) {
                            if (err) {
                                logger.error("Error on save dataset in blask.");
                                logger.error(err);
                            } else {
                                logger.debug(`${schema_name} has been saved into database.`);
                            }
                            if (callback) {
                                callback(err);
                            }
                        });
                    }
                }
            });
        }
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

    var schemas = require('./model/schemas.js').schemas;
    _.map(schemas, function(schema, name) {
        registerSchema(name, schema, 'auto');
    });

    registerAllDataSets();
}

function registerAllDataSets() {
    var Model = Models['auto']['dataset'];

    Model.find({}, function (datasets, err) {
        _.each(datasets, function (dataset) {
            registerOneDataSet(Model, dataset);
        });
    });
}

function registerOneDataSet(Model, data) {
    var db = dbs['datasets'];
    var schema = data['dataset-schema'];

    var schema_name = data.name.charAt(0).toLowerCase() + data.name.slice(1);
    var request_name = schema_name.toLowerCase();
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);

    var schemaMongoose = new mongoose.Schema();
    schemaMongoose.add(schema);
    var DatasetModel = db.model(model_name, schemaMongoose);
    Models['datasets'][schema_name] = DatasetModel;

    logger.debug(`Register Model for '${schema_name}' in database 'datasets'`);

    registerRouters(DatasetModel, 'datasets', request_name);
}

function insert(database, schema, data, callback) {
    logger.debug(`Insert : ${database}, ${schema}`);
    schema = schema.charAt(0).toLowerCase() + schema.slice(1);
    if (database == 'blask') {
        database = 'auto';
    }

    logger.debug('gModel for save.');
    var InsertModel = gModel(schema, database);

    logger.debug('Prepare to save.');
    if (null != InsertModel) {
        logger.debug('g model for save.');
        var model = new InsertModel(data);
        logger.debug('g model not stacked.');
        _.map(data, function(value, key) {
            if (common.shouldMarked(value.constructor)) {
                model.markModified(key);
                logger.debug(`Modified Key : ${key}`);
            }
        });
        logger.debug('Start to save.');
        model.save(function (err) {
            if (err) {
                logger.error(`Error in Insert into ${database}`);
                logger.error(err);
            } else {
                logger.debug(`Inserted into collection [${schema}] in database [${database}].`);
                logger.debug(`Data Head : ${data._id}`);
            }
            if (callback) {
                callback(err);
            }
        });
    }
}

function gModel(model_name, database) {
    logger.debug(`Gen Model for '${model_name}' in '${database}'`);
    if (_.has(Models[database], model_name)) {
        return Models[database][model_name];
    } else {
        logger.error(`Trying to gen a Model from unregistered schema name of ${model_name} in ${database}.`);
        return null;
    }
}

module.exports.router = router;
module.exports.init = init;
module.exports.registerSchema = registerSchema;
module.exports.insert = insert;
module.exports.gModel = gModel;
