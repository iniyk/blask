/**
 * Created by iniyk on 16/1/12.
 */

var _Logger = (function () {
    var instantiated;
    function init() {
        var log4js = require('log4js');

        log4js.configure({
            appenders: [
                {type: 'console'}, //console output
                {
                    type: 'file', //file output
                    filename: '../logs/access.log',
                    maxLogSize: 1024,
                    backups: 3,
                    category: 'normal'
                }
            ]
        });

        return {
            handle: function (name, level) {
                var logger = log4js.getLogger(name);
                logger.setLevel(level);

                logger.info("New logger handler started.")

                return logger;
            }
        };
    }

    return {
        getInstance: function () {
            if (!instantiated) {
                instantiated = init();
            }
            return instantiated;
        }
    };
})();

function Logger() {
    return _Logger.getInstance();
}

exports = module.exports = Logger;