import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'
import browser from 'webextension-polyfill'
import storage from '@/common/storage'
import options from '@/common/options'
import boss from '@/common/service/boss'
import listManager from '@/common/listManager'
import {sleep} from '@/common/utils'

import lists from './lists'

Vue.use(Vuex)
listManager.init()

export default new Vuex.Store({
  strict: DEBUG,
  state: {
    opts: options.getDefaultOptions(),    // all options
    hasToken: false,                      // whether token exists
    drawer: false,                        // drawer status
    nightmode: false,                     // nightmode status
    snackbar: { status: false, msg: '' }, // snackbar status
    scrollY: 0,
    ...lists.state,
  },
  getters: {
    ...lists.getters,
  },
  mutations: {
    setOption(state, payload) {
      if (!payload) return // Prevent crash on undefined payload
      for (const [k, v] of Object.entries(payload)) {
        state.opts[k] = v
      }
    },
    setToken(state, payload) {
      state.hasToken = payload
    },
    setDrawer(state, drawer) {
      state.drawer = drawer
    },
    setNightmode(state, payload) {
      state.nightmode = payload
    },
    setSnackbar(state, message) {
      state.snackbar.msg = message
      state.snackbar.status = true
    },
    closeSnackbar(state) {
      state.snackbar.status = false
    },
    setScrollY(state, v) {
      state.scrollY = v
    },
    ...lists.mutations,
  },
  actions: {
    async loadOptions({commit}) {
      const loadedOptions = await storage.getOptions()
      // FIX: Only update the options if we successfully loaded something from storage.
      if (loadedOptions) {
        commit('setOption', loadedOptions)
      }
    },
    async checkToken({commit}) {
      commit('setToken', await boss.hasToken())
    },
    // Refactored actions to use message passing instead of getBackgroundPage()
    async loadDrawer({commit}) {
      const { drawer } = await browser.runtime.sendMessage({ type: 'getGlobalState', key: 'drawer' })
      commit('setDrawer', _.defaultTo(drawer, true))
    },
    async switchDrawer({commit, state}) {
      const newDrawerState = !state.drawer
      await browser.runtime.sendMessage({ type: 'setGlobalState', key: 'drawer', value: newDrawerState })
      commit('setDrawer', newDrawerState)
    },
    async loadNightmode({commit, state}) {
      const { nightmode } = await browser.runtime.sendMessage({ type: 'getGlobalState', key: 'nightmode' })
      commit('setNightmode', _.defaultTo(nightmode, state.opts.defaultNightMode))
    },
    async switchNightmode({commit, state}) {
      const newNightmodeState = !state.nightmode
      await browser.runtime.sendMessage({ type: 'setGlobalState', key: 'nightmode', value: newNightmodeState })
      commit('setNightmode', newNightmodeState)
    },
    async showSnackbar({commit}, message) {
      commit('setSnackbar', message)
      await sleep(2000)
      commit('closeSnackbar')
    },
    ...lists.actions,
  },
  plugins: [
    listManager.createVuexPlugin(),
  ],
})
