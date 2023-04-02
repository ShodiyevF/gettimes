const { error } = require('../config/error.names');
const { uniqRow } = require('./pg');

const request = require('request');

async function requestToTerminal(domain, route, method, body, callback) {
    var options = {
        uri: domain + route,
        auth: {
            user: 'admin',
            pass: 'pok4747Z',
            sendImmediately: false,
        },
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    };

    request(options, function (error, response, body) {
        if (error) {
            return callback(null, error);
        } else if (response.statusCode == 200) {
            return callback(JSON.parse(body), false);
        } else {
            return callback(null, error);
        }
    });
}

module.exports = {
    requestToTerminal,
};
