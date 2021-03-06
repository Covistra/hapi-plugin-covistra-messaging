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

var Queue = require('bull'),
    _ = require('lodash'),
    util = require('util'),
    EE = require('events').EventEmitter,
    P = require('bluebird');

module.exports = function(server, log, config) {

    var workers = {};

    var REDIS_HOST = config.get('REDIS_URL') || 'localhost';
    var REDIS_PORT = parseInt(config.get('REDIS_PORT')) || 6379;
    var REDIS_PASSWORD = config.get('REDIS_PASSWORD');

    log.info("WorkerService connecting to Redis DB at %s:%d", REDIS_HOST, REDIS_PORT);

    var redisOpts = { no_ready_check: true };
    if(REDIS_PASSWORD) {
        log.info("Redis AUTH will be performed");
        redisOpts.auth_pass = REDIS_PASSWORD;
    }

    try {
        var results = new Queue('_worker_results', REDIS_PORT, REDIS_HOST, redisOpts);
        results.process(function(job, done) {
            log.debug("Handling job result for worker %s", job.data._worker);
            var w = workers[job.data._worker];
            if(w) {
                log.debug("Resolving worker job %s results", job.data._resultId);
                job.resolve_ts = Date.now();
                if(job.data._success) {
                    w.resolveJob(job.data._resultId, job.data.result);
                }
                else {
                    w.rejectJob(job.data._resultId, job.data.result);
                }
            }
            else {
                log.warn("No registered worker %s to handle job result", job.data._worker);
            }
            done();
        });
    }
    catch(err) {
        log.error(err);
    }

    function Worker(workerKey, handler, log) {
        log.debug("Launching worker %s", workerKey);
        this.jobs = {};
        this.key = workerKey;
        this.queue = new Queue(workerKey, REDIS_PORT, REDIS_HOST, redisOpts);
        this.queue.process(handler.bind(this));
        log.debug("worker %s started", this.key);
    }

    util.inherits(Worker, EE);

    Worker.prototype.execute = function(data) {
        var job = {
            id: _.uniqueId(this.key+"_job"),
            start_ts: Date.now()
        };

        job.promise = new P(function(resolve, reject) {
            log.debug("Launching job %s", job.id, job);

            job.resolve = resolve;
            job.reject = reject;

            data._resultId = job.id;

            log.debug("Sending job %s to worker", job.id);
            job.submit_ts = Date.now();
            this.queue.add(data);
        }.bind(this));

        log.debug("Registering active job %s", job.id);
        this.jobs[job.id] = job;
        return job;
    };

    Worker.prototype.close = function() {
        this.queue.close();
    };

    Worker.prototype.resolveJob = function(jobId, result) {
        log.debug("Worker:resolveJob", jobId);
        var job = this.jobs[jobId];
        if(job) {
            log.debug("Found job %s to resolve", jobId);
            delete this.jobs[jobId];
            return job.resolve(result);
        }
        else {
            log.warn("No job with id %s for worker %s", jobId, this.key);
        }
    };

    Worker.prototype.rejectJob = function(jobId, error){
        log.debug("Worker:rejectJob", jobId);
        var job = this.jobs[jobId];
        if(job) {
            log.debug("Found job %s to resolve", jobId);
            delete this.jobs[jobId];
            return job.reject(error);
        }
        else {
            log.warn("No job with id %s for worker %s", jobId, this.key);
        }
    };

    Worker.prototype.postResult = function(jobId, result, done) {
        log.debug("Worker:postResult", result);
        results.add({
            _resultId: jobId,
            _worker: this.key,
            _success: true,
            result: result
        });
        if(done) {
            done();
        }
    };

    Worker.prototype.throwError = function(jobId, error, done) {
        log.debug("Worker:postError", error);
        results.add({
            _resultId: jobId,
            _worker: this.key,
            _success: false,
            error: error
        });
        if(done) {
            done();
        }
    };

    Worker.prototype.getJob = function(jobId) {
        log.debug("Worker:getJob", jobId);
        return this.jobs[jobId];
    };

    function WorkerService() {
    }

    WorkerService.prototype.getWorker = function(workerKey) {
        log.debug("WorkerService:getWorker", workerKey);
        return workers[workerKey];
    };

    WorkerService.prototype.register = function(workerKey, handler) {
        log.debug("WorkerService:register", workerKey);
        return new P(function(resolve) {
            var w = new Worker(workerKey, handler, log.child({worker: workerKey}));
            workers[workerKey] = w;
            resolve(w);
        });
    };

    WorkerService.prototype.unregister = function(id) {
        var w = workers[id];
        if(w) {
            w.close();
            delete workers[id];
        }
    };

    WorkerService.prototype.listWorkers = function() {
        log.debug("WorkerService:listWorkers");
        return P.map([], function(worker) {
            return worker;
        });
    };

    return new WorkerService();
};
