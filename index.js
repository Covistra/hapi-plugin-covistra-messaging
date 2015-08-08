/**

 Copyright 2015 Covistra Technologies Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

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
