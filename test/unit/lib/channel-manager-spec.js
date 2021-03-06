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
var expect = require('chai').expect;
var sinon = require('sinon');
var EE = require('eventemitter2').EventEmitter2;
var env = require('../test-env');

describe('ChannelManager', function() {
    var ChannelManager;

    before(function () {
        ChannelManager = env.require('./lib/channel-manager')(env.server, env.log, env.config);
    });

    describe('cstor', function() {

        beforeEach(function() {
            // Setup our spy
            env.server.plugins['covistra-socket'].socketManager.registerGlobalHandler = sinon.spy();
        });

        it('should be an EventEmitter2 instance',function() {
            var cm = new ChannelManager();
            expect(cm).to.be.an.instanceOf(EE);
        });

        it('should register subscribe and unsubscribe global handlers on socket', function() {
            var cm = new ChannelManager();
            expect(env.server.plugins['covistra-socket'].socketManager.registerGlobalHandler.callCount).to.equal(2);
        });

    });

    describe('openChannel', function() {
        var cm;

        beforeEach(function(){
            cm = new ChannelManager();
        });

        it('should register a new channel when openChannel is called with valid parameters', function() {
            cm.emit = sinon.spy();
            var channel = cm.openChannel('test-channel');
            expect(cm.channels[channel.key]).to.equal(channel);
            expect(cm.emit.firstCall.args[0]).to.equal('channel-opened');
            expect(cm.emit.firstCall.args[1].key).to.equal('test-channel');
        });

        it('should return the same channel if key already exists', function(){
            cm.emit = sinon.spy();
            var channel1 = cm.openChannel('test-channel');
            var channel2 = cm.openChannel('test-channel');
            expect(cm.channels[channel1.key]).to.equal(channel1);
            expect(cm.channels).to.contains.all.keys(['test-channel']);
            expect(channel2).to.equal(channel1);
            expect(cm.emit.firstCall.args[0]).to.equal('channel-opened');
            expect(cm.emit.firstCall.args[1].key).to.equal('test-channel');
        });
    });
});