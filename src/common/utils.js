import _ from 'lodash'
import __ from './i18n'
import { formatDistanceToNow, format, isSameYear } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import {COLORS} from './constants'
import browser from 'webextension-polyfill'

// Map your @@ui_locale to date-fns locale objects
const dateFnsLocales = {
  en: enUS,
  zh_CN: zhCN,
  de: zhCN, // Assuming 'de' maps to zhCN locale or needs a separate de locale from date-fns
}

const getDateFnsLocale = uiLocale => dateFnsLocales[uiLocale.split('-')[0]] || enUS

export const formatTime = time => {
  const date = new Date(time)
  const now = new Date()
  const locale = getDateFnsLocale(__('@@ui_locale'))

  // If time difference is less than 1 hour (3600E3 milliseconds)
  if (now.getTime() - time < 3600E3) {
    return formatDistanceToNow(date, { addSuffix: true, locale })
  }

  const withYear = !isSameYear(date, now)
  const formatString = `iii, MMMM do ${withYear ? 'yyyy' : ''}, HH:mm:ss`
  return format(date, formatString, { locale })
}
export const one = fn => {
  let executing = false
  return async function onceAtSameTimeFunction(...args) {
    if (executing) return
    executing = true
    let re
    try {
      re = await fn.apply(this, args) // eslint-disable-line no-invalid-this
    } catch (error) {
      throw error
    } finally {
      executing = false
    }
    return re
  }
}
export const checkPermission = async permission => {
  if (await browser.permissions.contains({permissions: [permission]})) return true
  return browser.permissions.request({permissions: [permission]})
}
export const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onloadend = event => resolve(event.target.result)
  reader.onerror = reject
  reader.readAsText(file)
})
export const genObjectId = () => {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16)
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase()
}
export const isBackground = () => typeof self.importScripts === 'function'

export const formatSize = bytes => {
  const sufixes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return !bytes && '0 Bytes' || (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sufixes[i]
}
export const sleep = ms => new Promise(r => setTimeout(r, ms))

export const getColorByHash = _.memoize(str => {
  const hash = typeof str === 'string' ? str.split('').reduce((r, i) => i.charCodeAt(0) + r, 0) : 0
  return COLORS[hash % COLORS.length]
})

export const timeout = (promise, ms) => Promise.race([
  promise, new Promise((resolve, reject) => setTimeout(() => {
    reject(new Error('promise timeout'))
  }, ms))
])

export const compareVersion = (a, b) => {
  if (a === b) return 0
  const [ap, bp] = [a, b].map(i => i || '0').map(i => i.split('.').map(j => +j))
  const len = Math.min(ap.length, bp.length)
  for (let i = 0; i < len; i += 1) {
    if (ap[i] !== bp[i]) return ap[i] - bp[i]
  }
  return ap.length - bp.length
}

export const sendMessage = async msg => {
  try {
    await browser.runtime.sendMessage(msg)
  } catch (err) {
    if (err.message === 'Could not establish connection. Receiving end does not exist.') {
      return console.warn('error ignored', err.message)
    }
    throw err
  }
}

export const throttle = (fn, ms) => {
  let executing
  let next
  let nextArgs
  let timeout
  let lastTime
  return async function throttled(...args) {
    const now = Date.now()
    if (now - lastTime < ms) {
      next = true
      nextArgs = args
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        throttled(...args)
      })
      return
    }

    if (executing) {
      next = true
      nextArgs = args
      return
    }

    executing = true
    lastTime = now

    let re
    try {
      re = await fn.apply(this, args) // eslint-disable-line no-invalid-this
    } catch (error) {
      throw error
    } finally {
      executing = false
      if (next) {
        if (Date.now() - now > ms) {
          next = false
          if (timeout) clearTimeout(timeout)
          throttled(...nextArgs)
        }
      }
    }
    return re
  }
}

export class Mutex {
  constructor() {
    this._locking = Promise.resolve()
    this._locks = 0
  }

  isLocked() {
    return this._locks > 0
  }

  lock() {
    this._locks += 1
    let unlockNext
    const willLock = new Promise(resolve => {
      unlockNext = () => {
        this._locks -= 1
        resolve()
      }
    })
    const willUnlock = this._locking.then(() => unlockNext)
    this._locking = this._locking.then(() => willLock)
    return willUnlock
  }
}
