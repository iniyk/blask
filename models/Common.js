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
    readPlainTextByLine: function (file_path, callback) {
        var fs = require('fs');
        var _ = require('underscore');
        fs.readFile(file_path, 'utf-8', function(err, data) {
            if (err) {
                callback(err, []);
            } else {
                var result_by_line = data.split('\n');
                var result_by_line_no_empty = [];
                _.each(result_by_line, function (line) {
                    if (line.replace(/\r|\n/ig, "") != "") {
                        result_by_line_no_empty.push(line.replace(/\r|\n/ig, ""));
                    }
                });
                callback(null, result_by_line_no_empty);
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
    gSample: function(type) {
        var _ = require('underscore');
        var types = {};
        types[String] = 'string';
        types[Number] = 'string';
        types[Array] = [];
        types[Boolean] = false;
        types[Date] = Date.now();
        if (_.has(types, type)) {
            return types[type];
        } else {
            return null;
        }
    },
    isParse: function(str, type) {
        if (type == Number) {
            return (str == parseInt(str).toString());
        } else if (type == Boolean) {
            str = str.charAt(0).toLowerCase() + str.slice(1);
            if (str == 'true' || str == 'false') {
                return true;
            }
            return false;
        } else if (type == String) {
            return true;
        }

        return false;
    },
    gStringType: function(str) {
        if (str == '') return String;
        if (Common.isParse(str, Number)) {
            return Number;
        }
        if (Common.isParse(str, Boolean)) {
            return Boolean;
        }
        return String;
    },
    realType: function(str) {
        if (str == '') return '';
        if (Common.gStringType(str) == Number) {
            return parseInt(str);
        }
        if (Common.gStringType(str) == Boolean) {
            str = str.charAt(0).toLowerCase() + str.slice(1);
            if (str == 'true' || str == 'false') {
                return true;
            }
            return false;
        }
        return str;
    }
};

exports = module.exports = Common;