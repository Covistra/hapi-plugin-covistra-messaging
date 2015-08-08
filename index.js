"use strict";
var P = require('bluebird');

exports.register = function (server, options, next) {

    server.dependency(['covistra-socket'], function(plugin, done) {
        plugin.log(['plugin', 'info'], "Registering the messaging plugin");

        var Router = server.plugins['system'].Router;
        var config = server.plugins['covistra-config'].CurrentConfiguration;
        var systemLog = server.plugins['system'].systemLog;

        // Expose our services
        plugin.expose('channelManager', require('./lib/channel-manager')(config, server, systemLog.child({service:'channel-manager'})));
        plugin.expose('workerService', require('./lib/worker-service')(config, server, systemLog.child({service:'worker-service'})));

        // Register routes
        Router.routes(plugin, __dirname, "./routes");

        done();
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
