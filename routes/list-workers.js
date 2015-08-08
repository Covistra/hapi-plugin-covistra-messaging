"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    _ = require('lodash');

module.exports = function(server) {

    var workerService = server.plugins['covistra-messaging'].workerService;

    function handler(req, reply) {
        req.log.debug("GET /workers");
        workerService.listWorkers().then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'GET',
        path: '/workers',
        handler: handler,
        config: {
            tags: ['api'],
            auth: 'token'
        }
    };
};

