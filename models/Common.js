/**
 * Created by iniyk on 16/2/4.
 */

var Common = {
    readJsonConfig: function (file_path) {
        var fs = require('fs');
        var raw_data = fs.readFileSync(file_path, 'utf-8');
        var config = eval('(' + raw_data + ')');
        return config;
    }
};

exports = module.exports = Common;