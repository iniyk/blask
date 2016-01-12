/**
 * Created by iniyk on 16/1/12.
 */

var _Singleton = (function () {
    var instantiated;
    function init() {
        /*
        *
        * ... something while the instance first be loaded.
        *
        **/
        return {
            publicMethod: function () {
                console.log('hello world');
            },
            publicProperty: 'test'
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

function Singleton() {
    return _Singleton.getInstance();
}

exports = module.exports = Singleton;

/**
 * @example
 *
 * var Singleton = require('./Singleton');
 * var singleton = Singleton();
 *
 * singleton.publicMethod();
 */