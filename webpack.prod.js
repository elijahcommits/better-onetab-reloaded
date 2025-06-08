/* eslint-disable */
const { merge } = require('webpack-merge') // Corrected import for webpack-merge
const common = require('./webpack.common.js')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_debugger: false,
            inline: false,
          },
          sourceMap: true, // sourceMap moved inside terserOptions
        },
        extractComments: false,
        parallel: true,
      }),
    ],
  },
})