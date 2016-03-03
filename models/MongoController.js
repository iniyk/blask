/**
 * Created by iniyk on 16/3/3.
 */
var express = require('express');
var router = express.Router();

var common = require('./Common');
var _ = require('underscore');
var async = require('async');

var Logger = require('./Logger')();
var logger = Logger.handle("MongoController");
var config = require("./Common").readJsonConfig('./conf.json')['database']['mongodb'];

var schemas = {};

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
            logger.error('On remove step.')
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
            logger.error('On list step.')
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
    var mongoose = require("mongoose");
    var db = mongoose.connection;

    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var request_name = schema_name.toLowerCase();
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);
    var schemaMongoose = null;

    if (_.has(schema, schema_name)) {
        return 0;
    } else {
        schemaMongoose = new mongoose.Schema(schema);
    }

    schemas[schema_name] = schemaMongoose;
    var Model = mongoose.model(model_name, schemaMongoose);

    logger.info('Schema Name : ' + schema_name);
    logger.info('Request Name : ' + request_name);
    logger.info('Model Name : ' + model_name);

    mongoose.connect(config.host);

    db.on('error', function (err) {
        logger.error(err);
    });

    db.once('open',function(){
        router.get(common.format('/{0}', request_name), function(req, res, next) {
            var data = {};
            model_list(db, Model, data, res, []);
        });
    });
}

registerSchema('dataSet', {
    id: Number,
    name: String,
    title: String,
    comment: String,
    icon: String,
    panel_type: String
});

module.exports.router = router;
module.exports.registerSchema = registerSchema;
