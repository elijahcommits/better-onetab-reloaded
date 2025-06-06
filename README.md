# Better OneTab **RELOADED**

**(Based on the archived [Better OneTab](https://github.com/cnwangjie/better-onetab) by cnwangjie)**

This project is a continuation and maintenance effort for the excellent [Better OneTab extension](https://github.com/cnwangjie/better-onetab) which has been archived by its original author, cnwangjie. My goal is to keep the project updated and address bugs, as I use the extension... extensively myself.

---

<p align="center">
  <img src="https://user-images.githubusercontent.com/36993664/44917039-f208ad80-ad3f-11e8-85e9-e29489f0ffb4.png">
</p>

<p align="center">
<a href="https://circleci.com/gh/cnwangjie/better-onetab"><img src="https://img.shields.io/circleci/project/github/cnwangjie/better-onetab/master.svg?style=flat-square" alt="CircleCI"></a>
<a href="https://chrome.google.com/webstore/detail/better-onetab/eookhngofldnbnidjlbkeecljkfpmfpg"><img src="https://img.shields.io/chrome-web-store/v/eookhngofldnbnidjlbkeecljkfpmfpg.svg?style=flat-square" alt="Chrome Web Store"></a>
<a href="https://addons.mozilla.org/firefox/addon/better-onetab/"><img src="https://img.shields.io/amo/v/better-onetab.svg?style=flat-square" alt="Mozilla Add-ons"></a>
<img src="https://img.shields.io/github/license/cnwangjie/better-onetab.svg?style=flat-square" alt="GitHub">
<img src="https://img.shields.io/github/last-commit/cnwangjie/better-onetab.svg?style=flat-square" alt="GitHub last commit">
<a href="https://gitter.im/better-onetab/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge"><img src="https://img.shields.io/gitter/room/better-onetab/Lobby.svg?style=flat-square" alt="Join the chat at https://gitter.im/better-onetab/Lobby"></a>
</p>

### A better onetab extension

More beautiful and more feature.

### Features

[Send us a feature request.](https://github.com/cnwangjie/better-onetab/issues/new)

 - [x] Basic feature of OneTab
 - [x] Popup page with simple list
 - [x] Pin tab list
 - [x] Keyboard shortcuts
 - [x] Options
 - [x] Drag and drop re-ordering
 - [x] Data & Options sync
 - [x] Import & Export
 - [x] Add stored tabs to history
 - [x] I18N support (only English & Chinese currently)

More details in [changelog](CHANGELOG.md)

### Next step

You can learn more about the next step of better onetab at [project page](https://github.com/cnwangjie/better-onetab/projects/1) and leave your comment in [issues page](https://github.com/cnwangjie/better-onetab/issues).

### Installation

~~Download the released .crx file in [releases page](https://github.com/cnwangjie/better-onetab/releases) and drag it to chrome extensions page.~~

Build your own from following steps：

### Development / Build From Source

0. Clone this repo
0. Install dependencies (use `yarn install` command while in the root directory)
0. Auto reload (for developers - use `yarn dev` command while in the root directory)
0. Build (use `NODE_OPTIONS=--openssl-legacy-provider yarn build` command while in the root directory)
0. Click LOAD UNPACKED button and select ./dist path


### Regular Install (for those who aren't raging nerds like myself)

0. Download the dist.crx file from the ./crx folder.
0. Drag the .crx file directly into your Extensions page (Settings > Extensions > Manage Extensions).
0. Please let me know if these instructions don't work for you.

### Special thanks

Thanks for [@Yasujizr](https://github.com/Yasujizr) helped this project design new logo and banners.

### License

MIT LICENSE

---
