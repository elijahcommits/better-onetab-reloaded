/* eslint-disable */
import _ from 'lodash'
import logger from '../common/logger'
import options from '../common/options'
import storage from '../common/storage'
import migrate from '../common/migrate'
import boss from '../common/service/boss'
import {normalizeList} from '../common/list'
import commandHandler from './commandHandler'
import messageHandler from './messageHandler' // Import messageHandler
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
// Add drawer_global here as it was part of the old backgroundPage global state
let drawer_global = false;

// The duplicated genMethods and logger.init definitions were removed in previous steps.

const initOptions = async () => {
  const opts = await storage.getOptions() || {}
  const defaultOptions = options.getDefaultOptions()

  if (_.keys(defaultOptions).some(key => !_.has(opts, key))) {
    _.defaults(opts, defaultOptions)
    await storage.setOptions(opts)
  }

  nightmode_global = opts.defaultNightMode
  opts_global = opts;
  // Initialize drawer_global from storage or default if not set
  const storedDrawer = await storage.get('drawer'); // Assuming storage has a get method for single key
  drawer_global = _.defaultTo(storedDrawer, true); // Default to true as in original loadDrawer
  return opts
}

const storageChangedHandler = async changes => {
  console.debug('[storage changed]', changes)
  if (changes.boss_token) {
    boss_token_global = changes.boss_token.newValue
  }
  if (changes.opts) {
    // Update opts_global when options change in storage
    opts_global = changes.opts.newValue || options.getDefaultOptions();
    nightmode_global = opts_global.defaultNightMode; // Ensure nightmode_global is updated
  }
  // Also update drawer_global if it was part of changes
  if (changes.drawer) {
    drawer_global = changes.drawer.newValue;
  }

  if (changes.lists) {
    if (opts_global.disableDynamicMenu) return
    // setupContextMenus fetches options internally if needed or relies on passed opts
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
  logger.init()
  await listManager.init()
  const opts = await initOptions() // This will initialize opts_global, nightmode_global, and drawer_global
  await updateBrowserAction(opts.browserAction)
  await setupContextMenus(opts)

  // Pass initial global states to messageHandler (if messageHandler were a function)
  // Since messageHandler.js now has its own mutable globals,
  // we need to set them via a message or directly.
  // The simplest is to ensure messageHandler's globals are initialized on first access
  // or via a dedicated init message. The current messageHandler.js does this for getGlobalState.

  await Promise.all([
    browser.commands.onCommand.addListener(commandHandler),
    browser.runtime.onMessageExternal.addListener(commandHandler),
    // ⬇️ REPLACEMENT START ⬇️
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      // Prioritize handling global state messages from the UI
      if (msg.type === 'getGlobalState') {
        if (msg.key === 'drawer') {
          sendResponse({ [msg.key]: drawer_global });
        } else if (msg.key === 'nightmode') {
          sendResponse({ [msg.key]: nightmode_global });
        }
        return true; // Keep the message channel open for the async response
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
        })(); // Immediately invoke async function
        return true; // Keep the message channel open for the async response
      }

      // For all other messages, use the general message handler
      // and let it handle the response if necessary.
      messageHandler(msg);
    }),
    browser.runtime.onUpdateAvailable.addListener(detail => { updateVersion_global = detail.version }),
    browser.action.onClicked.addListener(async () => {
      const handler = getBrowserActionHandler(opts_global.browserAction);
      if (handler) {
        await handler();
      }
    }),
    browser.contextMenus.onClicked.addListener(info => handleContextMenuClicked(info)),
    browser.tabs.onActivated.addListener(_.debounce(tabsChangedHandler, 200)),
    browser.storage.onChanged.addListener(storageChangedHandler),
  ])
  await migrate()
  await fixDirtyData()
  // Conditionally initialize Boss sync service based on user option
  if (opts_global.useBoss) {
    await boss.init()
  } else {
    console.log('Boss sync service disabled by user option.');
  }
}

export default init