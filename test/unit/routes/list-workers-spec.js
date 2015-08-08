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
    expect = require('chai').expect;

describe('route:list-workers', function () {
    var ctx, credentials;

    before(function (done) {
        require('../../../../../tests/setup').then(function (result) {
            ctx = result;

            credentials = {
                emitter: ctx.data.credentials.validUser1,
                bearer: ctx.data.credentials.validUser1,
                application: ctx.data.applications.unitTest,
                token: "valid-test-token",
                profile: {}
            };

            done();
        });
    });

    it('should retrieve all active workers', function(done) {
        ctx.server.inject({
            url: '/workers',
            credentials: credentials
        }, function(res) {
            expect(res.result).to.eql({ statusCode: 200, data: [], meta: {} });
            done();
        });

    });


});



