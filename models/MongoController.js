/**
 * Created by iniyk on 16/2/9.
 */

var express = require('express');
var router = express.Router();

var Logger = require('./Logger')();
var logger = Logger.handle("MongoController");
var mongoose = require("mongoose");
var db = mongoose.connection;
var config = require("./Common").readJsonConfig('./conf.json')['database']['mongodb'];

logger.info('MongoDB config: ' + config.toString());

var dataSetSchema = new mongoose.Schema({
    id: Number,
    name: String,
    title: String,
    comment: String,
    icon: String,
    panel_type: String
});

var retailSchema = new mongoose.Schema({
    id: Number,
    customer: Number,
    good: Number
});

var DataSet = mongoose.model('DataSet', dataSetSchema);

router.get('/dataset/:id(\\d+)/retrieve', function(req, res, next) {
    db.on('error', function (err) {
        logger.error(err);
    });
    db.once('open',function(){
        DataSet.findOne({id: parseInt(req.params.id)}, function (err, dataset) {
            if(err) {
                logger.error(err);
                res.status(500).send({ error: err });
            } else {
                res.json(dataset);
            }
            db.close();
        });
    });

    mongoose.connect(config.host);
});

router.post('/datasets/create', function(req, res, next) {
    logger.info('POST request acquired.');
    db.on('error', function (err) {
        logger.error(err);
    });
    db.once('open',function(){
        var dataset = new DataSet({
            id: parseInt(req.body.id),
            name: req.body.name,
            title: req.body.title,
            comment: req.body.comment,
            icon: req.body.icon,
            panel_type: req.body.panel_type
        });

        dataset.save(function (err) {
            if (err) {
                logger.error('On save function.');
                logger.error(err);
                res.status(500).send({ error: err });
            } else {
                logger.info('DataSet info has been saved.');
                res.status(201).send({ success: 'dataset has been created.'});
            }
            db.close();
        })
    });

    mongoose.connect(config.host);
});

module.exports = router;