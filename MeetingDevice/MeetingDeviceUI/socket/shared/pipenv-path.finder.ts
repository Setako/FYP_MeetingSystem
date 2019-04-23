import { join } from 'path';
import { spawnSync } from 'child_process';

const cwd = `${process.cwd()}/recognition/`;
const pipenv = spawnSync('pipenv', ['--vnev'], { cwd });
const isWin = process.platform === 'win32';
const interpreterDir = pipenv.stdout.toString().trim();
const interpreter = isWin
    ? join(interpreterDir, 'Scripts', 'python')
    : join(interpreterDir, 'bin', 'python');

console.log(interpreter);
