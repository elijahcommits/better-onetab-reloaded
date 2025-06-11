import _ from 'lodash'
import __ from '../common/i18n'
import tabs from '../common/tabs'
import storage from '../common/storage'
import browser from 'webextension-polyfill'

console.log('[IceTab] contextMenus.js loaded');

const menus = {
  SHOW_TAB_LIST: tabs.openTabLists,
  STORE_SELECTED_TABS: tabs.storeSelectedTabs,
  STORE: {
    STORE_ALL_TABS_IN_CURRENT_WINDOW: tabs.storeAllTabs,
    STORE_ALL_TABS_IN_ALL_WINDOWS: tabs.storeAllTabInAllWindows,
    STORE_LEFT_TABS: tabs.storeLeftTabs,
    STORE_RIGHT_TABS: tabs.storeRightTabs,
    STORE_TWOSIDE_TABS: tabs.storeTwoSideTabs,
  },
  STORE_TO_TITLED_LIST: {
    STORE_SELECTED_TABS: tabs.storeSelectedTabs,
    STORE_ALL_TABS_IN_CURRENT_WINDOW: tabs.storeAllTabs,
    STORE_LEFT_TABS: tabs.storeLeftTabs,
    STORE_RIGHT_TABS: tabs.storeRightTabs,
    STORE_TWOSIDE_TABS: tabs.storeTwoSideTabs,
  }
}

export const dynamicDisableMenu = async lists => {
  console.log('[IceTab] Running dynamicDisableMenu...');
  const groupedTabs = await tabs.groupTabsInCurrentWindow()
  const windows = await browser.windows.getAll()
  try {
    browser.contextMenus.update('STORE.STORE_LEFT_TABS', {
      enabled: groupedTabs.left.length !== 0,
      title: __('menu_STORE_LEFT_TABS') + ` (${groupedTabs.left.length})`,
    })
    browser.contextMenus.update('STORE.STORE_RIGHT_TABS', {
      enabled: groupedTabs.right.length !== 0,
      title: __('menu_STORE_RIGHT_TABS') + ` (${groupedTabs.right.length})`,
    })
    browser.contextMenus.update('STORE.STORE_TWOSIDE_TABS', {
      enabled: groupedTabs.twoSide.length !== 0,
      title: __('menu_STORE_TWOSIDE_TABS') + ` (${groupedTabs.twoSide.length})`,
    })
    browser.contextMenus.update('STORE.STORE_ALL_TABS_IN_ALL_WINDOWS', {
      enabled: windows.length > 1,
    })
    browser.contextMenus.update('STORE.STORE_ALL_TABS_IN_CURRENT_WINDOW', {
      title: __('menu_STORE_ALL_TABS_IN_CURRENT_WINDOW') + ` (${groupedTabs.all.length})`,
    })
    browser.contextMenus.update('STORE_SELECTED_TABS', {
      title: __('menu_STORE_SELECTED_TABS') + ` (${groupedTabs.inter.length})`,
    })

    lists = lists || await storage.getLists()

    for (let i = 0; i < lists.length; i += 1) {
      if (!lists[i].title) continue
      browser.contextMenus.update('STORE_TO_TITLED_LIST.STORE_LEFT_TABS|' + i, {
        enabled: groupedTabs.left.length !== 0,
        title: __('menu_STORE_LEFT_TABS') + ` (${groupedTabs.left.length})`,
      })
      browser.contextMenus.update('STORE_TO_TITLED_LIST.STORE_RIGHT_TABS|' + i, {
        enabled: groupedTabs.right.length !== 0,
        title: __('menu_STORE_RIGHT_TABS') + ` (${groupedTabs.right.length})`,
      })
      browser.contextMenus.update('STORE_TO_TITLED_LIST.STORE_TWOSIDE_TABS|' + i, {
        enabled: groupedTabs.twoSide.length !== 0,
        title: __('menu_STORE_TWOSIDE_TABS') + ` (${groupedTabs.twoSide.length})`,
      })
      browser.contextMenus.update('STORE_TO_TITLED_LIST.STORE_ALL_TABS_IN_CURRENT_WINDOW|' + i, {
        title: __('menu_STORE_ALL_TABS_IN_CURRENT_WINDOW') + ` (${groupedTabs.all.length})`,
      })
      browser.contextMenus.update('STORE_TO_TITLED_LIST.STORE_SELECTED_TABS|' + i, {
        title: __('menu_STORE_SELECTED_TABS') + ` (${groupedTabs.inter.length})`,
      })
    }
  } catch (error) {
    console.error('[IceTab] Error updating dynamic menus:', error);
  }
}

