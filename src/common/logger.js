import { isBackground } from './utils';
import manifest from '../manifest.json';

const logger = {};

// Create basic console methods immediately
for (const method in console) {
  if (typeof console[method] === 'function') {
    logger[method] = (...args) => {
      console[method](...args);
    };
  }
}

logger.init = async (opts = {}) => {
  const inBackground = await isBackground();

  // In debug mode or background, the logger just prints to console.
  if (DEBUG || inBackground) {
    return;
  }

  // Dynamically import Sentry only for the frontend (non-background) context
  try {
    const Sentry = await import('@sentry/browser');
    const Integrations = await import('@sentry/integrations');
    const { SENTRY_DSN } = await import('./constants');

    const { Vue } = opts;
    const integrations = [...Sentry.defaultIntegrations];
    if (Vue) {
      integrations.push(new Integrations.Vue({ Vue }));
    }

    Sentry.init({
      environment: 'production',
      release: 'v' + manifest.version,
      dsn: SENTRY_DSN,
      debug: false,
      integrations,
    });

    Sentry.configureScope(scope => {
      scope.setTag('background', false);
    });

    // Redefine logger methods to include Sentry breadcrumbs
    for (const method in console) {
      if (typeof console[method] === 'function') {
        logger[method] = (...args) => {
          console[method](...args);
          args.forEach(arg => {
            if (arg instanceof Error) {
              Sentry.captureException(arg);
            } else {
              Sentry.addBreadcrumb({ data: arg, level: method });
            }
          });
        };
      }
    }
  } catch (e) {
    console.error("Failed to initialize Sentry:", e);
  }
};

export default logger
