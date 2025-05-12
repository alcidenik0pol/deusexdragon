const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(glb|gltf)$/,
        type: 'asset/resource'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "fs": false,
      "path": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      inject: 'head'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    historyApiFallback: true,
    compress: true,
    port: 9000,
    hot: true
  },
};