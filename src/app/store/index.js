import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'
import storage from '@/common/storage'
import options from '@/common/options' // eslint-disable-line no-unused-vars
// import boss from '@/common/service/boss' // Comment out this import
import listManager from '@/common/listManager'
import {sleep} from '@/common/utils'

import lists from './lists'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: DEBUG,
  state: {
    opts: options.getDefaultOptions(),
    hasToken: false,
    drawer: true,
    nightmode: false,
    snackbar: { status: false, msg: '' },
    scrollY: 0,
    ...lists.state,
  },
  getters: {
    ...lists.getters,
  },
  mutations: {
    setOption(state, payload) {
      if (!payload) return
      for (const [k, v] of Object.entries(payload)) {
        Vue.set(state.opts, k, v)
      }
      if ('defaultNightMode' in payload) {
        state.nightmode = payload.defaultNightMode
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
    async initializeState({ commit, dispatch }) {
      await listManager.init()
      const loadedOptions = await storage.getOptions()
      if (loadedOptions) {
        commit('setOption', loadedOptions)
      }
      // Check for the 'context=popup' query parameter
      const isPopup = new URLSearchParams(window.location.search).get('context') === 'popup'
      if (isPopup) {
        commit('setDrawer', false)
      } else {
        const drawer = await storage.get('drawer')
        commit('setDrawer', _.defaultTo(drawer, true))
      }
      commit('setToken', false)
      await dispatch('preloadLists')
    },
    async setAndSaveOption({ commit, state }, { key, value }) {
      const newOpts = { ...state.opts, [key]: value }
      commit('setOption', newOpts)
      await storage.setOptions(newOpts)
    },
    async switchDrawer({commit, state}) {
      const newDrawerState = !state.drawer
      commit('setDrawer', newDrawerState)
      await storage.set({ drawer: newDrawerState })
    },
    async switchNightmode({ dispatch, state }) {
      const newNightmodeState = !state.nightmode
      await dispatch('setAndSaveOption', { key: 'defaultNightMode', value: newNightmodeState })
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
