import 'regenerator-runtime/runtime'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import logger from '../common/logger'
import Vuetify from 'vuetify/lib'
import VueClipboard from 'vue-clipboard2'
import colors from 'vuetify/es5/util/colors'
import 'vuetify/src/stylus/app.styl'

logger.init({Vue})

Vue.config.productionTip = false
Vue.config.devtools = true
Vue.use(VueClipboard)
Vue.use(Vuetify, {
  theme: {
    primary: colors.lightBlue,
  },
})

// Wait for the DOM to be fully loaded before initializing Vue
document.addEventListener('DOMContentLoaded', () => {
  // Check for popup context and add the class to the body
  if (new URLSearchParams(window.location.search).get('context') === 'popup') {
    document.body.classList.add('is-popup')
  }

  const app = new Vue({
    el: '#app',
    router,
    store,
    created() {
      // Dispatch our single, reliable initialization action.
      this.$store.dispatch('initializeState')
    },
    render: h => h(App)
  })

  if (DEBUG) {
    window.app = app
    import('webextension-polyfill').then(browser => {
      window.browser = browser.default
    })
    import('@/common/service/gdrive').then(gt => {
      window.gt = gt
      window.gdrive = gt.default
    })
  }
})
