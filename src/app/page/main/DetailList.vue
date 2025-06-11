<template>
  <v-layout column>
    <div
      v-if="pageLength > 1"
      class="text-xs-center"
    >
      <v-pagination
        :value="currentPage"
        :length="pageLength"
        circle
        @input="changePage"
      />
    </div>

    <v-expansion-panel
      ref="panel"
      expand
      popout
      :readonly="opts.disableExpansion"
      :value="expandStatus"
      class="my-3"
      @input="expandStatusChanged"
    >
      <v-expansion-panel-content
        v-for="list in listsInView"
        :key="list.index"
        ref="list"
        hide-actions
        class="tab-list"
      >
        <v-layout
          slot="header"
          row
          spacer
        >
          <v-flex
            no-wrap
            xs10
          >
            <v-menu
              open-on-hover
              top
              offset-y
            >
              <v-chip
                slot="activator"
                label
                small
                :color="list.color"
                class="lighten-3"
              >
                {{ list.tabs.length }} {{ __('ui_tab') }}
              </v-chip>
              <v-card>
                <v-layout
                  wrap
                  class="color-panel"
                >
                  <v-flex
                    v-for="(color, colorIndex) in colorList"
                    :key="colorIndex"
                    wrap
                    xs3
                  >
                    <div
                      class="color-selector lighten-3"
                      :class="color"
                      @click.stop="changeColor([list.index, color])"
                    />
                  </v-flex>
                </v-layout>
              </v-card>
            </v-menu>
            <strong class="grey--text date">{{ __('ui_created') }} <dynamic-time :value="list.time" /></strong>
            <v-chip
              v-for="tagName in list.tags"
              :key="tagName"
              :color="getColorByHash(tagName)"
              class="lighten-3"
              label
              small
            >
              {{ tagName }}
            </v-chip>
            <v-text-field
              v-if="list.titleEditing"
              class="title-editor"
              autofocus
              full-width
              :value="list.title"
              single-line
              hide-details
              :class="'font-size-' + opts.titleFontSize"
              @keydown.enter="saveTitle(list.index)"
              @blur="saveTitle(list.index)"
              @click.prevent.stop
              @input="setTitle([list.index, $event])"
            />
            <div
              v-else
              class="list-title"
              :class="[
                'font-size-' + opts.titleFontSize,
                list.color ? list.color + '--text' : '',
              ]"
            >
              {{ list.title }}
            </div>
          </v-flex>
          <v-flex
            xs2
            class="text-xs-right"
          >
            <v-btn
              v-if="$route.name === 'detailList'"
              :title="__('ui_title_down_btn')"
              flat
              icon
              class="icon-in-title"
              :disabled="list.index === lists.length - 1"
              @click.stop="moveListDown(list.index)"
            >
              <v-icon
                color="gray"
                :style="{fontSize: '14px'}"
              >
                fas fa-arrow-down
              </v-icon>
            </v-btn>
            <v-btn
              v-if="$route.name === 'detailList'"
              :title="__('ui_title_up_btn')"
              flat
              icon
              class="icon-in-title"
              :disabled="list.index === 0"
              @click.stop="moveListUp(list.index)"
            >
              <v-icon
                color="gray"
                :style="{fontSize: '14px'}"
              >
                fas fa-arrow-up
              </v-icon>
            </v-btn>
            <v-btn
              :title="__('ui_title_pin_btn')"
              flat
              icon
              class="icon-in-title"
              @click.stop="pinList([list.index, !list.pinned])"
            >
              <v-icon
                :color="list.pinned ? 'blue' : 'gray'"
                :style="{fontSize: '14px'}"
              >
                fas fa-thumbtack
              </v-icon>
            </v-btn>
          </v-flex>
        </v-layout>
        <v-card>
          <v-layout>
            <v-flex class="checkbox-column">
              <v-checkbox
                hide-details
                class="checkbox"
                :value="list.tabs.some(tab => tab.selected)"
                :indeterminate="list.tabs.some(tab => tab.selected) && list.tabs.some(tab => !tab.selected)"
                @click.self.stop="selectAllBtnClicked(list.index)"
              />
            </v-flex>
            <v-flex class="text-xs-right">
              <v-btn
                :ref="'multi-op-' + list.index"
                flat
                small
                icon
                :disabled="list.tabs.every(tab => !tab.selected)"
                @click="multiOpBtnClicked(list.index, $event)"
              >
                <v-icon>more_vert</v-icon>
              </v-btn>
              <v-btn
                flat
                small
                @click="openChangeTitle(list.index)"
              >
                {{ __('ui_retitle_list') }}
              </v-btn>
              <v-btn
                flat
                small
                @click="restoreList([list.index])"
              >
                {{ __('ui_restore_all') }}
              </v-btn>
              <v-btn
                flat
                small
                @click="restoreList([list.index, true])"
              >
                {{ __('ui_restore_all_in_new_window') }}
              </v-btn>
              <v-btn
                flat
                small
                @click="pinList([list.index, !list.pinned])"
              >
                {{ list.pinned ? __('ui_unpin') : __('ui_pin') }} {{ __('ui_list') }}
              </v-btn>
              <v-btn
                :ref="'edit-tag-' + list.index"
                flat
                small
                @click="editTag(list.index, $event)"
              >
                EDIT TAG
              </v-btn>
              <v-btn
                flat
                small
                color="error"
                :disabled="list.pinned"
                @click="removeList(list.index)"
              >
                {{ __('ui_remove_list') }}
              </v-btn>
            </v-flex>
          </v-layout>
          <v-divider />
          <v-list
            dense
            class="my-1"
          >
            <draggable
              :value="list.tabs"
              v-bind="draggableOptions"
              @input="setTabs([list.index, $event])"
              @change="tabMoved([list.index])"
            >
              <v-list-tile
                v-for="(tab, tabIndex) in visibleTabs(list)"
                :ref="'list-' + list.index + '-tab'"
                :key="tabIndex"
                :href="opts.itemClickAction !== 'none' ? tab.url : null"
                :target="opts.itemClickAction !== 'none' ? '_blank' : null"
                class="list-item"
                @click.stop="itemClicked([list.index, tabIndex])"
                @contextmenu="rightClicked(list.index, tabIndex, $event)"
              >
                <div
                  class="drag-indicator"
                  @click.stop.prevent
                >
                  <i />
                </div>
                <v-list-tile-action>
                  <v-checkbox
                    hide-details
                    class="checkbox"
                    :value="tab.selected"
                    @click.prevent.stop.self="tabSelected([list.index, tabIndex, !tab.selected])"
                  />
                </v-list-tile-action>
                <v-list-tile-content>
                  <v-list-tile-title>
                    <v-avatar
                      v-if="!opts.hideFavicon"
                      tile
                      size="16"
                      color="grey lighten-4"
                    >
                      <img :src="tab.favIconUrl ? tab.favIconUrl : `https://www.google.com/s2/favicons?domain=${getDomain(tab.url)}`">
                    </v-avatar>
                    {{ opts.itemDisplay === 'url' ? tab.url : tab.title }}
                  </v-list-tile-title>
                  <v-list-tile-sub-title v-if="opts.itemDisplay === 'title-and-url'">
                    {{ tab.url }}
                  </v-list-tile-sub-title>
                </v-list-tile-content>
              </v-list-tile>
              <v-layout v-if="list.tabs.length > 10 && !list.showAll">
                <v-flex class="text-xs-center">
                  <v-btn
                    small
                    flat
                    @click="showAll(list.index)"
                  >
                    <v-icon>more_horiz</v-icon>
                  </v-btn>
                </v-flex>
              </v-layout>
            </draggable>
          </v-list>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <div
      v-if="pageLength > 1"
      class="text-xs-center"
    >
      <v-pagination
        :value="currentPage"
        :length="pageLength"
        circle
        @input="changePage"
      />
    </div>

    <v-layout
      v-if="processed && listsToDisplay.length === 0"
      align-center
      justify-center
      column
      fill-height
      class="no-list-tip"
    >
      <h3
        class="display-3 grey--text"
        v-text="__('ui_no_list')"
      />
      <p
        class="display-2 grey--text text--lighten-1"
        v-html="__('ui_no_list_tip')"
      />
    </v-layout>

    <context-menu
      ref="contextMenu"
      v-model="showMenu"
      @click="contextMenuClicked"
    />

    <v-fab-transition>
      <v-btn
        v-if="scrollY > 100"
        :key="1"
        color="pink"
        dark
        fab
        fixed
        bottom
        right
        @click="$vuetify.goTo(0)"
      >
        <v-icon>keyboard_arrow_up</v-icon>
      </v-btn>
      <v-btn
        v-else
        :key="2"
        color="green"
        dark
        fab
        fixed
        bottom
        right
        title="fold all lists"
        @click="foldAll"
      >
        <v-icon>subject</v-icon>
      </v-btn>
    </v-fab-transition>

    <v-menu
      v-model="tag.editing"
      :close-on-content-click="false"
      :position-x="tag.x"
      :position-y="tag.y"
      absolute
      offset-y
    >
      <v-combobox
        v-model="tag.value"
        autofocus
        :hide-no-data="!tag.input"
        :items="Object.keys(taggedList)"
        :search-input.sync="tag.input"
        label="Search an existing tag"
        multiple
        small-chips
        solo
        hide-details
        dense
        @input="tagChanged"
      >
        <template slot="no-data">
          <v-list-tile>
            <span class="subheading">Create</span>
            <v-chip
              label
              small
            >
              {{ tag.input }}
            </v-chip>
          </v-list-tile>
        </template>

        <template
          slot="selection"
          slot-scope="{ item, parent, selected }"
        >
          <v-chip
            :selected="selected"
            :color="getColorByHash(item)"
            class="lighten-3"
            label
            small
          >
            <span class="pr-2">{{ item }}</span>
            <v-icon
              small
              @click="parent.selectItem(item)"
            >
              close
            </v-icon>
          </v-chip>
        </template>
      </v-combobox>
    </v-menu>
  </v-layout>
