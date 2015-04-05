/*
 * Creates the API for logging data to the log files.
 */

const fs = require('fs');

// LOGS EXPERIMENT INFORMATION
//
//  data = {
//      domain: <string>,
//      user: <string> or <int>,
//      scheme: <string>,
//      mode: <string>,
//      event: <string>,
//      attempt: <int>
//  }
//  callback(error) // Optional
module.exports = function(data, callback) {

    data.time = Date.now();
    const line = ['time', 'domain', 'user', 'scheme', 'mode', 'event', 'attempt'].map(function(item) {
        return (data[item] + '').trim().replace(/"/g, '""').replace(/(^.*[",].*$)/, '"$1"');
    }).join(',') + '\n';

    fs.appendFile('logging/' + data.scheme + '-log.csv', line, callback);
};