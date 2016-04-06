/**
 * Created by Administrator on 2016/3/24.
 */

var mongoose = require('mongoose');

var schemas = {
    "dataset": {
        "name": String,
        "text": String,
        "field-number": Number,
        "record-number": Number,
        "source": String,
        "source-name": String,
        "storage": String,
        "reference": String,
        "update": String,
        "comment": String,
        "dataset-schema": {}
    },
    "model": {
        "name": String,
        "text": String,
        "type": String,                                //Exchange or Dig
        "description": String,
        "exec": String,
        "catalog": String,
        "catalog-text": String,
        "fields": [
            {
                //"name": String,
                //"type": String,
                //"text": String,
                //"comment": String
            }
        ],
        "arguments": [
            {
            //    "name": String,
            //    "text": String,
            //    "comment": String,
            //    "type": String,
            //    "input-type": String,
            //    "range": mongoose.Schema.Types.Mixed
            }
        ],
        "outputs": [
            {
                //"name": String,
                //"type": String,
                //"text": String
            }
        ]
    },
    "running": {
        "model": String,
        "type": String,
        "exec": String,
        "user": String,
        "start": Date,
        "finish": Date,
        "input": {},
        "output": {}
    }
};

module.exports.schemas = schemas;