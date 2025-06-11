/* eslint-disable */
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const path = require('path')

const isDevelopment = process.env.NODE_ENV === 'development';
const mode = process.env.NODE_ENV || 'development'
const PRODUCTION = mode !== 'development';

const clientConfig = {
  development: {
    __CLIENT_ID__: '530831729511-eq8apt6dhjimbmdli90jp2ple0lfmn3l.apps.googleusercontent.com',
    __DEV_CSP_SCRIPT__: '',
    __DEV_CSP_CONNECT__: '',
    __EXT_NAME__: 'IceTab (dev)',
    __CONTENT_SCRIPTS_MATCHES__: process.env.MOZ ? '*://*/*' : 'http://127.0.0.1:3000/*',
  },
  production: {
    __CLIENT_ID__: '530831729511-dclgvblhv7var13mvpjochb5f295a6vc.apps.googleusercontent.com',
    __DEV_CSP_SCRIPT__: '',
    __DEV_CSP_CONNECT__: '',
    __EXT_NAME__: '__MSG_ext_name__',
    __CONTENT_SCRIPTS_MATCHES__: 'https://boss.cnwangjie.com/*',
  }
}

const resolve = (...paths) => path.join(__dirname, ...paths)
const moz = process.env.MOZ

module.exports = {
  entry: {
    app: './src/app/index.js',
    background: './src/background/index.js',
    content: './src/content.js',
    gdrive_sandbox: './src/gdrive_sandbox.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  mode: mode,

  plugins: [
    new CleanWebpackPlugin(),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(mode),
      'PRODUCTION': JSON.stringify(PRODUCTION),
      'DEBUG': JSON.stringify(isDevelopment),
      ...clientConfig[mode],
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
          // The broken transform function has been removed to ensure a clean copy.
        },
        { from: 'src/assets/icons', to: 'assets/icons' },
        { from: 'src/_locales', to: '_locales' },
        { from: 'src/gdrive_sandbox.html', to: 'gdrive_sandbox.html' },
      ],
    }),

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

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/app/index.html',
      chunks: ['app'],
      excludeChunks: ['background', 'content', 'gdrive_sandbox'],
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
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: (chunk) => {
            return chunk.name === 'app';
          }
        },
      },
    },
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