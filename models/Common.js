/**
 * Created by iniyk on 16/2/4.
 */

var Common = {
    readJson: function (file_path, callback) {
        var fs = require('fs');
        fs.readFile(file_path, 'utf-8', function(err, data) {
            if (err) {
                callback(err, null);
            } else {
                var json_obj = eval('(' + data + ')');
                callback(null, json_obj);
            }
        });
    },
    readJsonConfig: function (file_path) {
        var fs = require('fs');
        var raw_data = fs.readFileSync(file_path, 'utf-8');
        var config = eval('(' + raw_data + ')');
        return config;
    },
    format: function(src) {
        if (arguments.length == 0) return null;
        var args = Array.prototype.slice.call(arguments, 1);
        return src.replace(/\{(\d+)\}/g, function(m, i){
            return args[i];
        });
    },
    gType: function(obj) {
        //var _ = require('underscore');
        //TODO this function isn't finished.
        return String;
    }
};

exports = module.exports = Common;