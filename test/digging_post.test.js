/**
 * Created by iniyk on 16/3/29.
 */
var request = require('superagent');
var expect = require('chai').expect;
var should = require('should');

describe('digging_post.test.js - HelperController Test', function() {
    it('请求 /digging 返回{run-id}', function(done){
        request
            .post('http://localhost:3000/digging')
            .send({
                "model_selected": "apriori",
                "fields_selected": {
                    "list": {
                        "target-field-name": "list",
                        "field-name": "list",
                        "field-type": "String",
                        "from-database": "datasets",
                        "from-table": "retail"
                    },
                    "item": {
                        "target-field-name": "item",
                        "field-name": "item",
                        "field-type": "String",
                        "from-database": "datasets",
                        "from-table": "retail"
                    }
                },
                "arguments": {
                    "min_support": "0.1",
                    "min_confidence": "0.5"
                }
            })
            //.expect(200)
            //.expect('Content-Type', '/json/')
            .end(function(err, res){
                if (err) done(err);
                res.body.should.have.property('run-id');
                res.body['run-id'].should.match(/[a-z0-9]+/);
                done();
            });
    });
});