/**
 * Created by Administrator on 2016/3/24.
 */

var mongoose = require('mongoose');

var schemas = {
    "dataset": {
        "name": String,
        "field-number": String,
        "record-number": String,
        "source": String,
        "storage": String,
        "reference": String,
        "update": String,
        "comment": String,
        "dataset-schema": mongoose.Schema.Types.Mixed
    },
    "model": {
        "name": String,
        "type": String,                                //Exchange or Dig
        "description": String,
        "exec": String,
        "fields": [
            {
                "name": String,
                "type": String,
                "text": String,
                "comment": String
            }
        ],
        "arguments": [
            {
                "name": String,
                "text": String,
                "comment": String,
                "type": String,
                "input-type": String,
                "range": mongoose.Schema.Types.Mixed
            }
        ],
        "outputs": [
            {
                "name": String,
                "type": String,
                "text": String
            }
        ]
    }
};

module.exports.schemas = schemas;