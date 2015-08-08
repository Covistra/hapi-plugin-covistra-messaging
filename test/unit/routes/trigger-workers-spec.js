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

describe('route:trigger-workers', function () {
    var ctx, credentials, workerService;

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

            workerService = ctx.server.plugins['messaging'].workerService;

            done();
        });
    });

    it('should return a 404 if no workerId is provided', function(done) {
        ctx.server.inject({
            method: 'POST',
            url: '/workers',
            credentials: credentials
        }, function(res) {
            expect(res.result.statusCode).to.equal(404);
            done();
        });

    });

    it("should trigger a 400 if workerKey doesn't resolve to a valid worker", function(done) {
        ctx.server.inject({
            method: 'POST',
            url: '/workers/invalidTestWorker',
            credentials: credentials
        }, function(res) {
            expect(res.statusCode).to.equal(400);
            done();
        });

    });

    it.skip("should trigger a valid worker job instance", function(done) {
        this.timeout(350);

        // Register our test worker
        workerService.register('testWorker', function(job, done) {
            ctx.log.debug("Executing job %s", job.jobId, job.data);
            this.postResult(job.data._resultId, {status: 'success', value: 'good'}, done);
        });

        ctx.server.inject({
            method: 'POST',
            url: '/workers/testWorker',
            credentials: credentials,
            payload: {
                field: true,
                jobName: 'test-unit-1'
            }
        }, function(res) {
            ctx.log.debug("Received response from route", res.result);
            expect(res.statusCode).to.equal(200);

            var job = workerService.getWorker('testWorker').getJob(res.result.jobId);
            job.promise.then(function(result) {
                ctx.log.debug("Job %s has completed with result", job.id, result);
                expect(result).to.eql({status: 'success', value: 'good'});
                done();
            }).catch(done).finally(function() {
                workerService.unregister('testWorker');
            });

        });

    });

});



