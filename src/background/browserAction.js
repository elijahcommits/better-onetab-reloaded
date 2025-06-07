import _ from 'lodash'
import tabs from '../common/tabs'
import options from '../common/options'
import browser from 'webextension-polyfill'
import storage from '../common/storage'

// Module-level variables instead of window.
let currentBrowserAction = ''
let coverBrowserActionFn = _.noop // Replaced empty arrow function with _.noop

const actions = {
  'store-selected': tabs.storeSelectedTabs,
  'show-list': tabs.openTabLists,
  'store-all': tabs.storeAllTabs,
  'store-all-in-all-windows': tabs.storeAllTabInAllWindows,
}

export const getBrowserActionHandler = action => actions[action] || _.noop // Replaced empty arrow function with _.noop

export const updateBrowserAction = async (action, tmp = false) => {
  if (!tmp) currentBrowserAction = action

  coverBrowserActionFn = _.noop // Replaced empty arrow function with _.noop

  const {items} = _.find(options.optionsList, {name: 'browserAction'})
  const {label} = _.find(items, {value: action})
  console.log('action is: ', action, 'set title as: ', label)
  await browser.action.setTitle({title: label}) // Manifest V3 uses browser.action

  if (action === 'popup') {
    await browser.action.setPopup({popup: 'index.html#/popup'})
  } else {
    await browser.action.setPopup({popup: ''})

    const opts = await storage.getOptions()
    if (opts.openTabListWhenNewTab) {
      coverBrowserActionFn = async activeInfo => {
        const tab = await browser.tabs.get(activeInfo.tabId)
        if (['about:home', 'about:newtab', 'chrome://newtab/'].includes(tab.url)) {
          return updateBrowserAction('show-list', true)
        } else {
          return updateBrowserAction(currentBrowserAction)
        }
      }
    }
  }
}

export const getCoverBrowserAction = () => coverBrowserActionFn
