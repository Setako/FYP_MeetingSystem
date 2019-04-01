
const { spawnSync } = require('child_process');
const path = require('path');

const pipenv = spawnSync('pipenv', ['--venv']);

const isWin = process.platform === 'win32';
const interpreterDir = pipenv.stdout.toString().trim()
const interpreter = isWin
    ? path.join(interpreterDir, 'Scripts', 'python')
    : path.join(interpreterDir, 'bin', 'python');

const script = path.join(__dirname, 'server.py');

module.exports = {
    apps: [
        {
            name: 'trainning-server',
            script,
            exec_interpreter:interpreter,
            interpreter_args: ['-u'],
            cwd: __dirname,
            instances: process.env.WEB_CONCURRENCY || 1,
            output: 'log/out.log',
            error: 'log/err.log',
            merge_logs: true,
        },
    ],
};