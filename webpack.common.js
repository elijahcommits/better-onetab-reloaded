/* eslint-disable */
const webpack = require('webpack')
const { merge } = require('webpack-merge') // Corrected import for webpack-merge
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const path = require('path')

// Determine if it's a development build based on NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development';
const mode = process.env.NODE_ENV || 'development' // Ensure 'mode' is defined for minification logic
const PRODUCTION = mode !== 'development'; // Define PRODUCTION for minification logic

const config = {
  development: {
    __CLIENT_ID__: '530831729511-eq8apt6dhjimbmdli90jp2ple0lfmn3l.apps.googleusercontent.com',
    __DEV_CSP_SCRIPT__: '', // Changed to empty string for M3 compliance on extension_pages
    __DEV_CSP_CONNECT__: '', // Changed to empty string for M3 compliance on extension_pages
    __EXT_NAME__: 'IceTab (dev)',
    __CONTENT_SCRIPTS_MATCHES__: process.env.MOZ ? '*://*/*' : 'http://127.0.0.1:3000/*',
  },
  production: {
    __CLIENT_ID__: '530831729511-dclgvblhv7var13mvpjochb5f295a6vc.apps.googleusercontent.com',
    __DEV_CSP_SCRIPT__: '', // Already empty, good!
    __DEV_CSP_CONNECT__: '', // Already empty, good!
    __EXT_NAME__: '__MSG_ext_name__',
    __CONTENT_SCRIPTS_MATCHES__: 'https://boss.cnwangjie.com/*',
  }
}

const resolve = (...paths) => path.join(__dirname, ...paths)
const moz = process.env.MOZ

module.exports = {
  // ... other webpack config
  plugins: [
    // ... other plugins
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'src/manifest.json',
        to: 'manifest.json',
        transform(content, path) {
          content = content.toString();
          if (mode in config) {
            Object.entries(config[mode]).map(([key, value]) => {
              content = content.replace(new RegExp(key, 'g'), value);
            });
          }
          return content;
        }
      },
      { from: 'src/assets/icons', to: 'assets/icons' },
      { from: 'src/_locales', to: '_locales' },
      // Corrected paths for sandbox files
      { from: 'src/gdrive_sandbox.html', to: 'gdrive_sandbox.html' },
      { from: 'src/gdrive_sandbox.js', to: 'gdrive_sandbox.js' },
    ],
  }),

    // Plugin for the popup page
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: 'src/app/index.html',
      chunks: ['app'],
      inject: true,
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false,
    }),

    // Plugin for the main options/app page
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/app/index.html',
      excludeChunks: ['background', 'content', 'exchanger'],
      inject: true,
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false,
    }),

    new VueLoaderPlugin(),
    new VuetifyLoaderPlugin(),
  ],
  performance: {
    hints: false,
  },
  optimization: {
    splitChunks: {
      name: 'vendors',
    },
    minimizer: [],
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.runtime.esm.js',
      '@': resolve('src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.styl/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/webfonts/[name][ext]',
        },
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,
          },
        },
        generator: {
          filename: 'assets/img/[name][ext]',
        },
      },
      {
        test: /\.md$/,
        use: [
          { loader: "html-loader" },
          { loader: "markdown-loader" },
        ]
      },
    ]
  }
}