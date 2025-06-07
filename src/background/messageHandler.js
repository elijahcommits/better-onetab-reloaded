import tabs from '../common/tabs'
import storage from '../common/storage'
import boss from '../common/service/boss'
import {sendMessage} from '../common/utils'
import listManager from '../common/listManager'
import {setupContextMenus} from './contextMenus'
import {updateBrowserAction} from './browserAction'
import _ from 'lodash' // ADD THIS LINE TO IMPORT LODASH

// Global state variables are now managed in init.js and accessed via messages.
// These local variables in messageHandler.js are no longer needed
// if init.js handles the global state.
// Removed:
// let opts_global_mh = {};
// let nightmode_global_mh = false;
// let drawer_global_mh = false;

const messageHandler = async msg => {
  console.debug('received', msg)
  if (msg.optionsChanged) {
    const changes = msg.optionsChanged
    console.debug('options changed', changes)

    const latestOpts = await storage.getOptions()
    Object.assign(latestOpts, changes)
    await storage.setOptions(latestOpts) // Persist updated options

    // Removed direct update to local opts_global_mh as state is managed in init.js
    // Object.assign(opts_global_mh, latestOpts);
    // nightmode_global_mh = latestOpts.defaultNightMode;

    if (changes.browserAction) updateBrowserAction(changes.browserAction)
    if (['pageContext', 'allContext', 'disableDynamicMenu'].some(k => k in changes)) {
      await setupContextMenus(latestOpts)
    }
    await sendMessage({optionsChangeHandledStatus: 'success'})
  }
  if (msg.restoreList) {
    const {restoreList} = msg
    const listIndex = restoreList.index
    const lists = await storage.getLists()
    const list = lists[listIndex]
    if (restoreList.newWindow) {
      tabs.restoreListInNewWindow(list)
    } else {
      tabs.restoreList(list)
    }
    if (!list.pinned) {
      listManager.removeListById(list._id)
    }
  }
  if (msg.storeInto) {
    tabs.storeSelectedTabs(msg.storeInto.index)
  }
  if (msg.login) {
    boss.login(msg.login.token)
  }
  if (msg.refresh) {
    boss.refresh()
  }
  if (msg.import) {
    const {lists} = msg.import
    lists.forEach(list => listManager.addList(list))
  }

  // --- New: Handle messages for global state (drawer, nightmode) ---
  // This part is crucial for the frontend to communicate with the service worker's state.
  // The actual state update logic has been moved to init.js's onMessage listener.
  // This function will now primarily process general messages, and init.js will handle the specific 'getGlobalState'/'setGlobalState' responses.
  // The structure below is for messageHandler to process the initial request,
  // but the response to the frontend will come from init.js's listener.

  // The 'getGlobalState' and 'setGlobalState' types are handled directly in init.js's
  // `browser.runtime.onMessage.addListener` function.
  // So, no changes are needed here for those specific message types if they are handled elsewhere.
  // If this messageHandler is the *only* listener, then the switch statement needs to be
  // within the onMessage listener in init.js, or the messageHandler needs to return the response.

  // Given the latest `init.js` update, the `getGlobalState` and `setGlobalState` logic
  // in `messageHandler.js` is redundant and should be removed.
  // The `init.js` handles these specific message types and calls `messageHandler` for others.

  // Let's ensure the message handler does not attempt to handle global state itself
  // if `init.js` is the one managing the `onMessage` listener and dispatching.
  // The primary `messageHandler` should just process its own messages.

  // Original code block that was in messageHandler for global state,
  // which is now handled by init.js's listener:
  /*
  if (msg.type === 'getGlobalState') {
    switch (msg.key) {
      case 'drawer':
        // No longer relying on local `drawer_global_mh` here
        return { [msg.key]: true }; // Response handled by init.js
      case 'nightmode':
        // No longer relying on local `nightmode_global_mh` here
        return { [msg.key]: false }; // Response handled by init.js
      default:
        return {};
    }
  }
  if (msg.type === 'setGlobalState') {
    switch (msg.key) {
      case 'drawer':
        // Update handled by init.js
        break;
      case 'nightmode':
        // Update handled by init.js
        break;
    }
    return { success: true };
  }
  */
  // --- End of (now removed) New Message Handlers ---
}

// Make sure to export the global variables if messageHandler needs to access them
// or if init.js sets them for messageHandler to use.
// For now, we'll set up a direct message to initialize these from init.js,
// or ensure init.js sets them on the module scope.
// A simpler solution is to declare these global variables outside and
// messageHandler updates them directly.

// Initializing the global state for messageHandler
// This pattern can be tricky with service workers; a better way is to pass
// an object that holds state to messageHandler or have init.js set it on `self` or `browser.storage`.
// For simplicity, let's modify init.js to pass the global states to messageHandler on init.
// Or just let them be initialized on first request via `getGlobalState`.
// Let's create an export to make them accessible from `init.js`
// export { opts_global_mh, nightmode_global_mh, drawer_global_mh }; // These exports are not needed now

// This part for message listener should be outside the messageHandler function itself
// It's already in init.js: browser.runtime.onMessage.addListener(messageHandler),
export default messageHandler
