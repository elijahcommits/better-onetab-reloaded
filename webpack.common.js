/* eslint-disable */
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
// Note: Your package.json lists clean-webpack-plugin ^0.1.19.
// For newer versions (v3+), the syntax is `const { CleanWebpackPlugin } = require('clean-webpack-plugin');`
// and `new CleanWebpackPlugin()`. If you update the plugin, you'll need to change this line and the plugin instantiation.
// For now, keeping your existing `new CleanWebpackPlugin(['dist'])` as it matches your declared version.
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const path = require('path')

// Determine if it's a development build based on NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development';
const mode = process.env.NODE_ENV || 'development' // Ensure 'mode' is defined for minification logic
const PRODUCTION = mode !== 'development'; // Define PRODUCTION for minification logic

// --- START CHANGES: CSP Placeholders for Manifest V3 ---
// For extension_pages, these should generally be empty strings,
// as Chrome Manifest V3 does not allow external script or connect sources for these pages.
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
// --- END CHANGES: CSP Placeholders for Manifest V3 ---

const resolve = (...paths) => path.join(__dirname, ...paths)
const moz = process.env.MOZ

module.exports = {
  entry: {
    app: ['./src/app/index.js'], // This is your main Vue app entry point
    background: ['./src/background/index.js'],
    content: './src/content.js',
    exchanger: './src/exchanger.js',
  },
  output: {
    path: resolve('dist'),
    filename : '[name].js',
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
    new webpack.DefinePlugin({
      DEBUG: mode === 'development',
      PRODUCTION: mode !== 'development',
      MOZ: moz,
    }),
    new CleanWebpackPlugin(['dist']), // Still using the older syntax as per your package.json version
    new CopyWebpackPlugin([
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
    ]),

    // --- START CHANGES: Add HtmlWebpackPlugin for popup.html and options.html ---
    // For your Popup page
    new HtmlWebpackPlugin({
      filename: 'popup.html', // Output filename in 'dist'
      template: 'src/app/index.html', // Source HTML template
      chunks: ['app'], // Include only the 'app' chunk (your main Vue app bundle)
      inject: true, // Inject JS into the HTML
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false,
    }),

    // For your Options Page
    new HtmlWebpackPlugin({
      filename: 'options.html', // Output filename in 'dist'
      template: 'src/app/index.html', // Source HTML template
      chunks: ['app'], // Include only the 'app' chunk
      inject: true, // Inject JS into the HTML
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false,
    }),
    // --- END CHANGES: Add HtmlWebpackPlugin for popup.html and options.html ---

    // Your existing HtmlWebpackPlugin for index.html (if it's still needed, e.g., for a new tab page)
    // If your popup and options are the *only* pages using the 'app' entry,
    // you might consider removing this one to avoid an unused 'index.html' file.
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/app/index.html',
      excludeChunks: ['background', 'content', 'exchanger'], // Ensure these entry points are NOT injected here
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
      name: true,
      // You might want to adjust minChunks for better caching
      // minChunks: Infinity, // This will create one large vendor chunk
      // Consider `minChunks: 2` to share modules used in at least 2 entry points
    },
    minimizer: [], // minimizers are typically configured in webpack.prod.js (as you have)
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      // --- START CHANGE: Point Vue to its runtime-only build ---
      'vue$': 'vue/dist/vue.runtime.esm.js', // THIS IS CRUCIAL for Manifest V3 CSP
      // --- END CHANGE: Point Vue to its runtime-only build ---
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
        loader: 'file-loader',
        options: {
          useRelativePath: true,
        },
      },
      {
        test: /\.png$/,
        use: 'url-loader?mimetype=image/png'
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