</template>

<script>
import draggable from 'vuedraggable'
import __ from '@/common/i18n'
import tabs from '@/common/tabs'
import {createNewTabList} from '@/common/list'
import {formatTime, getColorByHash} from '@/common/utils'
import dynamicTime from '@/app/component/DynamicTime'
import contextMenu from '@/app/component/main/detailList/ContextMenu'
import {COLORS} from '@/common/constants'
import {mapState, mapActions, mapMutations, mapGetters} from 'vuex'

export default {
  components: {
    draggable,
    dynamicTime,
    contextMenu,
  },
  data() {
    return {
      colorList: COLORS,
      processed: false,
      choice: null,
      showMenu: false,
      rightClickedListIndex: null,
      currentHighlightItem: null,
      draggableOptions: {
        group: {
          name: 'g',
          put: true,
          pull: true,
        },
        animation: 150,
        handle: '.drag-indicator',
      },
      expandStatus: [],
      tag: {
        editing: false,
        listIndex: null,
        x: NaN, y: NaN,
        value: [],
        input: '',
      },
    }
  },
  computed: {
    ...mapState(['opts', 'lists', 'scrollY']),
    ...mapGetters(['inPageLists', 'getPageLength', 'taggedList', 'indexedLists', 'pinnedList']),
    visibleTabs() {
      return (list) => {
        if (list.showAll || list.tabs.length <= 10) {
          return list.tabs;
        }
        return list.tabs.slice(0, 10);
      }
    },
    currentPage() {
      return +this.$route.query.p || 1
    },
    tagInView() {
      return this.$route.params.tag
    },
    listsToDisplay() {
      return this.$route.name === 'pinnedList' ? this.pinnedList
        : this.tagInView ? this.taggedList[this.tagInView] || []
        : this.indexedLists
    },
    listsInView() {
      return this.inPageLists(this.currentPage, this.listsToDisplay)
    },
    pageLength() {
      return this.getPageLength(this.listsToDisplay.length)
    },
  },
  watch: {
    listsToDisplay: 'updateExpandStatus',
  },
  created() {
    this.init()
  },
  updated() {
    const contentElement = this.$el.closest('.v-content')
    if (contentElement && contentElement.style.paddingTop !== '0px') {
      contentElement.style.paddingTop = '0px'
    }
  },
  activated() {
    if (this.$route.query.listIndex != null) this.jumpTo(this.$route.query)
  },
  methods: {
    log: console.log,
    __,
    formatTime,
    getColorByHash,
    ...mapMutations([
      'openChangeTitle', 'showAll', 'tabSelected', 'addTab',
      'removeTabDirectly', 'setTitle', 'addList', 'setTabs',
    ]),
    ...mapActions([
      'showSnackbar', 'itemClicked', 'getLists', 'removeList',
      'removeTab', 'restoreList', 'saveTitle', 'pinList',
      'moveListUp', 'moveListDown', 'expandList', 'changeColor',
      'tabMoved', 'setTags',
    ]),
    init() {
      if (DEBUG) window.dl = this
      this.getLists().then(() => {
        this.updateExpandStatus()
        if (!this.processed) {
          this.processed = true
          if (this.$route.query.listIndex != null) this.jumpTo(this.$route.query)
        }
      })
      document.addEventListener('click', () => {
        if (!this.currentHighlightItem) return
        this.currentHighlightItem.$el.classList.remove('elevation-20')
      })
      document.addEventListener('keydown', event => {
        if (event.keyCode === 27) this.showMenu = false
      })
    },
    getExpandStatus() {
      return this.listsInView.map(i => i.expand !== false)
    },
    expandStatusChanged(newStatus) {
      const indexInPage = this.expandStatus.findIndex((s, i) => s !== newStatus[i])
      if (!~indexInPage) return
      const index = indexInPage + (this.currentPage - 1) * this.opts.listsPerPage
      const expand = newStatus[indexInPage]
      this.expandList([expand, index])
    },
    async updateExpandStatus() {
      await this.$nextTick()
      if (this.opts.disableExpansion) {
        this.expandStatus = this.listsToDisplay.map(() => true)
      } else {
        this.expandStatus = this.getExpandStatus()
      }
    },
    getDomain(url) {
      try {
        return new URL(url).hostname
      } catch (error) {
        return ''
      }
    },
    async contextMenuClicked(func, ...args) {
      await this[func](...args)
      this.showMenu = false
    },
    rightClicked(listIndex, tabIndex, $event) {
      $event.preventDefault()
      this.showMenu = false
      this.rightClickedListIndex = listIndex
      if (!this.lists[listIndex].tabs[tabIndex].selected) {
        for (let i = 0; i < this.lists[listIndex].tabs.length; i += 1) {
          this.tabSelected([listIndex, i, i === tabIndex])
        }
      }
      this.$refs.contextMenu.x = $event.clientX
      this.$refs.contextMenu.y = $event.clientY
      this.$nextTick(() => {
        this.showMenu = true
      })
    },
    getSelectedItems() {
      const list = this.lists[this.rightClickedListIndex]
      const selectedItems = []
      list.tabs.forEach((tab, tabIndex) => {
        if (tab.selected) {
          selectedItems.push({
            listIndex: this.rightClickedListIndex,
            tabIndex,
          })
        }
      })
      return selectedItems
    },
    moveSelectedItemsTo(targetListIndex) {
      const items = this.getSelectedItems()
      if (!(items && items.length)) return
      const changedLists = [targetListIndex]
      const tabs = items.map(({listIndex, tabIndex}) => {
        changedLists.push(listIndex)
        return this.lists[listIndex].tabs[tabIndex]
      })
      items.sort((a, b) => b.tabIndex - a.tabIndex)
        .forEach(({listIndex, tabIndex}) => this.removeTabDirectly([listIndex, tabIndex]))
      if (targetListIndex === -1) {
        const newList = createNewTabList({tabs})
        this.addList([newList])
        this.tabMoved(changedLists.map(i => i + 1))
      } else {
        tabs.forEach(tab => this.addTab([targetListIndex, tab]))
        this.tabMoved(changedLists)
      }
    },
    openSelectedItems() {
      const items = this.getSelectedItems()
      if (!(items && items.length)) return
      const toRestoredTabs = items.map(({listIndex, tabIndex}) => this.lists[listIndex].tabs[tabIndex])
      return tabs.restoreTabs(toRestoredTabs)
    },
    duplicateSelectedItems() {
      const items = this.getSelectedItems()
      if (!(items && items.length)) return
      const changedLists = []
      items.forEach(({listIndex, tabIndex}) => {
        changedLists.push(listIndex)
        this.addTab([listIndex, this.lists[listIndex].tabs[tabIndex]])
      })
      this.tabMoved(changedLists)
    },
    async copyLinksOfSelectedItems() {
      const items = this.getSelectedItems()
      if (!(items && items.length)) return
      const text = items.map(({listIndex, tabIndex}) => {
        const tab = this.lists[listIndex].tabs[tabIndex]
        return tab.url
      }).join('\n')
      if (await this.$copyText(text)) this.showSnackbar(__('ui_copied'))
    },
    async copyTitleOfSelectedItems() {
      const items = this.getSelectedItems()
      if (!(items && items.length)) return
      const text = items.map(({listIndex, tabIndex}) => {
        const tab = this.lists[listIndex].tabs[tabIndex]
        return tab.title
      }).join('\n')
      if (await this.$copyText(text)) this.showSnackbar(__('ui_copied'))
    },
    removeSelectedItems() {
      const items = this.getSelectedItems()
      if (!(items && items.length)) return
      const changedLists = []
      items.sort((a, b) => b.tabIndex - a.tabIndex)
        .forEach(({listIndex, tabIndex}) => {
          changedLists.push(listIndex)
          this.removeTabDirectly([listIndex, tabIndex])
        })
      this.tabMoved(changedLists)
    },
    changePage(page) {
      const {path} = this.$route
      this.$router.push({path, query: {p: page}})
    },
    selectAllBtnClicked(listIndex) {
      const list = this.lists[listIndex]
      const targetStatus = list.tabs.every(tab => !tab.selected)
      for (let i = 0; i < list.tabs.length; i += 1) {
        this.tabSelected([listIndex, i, targetStatus])
      }
    },
    multiOpBtnClicked(listIndex, $event) {
      this.showMenu = false
      this.$refs.contextMenu.x = $event.x
      this.$refs.contextMenu.y = $event.y
      this.multiOpBtnClickedListIndex = listIndex
      this.$nextTick(() => {
        this.showMenu = true
      })
    },
    async jumpTo(item) {
      const page = (item.listIndex / this.opts.listsPerPage << 0) + 1
      this.$router.replace({name: 'detailList', query: {p: page}})
      await this.$nextTick()
      const opt = {
        duration: 500,
        offset: 100,
        easing: 'easeInOutCubic',
      }
      if (item.tabIndex == null) {
        this.currentHighlightItem = this.$refs.list[item.listIndex]
      } else {
        this.expandList([true, item.listIndex])
        this.currentHighlightItem = this.$refs[`list-${item.listIndex}-tab`][item.tabIndex]
      }
      await this.$nextTick()
      setTimeout(() => {
        this.$vuetify.goTo(this.currentHighlightItem, opt)
        this.currentHighlightItem.$el.classList.add('elevation-20')
      }, 0)
    },
    async foldAll() {
      this.listsInView.forEach(list => {
        this.expandList([false, list.index])
      })
      await this.$nextTick()
      return this.updateExpandStatus()
    },
    editTag(listIndex, $event) {
      this.tag.listIndex = listIndex
      this.tag.value = this.lists[listIndex].tags || []
      this.tag.x = $event.x
      this.tag.y = $event.y
      this.tag.editing = true
    },
    tagChanged(tags) {
      this.setTags([this.tag.listIndex, tags])
    },
  },
}
</script>
<style lang="scss" scoped>
.color-panel {
  width: 136px;
  height: 110px;
  padding: 5px;
  .color-selector {
    display: inline-block;
    width: 26px;
    height: 26px;
    border-radius: 13px;
    border: 2px solid white !important;
    &:hover {
      border: 2px solid gray !important;
    }
  }
}
.date {
  font-size: 100%;
}
.title-editor {
  padding: 0;
  position: absolute;
  display: inline-flex;
  width: 80%;
  ::v-deep .v-input__slot {
    min-height: 32px !important;
  }
  ::v-deep input {
    margin-top: 0 !important;
  }
}
.list-title {
  position: absolute;
  display: inline-block;
  line-height: 34px;
  padding: 0 12px;
}
.font-size-12px {
  font-size: 12px;
}
.font-size-18px {
  font-size: 18px;
}
.font-size-24px {
  font-size: 24px;
}

