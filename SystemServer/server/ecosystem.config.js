module.exports = {
    apps: [
        {
            name: 'commander',
            script: 'dist/main.js',
            node_args: [
                '-r',
                'ts-node/register/transpile-only',
                '-r',
                'tsconfig-paths/register',
            ],
            instances: process.env.WEB_CONCURRENCY || 1,
            output: 'log/out.log',
            error: 'log/err.log',
            merge_logs: true,
        },
    ],
};
