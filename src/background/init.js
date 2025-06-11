/* eslint-disable */
import _ from 'lodash'
// import logger from '../common/logger' // The logger has been temporarily disabled for debugging
import options from '../common/options'
import storage from '../common/storage'
import migrate from '../common/migrate'
import boss from '../common/service/boss' // Keep import as it's commented out in boss.js
import {normalizeList} from '../common/list'
import commandHandler from './commandHandler'
import messageHandler from './messageHandler'
import listManager from '../common/listManager'
import {setupContextMenus, dynamicDisableMenu, handleContextMenuClicked} from './contextMenus'
import installedEventHandler from './installedEventHandler'
import {updateBrowserAction, getBrowserActionHandler, getCoverBrowserAction} from './browserAction'

import browser from 'webextension-polyfill'

// Global variables for the service worker context
let opts_global = {};
let nightmode_global = false;
let boss_token_global = null;
let updateVersion_global = null;
let drawer_global = false;

const initOptions = async () => {
  const opts = await storage.getOptions() || {}
  const defaultOptions = options.getDefaultOptions()

  if (_.keys(defaultOptions).some(key => !_.has(opts, key))) {
    _.defaults(opts, defaultOptions)
    await storage.setOptions(opts)
  }

  nightmode_global = opts.defaultNightMode
  opts_global = opts;
  const storedDrawer = await storage.get('drawer');
  drawer_global = _.defaultTo(storedDrawer, true);
  return opts
}

const storageChangedHandler = async changes => {
  console.debug('[storage changed]', changes)
  if (changes.boss_token) {
    boss_token_global = changes.boss_token.newValue
  }
  if (changes.opts) {
    opts_global = changes.opts.newValue || options.getDefaultOptions();
    nightmode_global = opts_global.defaultNightMode;
  }
  if (changes.drawer) {
    drawer_global = changes.newValue;
  }

  if (changes.lists) {
    if (opts_global.disableDynamicMenu) return
    await setupContextMenus(opts_global)
  }
}

const tabsChangedHandler = async activeInfo => {
  if (opts_global.disableDynamicMenu) return
  const currentCoverBrowserAction = getCoverBrowserAction();
  if (currentCoverBrowserAction) {
    await currentCoverBrowserAction(activeInfo);
  }
  dynamicDisableMenu()
}

const fixDirtyData = async () => {
  const unlock = await listManager.RWLock.lock()
  const {lists} = await browser.storage.local.get('lists')
  if (lists) {
    const cleanLists = lists.filter(_.isPlainObject).map(normalizeList)
    await browser.storage.local.set({lists: cleanLists})
  }
  await unlock()
}

const init = async () => {
  try {
    // await logger.init() // The logger has been temporarily disabled for debugging
    await listManager.init()
    const opts = await initOptions()
    await updateBrowserAction(opts.browserAction)
    await setupContextMenus(opts)

    browser.runtime.onInstalled.addListener(async () => {
      const opts = await initOptions();
      await setupContextMenus(opts);
    });
    if (browser.commands) {
      browser.commands.onCommand.addListener(commandHandler)
    } else {
      console.warn("browser.commands API is not available. Keyboard shortcuts may not work.");
    }
    browser.runtime.onMessageExternal.addListener(commandHandler)
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'getGlobalState') {
        if (msg.key === 'drawer') {
          sendResponse({ [msg.key]: drawer_global });
        } else if (msg.key === 'nightmode') {
          sendResponse({ [msg.key]: nightmode_global });
        }
        return true;
      }

      if (msg.type === 'setGlobalState') {
        (async () => {
          if (msg.key === 'drawer') {
            drawer_global = msg.value;
            await storage.set({ drawer: msg.value });
          } else if (msg.key === 'nightmode') {
            nightmode_global = msg.value;
            const currentOpts = await storage.getOptions();
            currentOpts.defaultNightMode = msg.value;
            await storage.setOptions(currentOpts);
          }
          sendResponse({ success: true });
        })();
        return true;
      }

      messageHandler(msg);
    });
    browser.runtime.onUpdateAvailable.addListener(detail => { updateVersion_global = detail.version })
    browser.action.onClicked.addListener(async () => {
      const handler = getBrowserActionHandler(opts_global.browserAction);
      if (handler) {
        await handler();
      }
    });
    browser.contextMenus.onClicked.addListener(info => handleContextMenuClicked(info));
    browser.tabs.onActivated.addListener(_.debounce(tabsChangedHandler, 200));
    browser.storage.onChanged.addListener(storageChangedHandler);

    await migrate()
    await fixDirtyData()

  } catch (error) {
    console.error("A critical error occurred during background script initialization:", error);
  }
}

export default init