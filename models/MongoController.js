/**
 * Created by iniyk on 16/3/3.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');
var async = require('async');
var mongoose = require("mongoose");
var db = mongoose.connection;

var common = require('./Common');
var Logger = require('./Logger')();
var logger = Logger.handle("MongoController");
var config = require("./Common").readJsonConfig('./conf.json')['database']['mongodb'];

//var schemas = {};
var Models = {};

function model_save(db, Model, data, res, callbacks) {
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
            next(db, Model, data, res, callbacks);
        }
    });
}

function model_update(db, Model, data, res, callbacks) {
    Model.findOneAndUpdate({_id: data._id}, data, function (err) {
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
            next(db, Model, data, res, callbacks);
        }
    });
}

function model_remove(db, Model, data, res, callbacks) {
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
            next(db, Model, data, res, callbacks);
        }
    });
}

function model_list(db, Model, data, res, callbacks) {
    Model.find({}, function (err, models) {
        if(err) {
            logger.error('On list step.');
            logger.error(err);
            res.status(500).send({ error: err });
        } else {
            _.map(models, function(model) {
                //model._id = undefined;  //If it should be shown.
                model.__v = undefined;
            });
            logger.info('Records listing.');
            res.json(models);
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(db, Model, data, res, callbacks);
        }
    });
}

function model_find_one(db, Model, data, res, calllbacks) {
    Model.findOne({_id: parseInt(data._id)}, function (err, model) {
        if(err) {
            logger.error('On find one step.');
            logger.error(err);
            res.status(500).send({ error: err });
        } else {
            if (model == null) {
                logger.info('Request record not find by id : ' + data._id);
                res.status(500).send({ error: 'No such data.' });
            } else {
                //model._id = undefined;    //If it should be shown.
                model.__v = undefined;
                res.json(model);
            }
        }

        var next = callbacks.pop();
        if (next != undefined) {
            next(db, Model, data, res, callbacks);
        }
    });
}

function registerSchema(schema_name, schema) {
    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var request_name = schema_name.toLowerCase();
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);

    if (_.has(Models, schema_name)) {
        return 0;
    }

    var schemaMongoose = new mongoose.Schema(schema);
    var Model = mongoose.model(model_name, schemaMongoose);
    Models[schema_name] = Model;

    logger.info('Schema Name : ' + schema_name);
    logger.info('Request Name : ' + request_name);
    logger.info('Model Name : ' + model_name);

    logger.info('Register router for ' + schema_name);
    router.get(common.format('/{0}', request_name), function(req, res, next) {
        var data = {};
        model_list(db, Model, data, res, []);
    });
}

function init() {
    mongoose.connect(config.host);

    db.on('error', function (err) {
        logger.error(err);
    });

    db.once('open',function(){
        logger.info('MongoDB connected.');
    });

    registerSchema('dataSet', {
        id: Number,
        name: String,
        title: String,
        comment: String,
        icon: String,
        panel_type: String
    });
}

function insert(schema_name, data) {
    logger.info('Insert into ' + schema_name);
    logger.info('Data : ');
    logger.info(data);
    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);

    if (_.has(Models, schema_name)) {
        var Model = Models[schema_name];
    } else {
        logger.error('Trying to insert into a unregistered schema.');
        return 2;
    }

    model_save(db, Model, data, null, []);

    return 0;
}

module.exports.router = router;
module.exports.init = init;
module.exports.registerSchema = registerSchema;
module.exports.insert = insert;
