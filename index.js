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

exports.deps = ['covistra-socket'];
exports.register = function (server, options, next) {
    plugin.log(['plugin', 'info'], "Registering the messaging plugin");

    var config = server.plugins['hapi-config'].CurrentConfiguration;
    var systemLog = server.plugins['covistra-system'].systemLog;

    // Expose our services
    plugin.expose('channelManager', require('./lib/channel-manager')(server, systemLog.child({service:'channel-manager'}), config));
    plugin.expose('workerService', require('./lib/worker-service')(server, systemLog.child({service:'worker-service'}), config));

    next();
};

exports.register.attributes = {
    pkg: require(__dirname + '/package.json')
};
