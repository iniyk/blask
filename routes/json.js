/**
 * Created by Administrator on 2016/3/14.
 */

var express = require('express');
var router = express.Router();

var _ = require('underscore');

var Common = require('../models/Common.js');

var router_now = '/json/';

//GET single json file.
router.get('/:filename([a-z0-9_.]+)', function(req, res, next) {
    Common.readJson('./views/json/'+req.params.filename, function(err, data){
        if (err) {
            res.status(500).send({error: err});
        } else {
            res.status(200).json(data);
        }
    });
});

router.get('/data/:filename([a-z0-9_.]+)', function(req, res, next) {
    Common.readJson('./views/json/data/'+req.params.filename, function(err, data){
        if (err) {
            res.status(500).send({error: err});
        } else {
            res.status(200).json(data);
        }
    });
});

module.exports = router;