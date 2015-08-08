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



