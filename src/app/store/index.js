import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'
import storage from '@/common/storage'
import options from '@/common/options'
import listManager from '@/common/listManager'
import {sleep} from '@/common/utils'

import lists from './lists'

Vue.use(Vuex)

// Determine the initial drawer state synchronously.
// This will be 'false' if it's a popup, and 'true' otherwise.
const isPopup = new URLSearchParams(window.location.search).get('context') === 'popup'
const initialDrawerState = !isPopup;

export default new Vuex.Store({
  strict: DEBUG,
  state: {
    opts: options.getDefaultOptions(),
    hasToken: false,
    drawer: initialDrawerState, // Use the synchronously-determined state
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
    async initializeState({ commit, dispatch, state }) {
      await listManager.init()
      const loadedOptions = await storage.getOptions()
      if (loadedOptions) {
        commit('setOption', loadedOptions)
      }
      
      // If not in a popup, load the saved drawer state from storage.
      if (!isPopup) {
        const drawer = await storage.get('drawer')
        const storedDrawerState = _.defaultTo(drawer, true);
        if (state.drawer !== storedDrawerState) {
            commit('setDrawer', storedDrawerState)
        }
      }

      commit('setToken', false)
      await dispatch('preloadLists')
    },
    async setAndSaveOption({ commit, state }, { key, value }) {
      const newOpts = { ...state.opts, [key]: value }
      commit('setOption', newOpts)
      await storage.setOptions(newOpts)
    },
    async switchDrawer({ commit, state }, newState) {
      const finalState = typeof newState === 'boolean' ? newState : !state.drawer;
      commit('setDrawer', finalState);

      // Only save the drawer's state to storage if we are NOT in a popup.
      // This prevents the popup's drawer state from affecting the main options page.
      if (!isPopup) {
        await storage.set({ drawer: finalState });
      }
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
