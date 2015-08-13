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
var path = require('path');
var bunyan = require('bunyan');
var sinon = require('sinon');

var config = {
};

function TestEnv() {

    this.server = {
        plugins:{
            'covistra-system': {
                clock: {
                    nowTs: function() {
                        return 1;
                    }
                },
                systemLog: bunyan.createLogger({name: 'unit-test', level: 'trace'})
            },
            'covistra-socket':{
                socketManager: {
                }
            }
        }
    };
    this.log = {
        debug: console.log.bind(console),
        warn: console.log.bind(console)
    };
    this.config = {
        get: function(key) {

        }
    };
}

TestEnv.prototype.require = function(modulePath) {
    return require(path.resolve(__dirname, "../..", modulePath));
};

module.exports = new TestEnv();
