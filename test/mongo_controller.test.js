/**
 * Created by iniyk on 16/4/5.
 */
var _ = require('underscore');
var mongoose = require('mongoose');
var request = require('superagent');
var expect = require('chai').expect;
var should = require('should');
var async = require('async');

//var Logger = require('../models/Logger')();
//var logger = Logger.handle("MongoController-Test");
var common = require('../models/Common');
//var MongoController = require("../models/MongoController");
//var DataController = require("../models/DataController");

describe('mongo_controller.test.js - MongoController Test', function() {
    it('Array saving test', function (done) {
        /*var config_test = require("../models/Common").readJsonConfig('./conf.json')['database']['mongodb_test'];
        var db_test = mongoose.createConnection(config_test.host);
        db_test.on('error', function (err) {
            should.not.exist(err);
            done();
        });
        db_test.once('open',function(){
            //done();
        });

        var schema_with_array = {
            name: String,
            arr: common.gSchema([1, 3, 5, 7].constructor)
        };
        console.log(schema_with_array);
        var schema_with_array_in_mongoose = new mongoose.Schema(schema_with_array);
        var ModelWithArray = db_test.model('model_with_array', schema_with_array_in_mongoose);
        var data = {
            name: "IHaveArray",
            arr: [1, 3, 5, 7]
        };
        var model_with_array = new ModelWithArray(data);
        model_with_array.save(function(err) {
            should.not.exist(err);
            done();
        });*/
        var data_post = {
            name: 'apriori_debug',
            text: '关联规则结果-测试',
            data:
            {
                pre:
                    [

                        ["ASIAN"],
                        ["BLACK"],
                        ["Brooklyn"],
                        ["HISPANIC"],
                        ["New York"],
                        ["New York"],
                        ["NON-MINORITY"],
                        ["NON-MINORITY"],
                        ["WBE"],
                        ["WBE"]
                    ],
                post:
                    [
                        ["MBE"],
                        ["MBE"],
                        ["MBE"],
                        ["MBE"],
                        ["MBE"],
                        ["WBE"],
                        ["WBE"],
                        ["WBE"],
                        ["NON-MINORITY"],
                        ["NON-MINORITY"]
                    ],
                confidence:
                    [
                        '0.577565632458234',
                        '0.594272076372315',
                        '0.628318584070796',
                        '0.674698795180723',
                        '0.740740740740741',
                        '0.989547038327526',
                        '1',
                        '1',
                        '1',
                        '1'
                    ]
            }
        };

        request
            .post('http://localhost:3000/data/create')
            .send(data_post)
            .end(function(err, res){
                if (err) done(err);
                res.body.should.have.property('status');
                res.body['status'].should.equal('success');
                done();
            });

/*
        var name = data_post.name;
        var data = data_post.data;

        var tasks = [
            function (callback) {
                MongoController.init();
                callback();
            },
            function (callback) {
                console.log("Start to register json.");
                registerJson(name, data);
                callback();
            }
        ];
        async.series(tasks, function(err) {
            should.not.exist(err);
            done();
        });
        //MongoController.init();
        //DataController._registerJson(name, data);
*/
    });
});