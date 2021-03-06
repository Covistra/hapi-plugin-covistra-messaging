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
var _ = require('lodash'),
    Queue = require('bull'),
    P = require('bluebird');

module.exports = function(server, log, config) {

    var REDIS_HOST = config.get('REDIS_URL');
    var REDIS_PORT = parseInt(config.get('REDIS_PORT'));
    var REDIS_PASSWORD = config.get('REDIS_PASSWORD');

    /**
     *
     * @param key
     * @param options
     *  readOnly: Only server components can write messages in this channel. Read-Only for Clients
     *  secure: Only client with validated credentials can access this channel.
     * @constructor
     */
    function Channel(key, options) {
        var _this = this;
        options = options || {};
        this.key = key;
        this.readOnly = options.readOnly || false;
        this.secure = options.secure || false;
        this.subscriptions = [];

        // Create a queue to support persistent channels
        if(options.persistent) {
            this.queue = new Queue('_channel_'+this.key, REDIS_PORT, REDIS_HOST, { no_ready_check: true, auth_pass: REDIS_PASSWORD });

            // Messages are processed through our queue. Distributed processing
            this.queue.process(function(job, done) {
                return P.map(_this.subscriptions, function(subscription) {
                    return subscription.client.emit(job.data.key, job.data.payload);
                }).done(done);
            });

        }
    }

    Channel.prototype.subscribe = function(client) {
        if(client) {
          if(_.isFunction(client.emit)) {
              this.subscriptions.push({client:client});
          }
          else if(_.isFunction(client)) {

              var subscriber = {
                  id: _.uniqueId(this.key + '_client_'),
                  emit: function(key, payload) {
                      return client(key, payload);
                  }
              };

              this.subscriptions.push({client: subscriber});
              return subscriber;
          }
          else {
              throw new Error("invalid subscriber. Must be an event emitter or a function");
          }
        }
        else {
            throw new Error("Invalid subscriber");
        }
    };

    Channel.prototype.unsubscribe = function(client) {
        _.remove(this.subscriptions, function(s){ return s.client.id === client.id });
    };

    Channel.prototype.broadcast = P.method(function(key, payload, options) {
        options = options || {};

        //TODO: Support options to resolve promise with replies from at least a number of subscribers

        if(this.queue) {
            this.queue.add({key: key, payload: payload, options: options});
        }
        else {
            return P.map(this.subscriptions, function(subscription) {
                return subscription.client.emit(key, payload);
            });
        }

    });

    return Channel;
};
