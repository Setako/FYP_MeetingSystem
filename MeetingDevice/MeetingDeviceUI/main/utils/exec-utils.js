let exec = require('child_process').exec;
module.exports.promiseExec = function(command) {
    return new Promise((resolve, reject) => {
        let child = exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ out: stdout, err: stderr });
        });
    });
};
