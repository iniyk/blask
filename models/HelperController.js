/**
 * Created by Administrator on 2016/3/28.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var common = require('./Common');
var Logger = require('./Logger')();
var logger = Logger.handle("HelperController");
var MongoController = require('./MongoController');

router.get('/u/:name([a-z0-9]+)', function(req, res, next) {
    //查看name的算法与模型
    var ModelModel = MongoController.gModel('model', 'auto');
    ModelModel.findOne({name: req.params.name}, function (err, model) {
        if (!err) {
            res.json(model);
        } else {
            logger.error(`GET model error in ${req.params.name}!`);
            logger.error(err);
            res.status(500).send({error: err});
        }
    });
});

router.get('/', function(req, res, next) {
    //列出所有算法与模型
    var ModelModel = MongoController.gModel('model', 'auto');
    ModelModel.find({}, function (err, models) {
        if (! err) {
            var models_tree_arr = transModelToTree(models);
            res.json(models_tree_arr);
        } else {
            logger.error("List Datasets Error!");
            logger.error(err);
            res.status(500).send({error: err});
        }
    });
});

router.get('/t/:type([a-z0-9]+)', function(req, res, next) {
    //列出特定类型的所有算法与模型
    var ModelModel = MongoController.gModel('model', 'auto');
    ModelModel.find({type: req.params.type}, function (err, models) {
        if (! err) {
            var models_tree_arr = transModelToTree(models);
            res.json(models_tree_arr);
        } else {
            logger.error("List Datasets Error!");
            logger.error(err);
            res.status(500).send({error: err});
        }
    });
});

function transModelToTree(models) {
    var tree = {};
    var tree_arr = [];
    _.map(models, function(model, index) {
        if (! _.has(tree, model.catalog)) {
            tree[model.catalog] = {
                "text": model["catalog-text"],
                "name": model.catalog,
                "catalog": "catalog",
                "nodes": []
            };
        }
        var node = {
            "text": model.text,
            "name": model.name,
            "catalog": model.catalog,
            "description": model.description
        };
        tree[node.catalog]["nodes"].push(node);
    });
    _.map(tree, function(node, key) {
        tree_arr.push(node);
    });
    return tree_arr;
}

module.exports.router = router;