.tab-list {
  .icon-in-title {
    margin: 0 0 0 auto;
    width: 30px;
    height: 30px;
  }
  .icon-in-title {
    .gray--text {
      display: none;
    }
  }
  &:hover {
    .icon-in-title {
      .gray--text {
        display: flex;
      }
    }
  }
  .checkbox-column {
    max-width: 40px;
    margin-left: 16px;
    .checkbox {
      margin-left: 20px;
      margin-top: 0;
      padding-top: calc((40px - 24px) / 2);
    }
  }
}
.sortable-ghost, .sortable-chosen {
  opacity: .5;
  box-shadow: 0 3px 3px -2px rgba(0,0,0,.2), 0 3px 4px 0 rgba(0,0,0,.14), 0 1px 8px 0 rgba(0,0,0,.12);
  &.list-item {
    .drag-indicator {
      display: flex;
    }
  }
}
.sortable-drag {
  opacity: 0;
}
.list-item {
  padding-bottom: 20px;
  .checkbox {
    margin-left: 20px;
  }
  .clear-btn {
    display: none;
  }
  &:hover {
    .clear-btn {
      display: block;
    }
    .drag-indicator {
      display: flex;
    }
  }
  .drag-indicator {
    position: absolute;
    cursor: move;
    z-index: 1000;
    display: none;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    i {
      display: inline-block;
      width: 16px;
      height: 16px;
      background-repeat: no-repeat;
      background-size: contain;
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABiElEQVR4Ae3ZgYYCYRQF4AVi9QhVMECJuefNtl6h9AS79QhJz1ADQFX7HFtUrMVWdxdYMv+PvVz/cL4DcBCYuZ15ov8iIiIiIqJeA31Z4fSbJQbdpr3vqFPHXO7Qv8gd807d3neR1bCBlmST1ex9BzKBlkcm1r4DyeQW/EE3yQx9H/kIGk4+MvR9YAcNR/aGvg98QSP5NPR94AKN5GLo+5A9NBx5N/R9YAyNZGzo+8jbscciWoZ+Ai+yqb3vckrIvvyRmNXsfadjThaPx5ksOnVD31+3iYEUOOIoRfg8jvT9ERERcRfiLsRdiLsQdyHuQtyFuAtxF+IuxF2IuxAREXEXyl+kwAEHWaHfa1RsF5KZ3B7+ns/wXJldSNalx9m6IrsQXqGBvFVgF0ILV2gg33k7+V1IhtBwZJj+LrSBRrJNfxc6QSM5pb8LnaGRnJPfhbCFRrIz7EKpjbv2Xcj/MXq170LVepFNE/vElNwuZDjOUtuFAudxgQ8csMSg1+AuREREREREXn4A0o+voNRuPgAAAAAASUVORK5CYII=);
    }
  }
}
.no-list-tip {
  user-select: none;
}
</style>