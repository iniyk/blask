/**
 * Created by iniyk on 16/2/9.
 */

var express = require('express');
var router = express.Router();

var common = require('./Common');
var _ = require('underscore');

var Logger = require('./Logger')();
var logger = Logger.handle("MongoController");
var mongoose = require("mongoose");
var db = mongoose.connection;
var config = require("./Common").readJsonConfig('./conf.json')['database']['mongodb'];

//var schemas = {};

function registerSchema(schema_name, schema) {
    schema_name = schema_name.charAt(0).toLowerCase() + schema_name.slice(1);
    var request_name = schema_name.toLowerCase();
    var model_name = schema_name.charAt(0).toUpperCase() + schema_name.slice(1);
    var schemaMongoose = new mongoose.Schema(schema);
    //schemas[schema_name] = schemaMongoose;

    var Model = mongoose.model(model_name, schemaMongoose);

    //GET /schema/:id/retrieve
    router.get(common.format('/{0}/:id(\\d+)/retrieve', request_name), function(req, res, next) {
        db.on('error', function (err) {
            logger.error(err);
        });
        db.once('open',function(){
            Model.findOne({id: parseInt(req.params.id)}, function (err, model) {
                if(err) {
                    logger.error(err);
                    res.status(500).send({ error: err });
                } else {
                    if (model == null) {
                        res.status(500).send({ error: 'No such data.' });
                    } else {
                        model._id = undefined;
                        model.__v = undefined;
                        res.json(model);
                    }
                }
                db.close();
            });
        });
        mongoose.connect(config.host);
    });

    //GET /schema
    router.get(common.format('/{0}', request_name), function(req, res, next) {
        db.on('error', function (err) {
            logger.error(err);
        });
        db.once('open',function(){
            Model.find({}, function (err, models) {
                if(err) {
                    logger.error(err);
                    res.status(500).send({ error: err });
                } else {
                    _.map(models, function(model) {
                        model._id = undefined;
                        model.__v = undefined;
                    });
                    res.json(models);
                }
                db.close();
            });
        });
        mongoose.connect(config.host);
    });

    //POST /schema/create
    router.post(common.format('/{0}/create', request_name), function(req, res, next) {
        db.on('error', function (err) {
            logger.error(err);
        });
        db.once('open',function(){
            var max_query = Model.find({},{"id":1}).sort({"id":-1}).limit(1);
            max_query.exec(function(err, max_id_result){
                if (err) {
                    logger.error('On find max id step.');
                    logger.error(err);
                    res.status(500).send({ error: err });
                } else {
                    var max_id = parseInt(max_id_result[0].id);
                    req.body.id = max_id + 1;

                    var model = new Model(req.body);
                    model.save(function (err) {
                        if (err) {
                            logger.error('On save function.');
                            logger.error(err);
                            res.status(500).send({ error: err });
                        } else {
                            logger.info('Model info has been saved.');
                            res.status(201).send({ success: 'dataset has been created.'});
                        }
                        db.close();
                    })
                }
            });
        });
        mongoose.connect(config.host);
    });

    //POST /schema/:id/update
    router.post(common.format('/{0}/:id(\\d+)/update', request_name), function(req, res, next) {
        db.on('error', function (err) {
            logger.error(err);
        });
        var id = req.params.id;
        req.body.id = id;
        db.once('open',function(){
            Model.findOneAndUpdate({id: id}, req.body, function (err) {
                if (err) {
                    logger.error('On find and update step.');
                    logger.error(err);
                    res.status(500).send({ error: err });
                } else {
                    logger.info('Model info has been saved.');
                    res.status(201).send({ success: 'model has been updated.'});
                }
                db.close();
            });
        });
        mongoose.connect(config.host);
    });

    //GET /schema/:id/delete
    router.get(common.format('/{0}/:id(\\d+)/delete', request_name), function(req, res, next) {
        db.on('error', function (err) {
            logger.error(err);
        });
        var id = req.params.id;
        db.once('open',function(){
            Model.findOneAndRemove({id: id}, function (err) {
                if (err) {
                    logger.error('On find and remove step.');
                    logger.error(err);
                    res.status(500).send({ error: err });
                } else {
                    logger.info('Model info has been saved.');
                    res.status(201).send({ success: 'model has been deleted.'});
                }
                db.close();
            });
        });
        mongoose.connect(config.host);
    });

    return Model;
}

registerSchema('dataSet', {
    id: Number,
    name: String,
    title: String,
    comment: String,
    icon: String,
    panel_type: String
});

registerSchema('retail', {
    id: Number,
    customer: Number,
    good: Number
});

module.exports.router = router;