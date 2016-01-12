/**
 * Created by iniyk on 16/1/11.
 */

/**
 *
 * Class to connect with the Hbase using thrift.
 * Only one instance should exist.
 * Object Singleton defined and implemented here.
 *
 */
var _HbaseConnector = (function () {
    var instantiated;
    function init() {
        var Logger = require("./Logger");
        var logger = Logger().handle("HbaseConnector", "INFO");
        // This section includes a fix from here:
        // https://stackoverflow.com/questions/17415528/nodejs-hbase-thrift-weirdness/21141862#21141862
        var thrift = require('thrift');
        var HBase = require('./gen-nodejs/HBase.js');
        var HBaseTypes = require('./gen-nodejs/HBase_types.js');

        var connection = thrift.createConnection('192.168.1.3', 9090, {
            transport: thrift.TFramedTransport
            //protocol: thrift.TBinaryProtocol
        });

        connection.on('error', function (err) {
            logger.error(err);
        });

        return {
            showTables: function () {
                connection.on('connect', function () {
                    var client = thrift.createClient(HBase, connection);
                    logger.info("Connect to Hbase success.");
                    client.getTableNames(function (err, data) {
                        if (err) {
                            logger.error('In client.getTableNames : ' + err);
                        } else {
                            logger.info('Hbase tables:', data.toString());
                        }
                        connection.end();
                    });
                });
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

function HbaseConnector() {
    return _HbaseConnector.getInstance();
}

exports = module.exports = HbaseConnector;