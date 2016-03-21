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
var _ = require('lodash');
var EE = require('eventemitter2').EventEmitter2;
var util = require('util');
var Path = require('path');
var requireDirectory = require('require-directory');
var P = require('bluebird');

module.exports = function(server, log, config) {

    var socketManager = server.plugins['covistra-socket'].socketManager;

    var Channel = require('./channel')(server, log, config);

    function ChannelManager() {
        this.channels = {};
        EE.call(this);

        // Register our messages in the underlying socket system
        socketManager.registerGlobalHandler('subscribe', this.onSubscribe, { scope: this });
        socketManager.registerGlobalHandler('unsubscribe', this.onUnsubscribe, { scope: this });
    }

    util.inherits(ChannelManager, EE);

    ChannelManager.prototype.onSubscribe = function(msg) {
        var _this = this;
        if(!_.isArray(msg.data)) {
            msg.data = [msg.data];
        }

        // Loop through each provided channel spec
        _.each(msg.data, function(channelKey) {
            var channel = _this.getChannel(channelKey);
            if(channel) {
                channel.subscribe(msg.context.client);
            }
        });

    };

    ChannelManager.prototype.onUnsubscribe = function(msg) {
        var _this = this;
        if(!_.isArray(msg.data)) {
            msg.data = [msg.data];
        }

        // Loop through each provided channel specs
        _.each(msg.data, function(channelKey) {
            var channel = _this.getChannel(channelKey);
            if(channel) {
                channel.unsubscribe(msg.context.client);
            }
        });

    };

    ChannelManager.prototype.openChannel = function(key, options) {
        log.debug("ChannelManager.openChannel", key);
        var channel = this.channels[key];
        if(!channel) {
            channel = new Channel(key, options);
            this.channels[key] = channel;
            this.emit('channel-opened', channel);
            return channel;
        }
        else {
            log.warn("Trying to create a channel with an existing key. Reusing existing channel");
            return channel;
        }
    };

    ChannelManager.prototype.closeChannel = function(key) {
        var channel = this.channels[key];
        if(channel) {
            delete this.channels[key];
            this.emit('channel-closed', channel);
        }
        else {
            log.error("Cannot close channel %s. Not found", key);
        }
    };

    ChannelManager.prototype.getChannel = function(key) {
        return this.channels[key];
    };

    ChannelManager.prototype.listChannels = function(options) {
        return _.values(this.channels);
    };

    ChannelManager.prototype.subscribe = function(channelKey, client) {
        var channel = this.channels[channelKey];
        if(channel) {
            return channel.subscribe(client);
        }
        else {
            throw new Error("unknown-channel:"+channelKey);
        }
    };

    ChannelManager.prototype.unsubscribe = function(channelKey, client) {
        var channel = this.channels[channelKey];
        if(channel) {
            return channel.unsubscribe(client);
        }
        else {
            throw new Error("unknown-channel:"+channelKey);
        }
    };
    
    ChannelManager.prototype.discover = P.method(function() {
        var _this = this;

        if(arguments.length > 1) {
            path = Array.prototype.slice.call(arguments).join("/");
        }
        else if(_.isArray(path)) {
            path = path.join("/");
        }

        log.debug("Registering all events located in path:", Path.resolve(path));
        return requireDirectory(module, Path.resolve(path), {
            visit: function(factory, filename) {
                log.trace("Loading event", filename);
                var event = factory(server, config, log);
                log.debug("Registering event on channel", event.channel);
                _this.subscribe(event.channel, event.handler);
            },
            include: /event\.js$/
        });

    });

    return new ChannelManager();
};
