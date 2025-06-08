/* eslint-disable */
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin') // Don't forget to install this if you haven't: npm install clean-webpack-plugin --save-dev
const HtmlWebpackPlugin = require('html-webpack-plugin') // Don't forget to install this if you haven't: npm install html-webpack-plugin --save-dev
const { VueLoaderPlugin } = require('vue-loader') // Don't forget to install this if you haven't: npm install vue-loader --save-dev
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin') // Don't forget to install this if you haven't: npm install vuetify-loader --save-dev
const path = require('path')

// Determine if it's a development build based on NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development';
const mode = process.env.NODE_ENV || 'development' // Ensure 'mode' is defined for minification logic
const PRODUCTION = mode !== 'development'; // Define PRODUCTION for minification logic

// Renamed from 'config' to avoid potential conflict with webpack config object
const clientConfig = {
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
const moz = process.env.MOZ // This variable is not used but kept for context if it's used elsewhere

module.exports = {
  // NEW: Define the multiple entry points for your extension
  entry: {
    app: './src/app/index.js', // Main Vue app UI (e.g., for popup.html and index.html)
    background: './src/background/index.js', // Background service worker entry
    content: './src/content.js', // Content script entry
    gdrive_sandbox: './src/gdrive_sandbox.js', // Google Drive sandbox script entry
  },
  // NEW: Output configuration for multiple entry points
  output: {
    filename: '[name].js', // This will output files like app.js, background.js, content.js, gdrive_sandbox.js
    path: path.resolve(__dirname, 'dist'), // Output directory for all bundled files
    publicPath: '/', // Base path for all assets
    clean: true, // Clean the dist folder before each build (provided by CleanWebpackPlugin)
  },
  mode: mode, // Explicitly set mode (development or production)

  plugins: [
    new CleanWebpackPlugin(), // NEW: Cleans the 'dist' folder before each build

    // NEW: Define global variables that will be available in your JavaScript code
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(mode),
      'PRODUCTION': JSON.stringify(PRODUCTION),
      'DEBUG': JSON.stringify(isDevelopment), // Use 'isDevelopment' for DEBUG
      ...clientConfig[mode], // Dynamically inject environment-specific constants
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
          transform(content) { // Removed 'path' from arguments as it's not used
            content = content.toString();
            if (mode in clientConfig) { // Use clientConfig here
              Object.entries(clientConfig[mode]).map(([key, value]) => {
                content = content.replace(new RegExp(key, 'g'), value);
              });
            }
            return content;
          }
        },
        { from: 'src/assets/icons', to: 'assets/icons' },
        { from: 'src/_locales', to: '_locales' },
        { from: 'src/gdrive_sandbox.html', to: 'gdrive_sandbox.html' },
        // REMOVED: { from: 'src/gdrive_sandbox.js', to: 'gdrive_sandbox.js' },
        // gdrive_sandbox.js is now an entry point and will be bundled by webpack,
        // so it no longer needs to be explicitly copied.
      ],
    }),

    // Plugin for the popup page (populates popup.html)
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: 'src/app/index.html', // Your base HTML template
      chunks: ['app'], // Injects only the 'app' bundle into popup.html
      inject: true, // Injects script tags automatically
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false,
    }),

    // Plugin for the main options/app page (populates index.html)
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/app/index.html', // Your base HTML template
      // For index.html, inject the 'app' chunk (and potentially 'vendors' if splitChunks creates it)
      // and exclude other entry points like background/content scripts.
      chunks: ['app'], // Ensure 'app' bundle is injected into index.html
      excludeChunks: ['background', 'content', 'gdrive_sandbox'], // Exclude other entry bundles
      inject: true,
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false,
    }),

    new VueLoaderPlugin(), // Required for Vue SFCs
    new VuetifyLoaderPlugin(), // Required for Vuetify component tree-shaking
  ],
  performance: {
    hints: false, // Disables performance hints in output
  },
  optimization: {
    // Defines how chunks are split to optimize caching and loading
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/, // All code from node_modules goes into a 'vendors' chunk
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    // minimizer: [], // minimizer configuration is typically handled in webpack.prod.js for production
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'], // Allows omitting these extensions in imports
    alias: {
      'vue$': 'vue/dist/vue.runtime.esm.js', // Ensures correct Vue build is used
      '@': resolve('src'), // Sets up '@' alias to point to your 'src' directory
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader', // Processes Vue Single File Components
      },
      {
        test: /\.js$/,
        loader: 'babel-loader', // Transpiles JavaScript using Babel
        include: [resolve('src')], // Only process JS files in your 'src' directory
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader', // Injects CSS into the DOM for Vue components
          'css-loader' // Interprets @import and url() like import/require()
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader' // Compiles SASS/SCSS to CSS
        ]
      },
      {
        test: /\.styl/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader' // Compiles Stylus to CSS
        ]
      },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        type: 'asset/resource', // Handles fonts and SVGs as separate files
        generator: {
          filename: 'assets/webfonts/[name][ext]', // Output path for fonts
        },
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset', // Handles images
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // Inline images smaller than 8KB as data URLs
          },
        },
        generator: {
          filename: 'assets/img/[name][ext]', // Output path for images
        },
      },
      {
        test: /\.md$/, // Handles Markdown files
        use: [
          { loader: "html-loader" }, // Converts HTML to a JS module
          { loader: "markdown-loader" }, // Converts Markdown to HTML
        ]
      },
    ]
  }
}