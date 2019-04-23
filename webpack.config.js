/**
 * Created by Jad on 2017/7/26.
 */
const {getLocalIP} = require('./server/utils');

if(!process.env.NODE_ENV){
    process.env.NODE_ENV = true;
}

const localIP = getLocalIP();
const webpack = require('webpack');
const DEVELOP = JSON.parse(process.env.NODE_ENV);
module.exports = {
    devtool: 'inline-source-map',
    entry: (DEVELOP)?[
        'eventsource-polyfill',
        `webpack-hot-middleware/client?path=http://${localIP}:3000/__webpack_hmr&timeout=20000`,
        __dirname+'/src/index.js'
    ]: [
        __dirname+'/src/index.js'
    ],
    output: {
        path: __dirname + '/public/js',
        publicPath: `http://${localIP}:3000/js`,
        filename: "bundle.js"
    },
    plugins: (DEVELOP)?[
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ]: [],
    devServer: {
        contentBase: './public',
    },
    module: {
        rules: [
            {
                test: /\.(jsx|js)?$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.(css)/,
                loader: "style-loader!css-loader?modules&localIdentName=[path][name]--[local]--[hash:base64:5]"
            },
            {
                test: /\.(less)/,
                loader: "style-loader!css-loader?modules&localIdentName=[path][name]--[local]--[hash:base64:5]!less-loader"
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader?limit=8192'
            }
        ]
    }
};