const createMenus = async (obj, parent, contexts, lists) => {
  const opts = await storage.getOptions()

  if (obj === menus.STORE_TO_TITLED_LIST) {
    if (opts.disableDynamicMenu) return
    for (let listIndex = 0; listIndex < lists.length; listIndex += 1) {
      if (!lists[listIndex].title) continue
      let id; // Declare id here, outside the try block
      const prop = {
        id: 'STORE_TO_TITLED_LIST|' + listIndex,
        title: lists[listIndex].title,
        contexts,
        parentId: 'STORE_TO_TITLED_LIST',
      }
      try {
        id = await browser.contextMenus.create(prop) // Assign to the outer id
        console.log('[IceTab] Context menu created:', id, prop);
      } catch (error) {
        console.error('[IceTab] FAILED to create context menu:', prop, error);
        continue; // If the parent menu fails to create, skip to the next iteration
      }

      for (const key in obj) {
        const childProp = { // Renamed to avoid shadowing
          id: 'STORE_TO_TITLED_LIST.' + key + '|' + listIndex,
          title: __('menu_' + key),
          contexts,
          parentId: id, // Now 'id' is accessible
        }
        try {
            const childId = await browser.contextMenus.create(childProp)
            console.log('[IceTab] Context menu created:', childId, childProp);
        } catch (error) {
            console.error('[IceTab] FAILED to create context menu:', childProp, error);
        }
      }
    }
  } else {
    for (const key of Object.keys(obj)) {
      const prop = {
        id: key,
        title: __('menu_' + key),
        contexts,
      }
      if (parent) {
        prop.id = parent + '.' + key
        prop.parentId = parent
      }
      try {
        const id = await browser.contextMenus.create(prop)
        console.log('[IceTab] Context menu created:', id, prop);
        if (_.isPlainObject(obj[key])) await createMenus(obj[key], key, contexts, lists)
      } catch (error) {
        console.error('[IceTab] FAILED to create context menu:', prop, error);
      }
    }
  }
}

export const handleContextMenuClicked = info => {
  console.log('[IceTab] Context menu clicked!', info);
  try {
    const handler = _.get(menus, info.menuItemId);
    if (typeof handler === 'function') {
      handler();
    } else if (info.menuItemId.startsWith('STORE_TO_TITLED_LIST')) {
      const [key, listIndex] = info.menuItemId.split('|')
      const dynamicHandler = _.get(menus, key);
      if (typeof dynamicHandler === 'function') {
        dynamicHandler(+listIndex)
      } else {
        console.error('[IceTab] No handler found for dynamic menu item:', info.menuItemId);
      }
    } else {
      console.error('[IceTab] No handler found for menu item:', info.menuItemId);
    }
  } catch (error) {
    console.error('[IceTab] Error executing context menu handler for:', info.menuItemId, error);
  }
}

export const setupContextMenus = async ({pageContext, allContext}) => {
  console.log('[IceTab] Setting up context menus...');
  await browser.contextMenus.removeAll();
  console.log('[IceTab] All context menus removed.');

  const contexts = ['action']
  if (pageContext) {
    contexts.push('page')
    if (allContext) contexts.push('all')
  }
  const lists = await storage.getLists()

  console.log('[IceTab] Creating menus with contexts:', contexts);
  await createMenus(menus, null, contexts, lists)
  console.log('[IceTab] Finished creating menus.');

  await dynamicDisableMenu(lists)
  console.log('[IceTab] Finished updating dynamic menus.');
}
