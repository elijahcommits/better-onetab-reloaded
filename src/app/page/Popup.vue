<template>
  <v-app :style="{width: '360px'}" :dark="nightmode">
    <v-list dense v-if="lists.length > 0">
      <template v-for="(list, index) in lists">
        <v-list-tile
          :key="list._id"
          ripple
          @click="clicked(index)"
          :color="list.color"
          class="list-item"
        >
          <v-list-tile-content>
            <v-list-tile-title><strong>[{{ list.tabs.length }}]</strong> {{ friendlyTitle(list) }}</v-list-tile-title>
            <v-list-tile-sub-title>{{ formatTime(list.time) }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <div class="text-xs-right">
              <v-btn small class="list-item-btn-hover" flat icon title="store select tab into this list" @click.stop="storeInto(index)">
                <v-icon :style="{fontSize: '14px'}">add</v-icon>
              </v-btn>
              <v-icon v-show="list.pinned" class="list-item-icon" color="blue" :style="{fontSize: '14px'}">fas fa-thumbtack</v-icon>
            </div>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider :key="list._id + '-divider'" v-if="index + 1 < lists.length"></v-divider>
      </template>
    </v-list>

    <v-layout
      :style="{minHeight: '100px'}"
      v-if="!processed" align-center justify-center column fill-height>
      <v-progress-circular
        indeterminate
        color="primary"
      ></v-progress-circular>
    </v-layout>

    <v-layout
      :style="{minHeight: '100px'}"
      v-if="processed && lists.length === 0" align-center justify-center column fill-height
    >
      <h3 class="display-2 grey--text" v-text="__('ui_no_list')"></h3>
    </v-layout>
  </v-app>
</template>
<script>
import __ from '@/common/i18n'
import storage from '@/common/storage'
import {formatTime, sendMessage} from '@/common/utils'
import browser from 'webextension-polyfill'
import { normalizeList } from '@/common/list'

/**
 * @typedef {object} List - Defines the structure for a list object.
 * @property {string} _id - The unique identifier for the list.
 * @property {object[]} tabs - The array of tabs in the list.
 * @property {string} [title] - The optional title for the list.
 * @property {boolean} [pinned] - Whether the list is pinned.
 * @property {any[]} [tags] - Optional tags for the list.
 * @property {number} [time] - Timestamp of creation.
 * @property {string} [color] - The color for the list item.
 */

export default {
  data() {
    return {
      /** @type {List[]} */
      lists: [],
      action: '',
      nightmode: false,
      processed: false,
    }
  },
  created() {
    this.init()
  },
  methods: {
    __,
    formatTime,
    friendlyTitle(list) {
      if (list.title) return list.title
      const maxLen = 60
      const titles = list.tabs.map(i => i.title)
      let title = ''
      while (title.length < maxLen && titles.length !== 0) {
        title += titles.shift() + ', '
      }
      title = ': ' + title.slice(0, -2).substr(0, maxLen - 3) + '...'
      return title
    },
    async init() {
      try {
        // Run all our startup tasks in parallel
        const [nightmodeResponse, lists, opts] = await Promise.all([
          browser.runtime.sendMessage({
            type: 'getGlobalState',
            key: 'nightmode'
          }),
          storage.getLists(),
          storage.getOptions(),
        ])

        this.nightmode = (nightmodeResponse && nightmodeResponse.nightmode) || false
        this.action = (opts && opts.popupItemClickAction) || 'restore'
        this.lists = lists.map(normalizeList)

      } catch (error) {
        // If anything goes wrong, log the error to the console.
        console.error('Failed to initialize the popup:', error)
        // The list will be empty, and the "No list" message will be shown.
      } finally {
        // This is crucial: always set processed to true, even if there was an error,
        // to ensure the loading spinner doesn't get stuck.
        this.processed = true
      }
    },
    clicked(index) {
      if (!['restore', 'restore-new-window'].includes(this.action)) return

      sendMessage({restoreList: {
        index,
        newWindow: this.action === 'restore-new-window',
      }})
    },
    storeInto(index) {
      sendMessage({storeInto: {index}})
    },
  }
}
</script>
<style lang="scss" scoped>
.list-item-btn-hover {
  display: none;
}
.list-item {
  &:hover {
    .list-item-btn-hover {
      display: inline-block;
    }
    .list-item-icon {
      display: none;
    }
  }
}
</style>
