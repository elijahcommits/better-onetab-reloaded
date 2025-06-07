import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'
import {SENTRY_DSN} from './constants'
import {isBackground} from './utils'
import manifest from '../manifest.json'

const logger = {}

// genMethods is now called after Sentry.init (if not DEBUG)
const genMethods = () => {
  for (const method in console) {
    if (typeof console[method] !== 'function') continue
    logger[method] = (...args) => {
      console[method](...args)
      // Only send data to Sentry if not in DEBUG mode
      if (!DEBUG) {
        args.forEach(arg => {
          if (arg instanceof Error) Sentry.captureException(arg)
          else Sentry.addBreadcrumb({data: arg, level: method})
        })
      }
    }
  }
}

logger.init = (opts = {}) => {
  // Always set up the logging methods
  genMethods()

  // Initialize Sentry only if not in DEBUG mode
  if (!DEBUG) {
    const {Vue} = opts
    const integrations = Sentry.defaultIntegrations
    if (Vue) integrations.push(new Integrations.Vue({Vue}))
    Sentry.init({
      environment: 'production', // Explicitly production if not DEBUG
      release: 'v' + manifest.version,
      dsn: SENTRY_DSN,
      debug: false, // Debug should be false in production
      integrations,
    })

    Sentry.configureScope(async scope => {
      scope.setTag('background', await isBackground())
    })
  }
}

export default logger
