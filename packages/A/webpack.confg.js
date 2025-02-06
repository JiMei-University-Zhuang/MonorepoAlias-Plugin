// packages/A/webpack.config.js
const path = require('path');
const MonorepoAliasPlugin = require('./src/MonorepoAliasPlugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.ts'), 
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'] 
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), 
    },
    compress: true,
    port: 8080
  },
  plugins: [
    new MonorepoAliasPlugin()
  ]
};