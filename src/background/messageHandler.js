import tabs from '../common/tabs'
import storage from '../common/storage'
// import boss from '../common/service/boss' // Keep import commented if you previously uncommented it for boss.js
import {sendMessage} from '../common/utils'
import listManager from '../common/listManager'
import {setupContextMenus} from './contextMenus'
import {updateBrowserAction} from './browserAction'

const messageHandler = async msg => {
  console.debug('received', msg)
  if (msg.optionsChanged) {
    const changes = msg.optionsChanged
    console.debug('options changed', changes)

    const latestOpts = await storage.getOptions()
    Object.assign(latestOpts, changes)
    await storage.setOptions(latestOpts)

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
  /*
  if (msg.login) {
    boss.login(msg.login.token)
  }
  if (msg.refresh) {
    boss.refresh()
  }
  */
  if (msg.import) {
    const {lists} = msg.import
    lists.forEach(list => listManager.addList(list))
  }
}

export default messageHandler
