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
            // logger.debug('Record has been inserted.');
            // logger.debug(data);
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
            // logger.debug('Record has been updated.');
            // logger.debug(data);
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
            // logger.debug('Record has been removed.');
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
            // logger.debug('Records listing.');
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
                // logger.debug('Request record not find by : ' + data);
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

function registerRouters(Model, db_name, request_name) {
    //GET ./${database}/${schema}/
    router.get(`/${db_name}/${request_name}/`, function(req, res, next) {
        var data = {};
        model_list(Model, data, res, []);
    });

    //GET ./${database}/${schema}/${id}/
    router.get(`/${db_name}/${request_name}/:id([a-z0-9]+)/`, function(req, res, next) {
        var data = {};
        data._id = req.params.id;
        model_find_one(Model, data, res, []);
    });

    //POST ./${database}/${schema}/create/
    router.post(`/${db_name}/${request_name}/create/`, function(req, res, next) {
        var data = req.body;
        model_save(Model, data, res, []);
    });

    //POST ./${database}/${schema}/${id}/update/
    router.post(`/${db_name}/${request_name}/:id([a-z0-9]+)/update/`, function(req, res, next) {
        var data = {update: req.body, index: {_id: req.params.id}};
        model_update(Model, data, res, []);
    });

    //GET ./${database}/${schema}/${id}/delete/
    router.post(`/${db_name}/${request_name}/:id([a-z0-9]+)/delete/`, function(req, res, next) {
        var data = {_id: req.params.id};
        model_remove(Model, data, res, []);
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

    // logger.debug(`Schema : ${schema_name}`);
    var schemaMongoose = new mongoose.Schema(schema);
    var Model = db.model(model_name, schemaMongoose);
    Models[db_name][schema_name] = Model;

    logger.info('Register router for ' + schema_name);

    registerRouters(Model, db_name, request_name);

    if (db_name == 'datasets') {
        var data = {name: model_name};
        model_find_one(Models['auto']['dataset'], data, null, [function(Model, data, res, callbacks) {
            if (data == null) {
                var dataset_schema = {};
                _.map(schema, function(value, key) {
                //_.each(_.pairs(schema), function(pair) {
                //    var key = pair[0], value = pair[1];
                    dataset_schema[key] = common.gType(value);
                });
                var dataset = {name: model_name, "dataset-schema": dataset_schema};
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

    var schemas = require('./model/schemas.js').schemas;
    _.map(schemas, function(schema, name) {
        registerSchema(name, schema, 'auto');
    });

    registerAllDataSets();
}

function registerAllDataSets() {
    //var db = dbs['auto'];
    var Model = Models['auto']['dataset'];

    //logger.debug(Model);

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

    var next = callbacks.pop();
    if (next != undefined) {
        next(Model, data, res, callbacks);
    }
}

function insert(database, schema, data) {
    schema = schema.charAt(0).toLowerCase() + schema.slice(1);
    if (database == 'blask') {
        database = 'auto';
    }

    if (_.has(Models, database)) {
        if (_.has(Models[database], schema)) {
            var Model = Models[database][schema];
        } else {
            logger.error(`Trying to insert into a unregistered schema of ${schema}.`);
            return 2;
        }
    } else {
        logger.error(`Trying to insert into a inexistent database of ${database}.`);
        return 2;
    }

    model_save(Model, data, null, [function(err) {
        // logger.debug(`Inserted into collection [${schema}] in database [${database}].`);
        // logger.debug(`Data Head : ${data._id}`);
    }]);

    return 0;
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
//module.exports.registerDatasetSchema = registerDatasetSchema;
module.exports.insert = insert;
module.exports.gModel = gModel;
