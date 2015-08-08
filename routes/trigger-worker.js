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

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    pkg = require('../../../package.json'),
    later = require('later'),
    _ = require('lodash');

module.exports = function(server) {

    var workerService = server.plugins['covistra-messaging'].workerService;

    function handler(req, reply) {
        req.log.debug("Trigger worker %s", req.params.workerKey);

        var worker = workerService.getWorker(req.params.workerKey);
        if(worker) {
            req.log.debug("Found worker %s", worker.key);

            if(req.payload.options) {
                
                // Register a worker that will start after a specific delay period
                if(req.payload.options.delay) {
                    var sched = later.parse.text(req.payload.options.delay);
                    later.setTimeout(function() {
                        worker.execute(req.payload.params);
                    }, sched);
                    reply({schedule: sched});
                }
                // Register a recurrent worker based on provided pattern
                else if(req.payload.options.repeat) {
                    var sched = later.parse.text(req.payload.options.delay);
                    later.setInterval(function() {
                        worker.execute(req.payload.params);
                    }, sched);
                    reply({schedule: sched});                    
                }
                else {
                    var job = worker.execute(req.payload);
                    reply({success: true, jobId: job.id});
                }
            }
            else {
                var job = worker.execute(req.payload);
                reply({success: true, jobId: job.id});
            }
        }
        else {
            req.log.error("Invalid Worker Key", req.params.workerKey);
            var res = reply();
            res.statusCode = 400;
        }
    }

    return {
        method: 'POST',
        path: '/workers/{workerKey}',
        handler: handler,
        config: {
            tags: ['api'],
            auth: 'token'
        }
    };
};

