const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/_locales',
            to: '_locales'
          }
        ]
      })
    ]
  },
  // This line is important for Chrome Extensions
  filenameHashing: false
};