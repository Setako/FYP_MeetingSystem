const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    entry: ['webpack/hot/poll?100', './src/main.ts'],
    watch: true,
    watchOptions: {
        aggregateTimeout: 1000
    },
    target: 'node',
    externals: [
        nodeExternals({
            whitelist: ['webpack/hot/poll?100'],
        }),
    ],
    module: {
        rules: [
            {
                test: /.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                    experimentalWatchApi: true,
                },
                exclude: /node_modules/,
            },
        ],
    },
    mode: 'development',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [
            new TsconfigPathsPlugin({
                configFile: './tsconfig.json',
            }),
        ],
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new ForkTsCheckerWebpackPlugin({
            useTypescriptIncrementalApi: true,
        }),
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'main.js',
        publicPath: '/',
        hotUpdateChunkFilename: 'hot/[hash]hot-update.js',
        hotUpdateMainFilename: 'hot/[hash]hot-update.json'
    },
};
