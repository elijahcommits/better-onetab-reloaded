<template>
  <div>
    <v-layout>
      <v-flex
        xs12
        sm8
        offset-sm2
      >
        <v-card>
          <v-card-text>
            <div
              v-for="(optionsList, cate) in optionsLists"
              :key="cate"
            >
              <v-subheader>{{ __('ui_options_' + cate) }}</v-subheader>
              <v-list>
                <template v-for="(option, optionIndex) in optionsList">
                  <v-list-tile :key="option.name">
                    <v-list-tile-content>
                      <v-layout
                        wrap
                        row
                        align-center
                        style="width:100%"
                      >
                        <v-flex xs8>
                          <v-subheader>
                            <div>{{ __('opt_name_' + option.name) }}</div>
                            <v-tooltip
                              v-if="isNew(option)"
                              top
                            >
                              <v-chip
                                slot="activator"
                                outline
                                color="red"
                                small
                              >
                                NEW
                              </v-chip>
                              <span>{{ __('ui_new_warn') }}</span>
                            </v-tooltip>

                            <v-tooltip
                              v-if="option.desc"
                              top
                            >
                              <v-icon slot="activator">
                                help_outline
                              </v-icon>
                              <p class="tooltip">
                                {{ __('opt_desc_' + option.name) }}
                              </p>
                            </v-tooltip>
                          </v-subheader>
                        </v-flex>
                        <v-flex
                          xs4
                          class="text-xs-right"
                          align-center
                        >
                          <v-select
                            v-if="option.type === String"
                            dense
                            class="select-amend"
                            :items="option.items"
                            :value="opts[option.name]"
                            label=""
                            item-text="label"
                            item-value="value"
                            :disabled="option.deps && !option.deps(opts)"
                            @change="optionsChanged(option.name, $event)"
                          />
                          <v-switch
                            v-if="option.type === Boolean"
                            v-model="opts[option.name]"
                            class="d-inline-flex"
                            color="primary"
                            :disabled="option.deps && !option.deps(opts)"
                            @change="optionsChanged(option.name, $event)"
                          />
                        </v-flex>
                      </v-layout>
                    </v-list-tile-content>
                  </v-list-tile>
                  <v-divider
                    v-if="optionIndex !== optionsList.length - 1"
                    :key="option.name + '-divider'"
                  />
                </template>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
    <v-snackbar
      v-model="snackbar"
      :timeout="2000"
      bottom
    >
      {{ __('ui_opt_changes_saved') }}
    </v-snackbar>
  </div>
</template>
<script>
import storage from '@/common/storage'
import options from '@/common/options'
import __ from '@/common/i18n'
import _ from 'lodash'
import browser from 'webextension-polyfill'
import {formatTime, sendMessage} from '@/common/utils'
import {mapState, mapMutations} from 'vuex'

const currentVersion = browser.runtime.getManifest().version

export default {
  data() {
    return {
      optionsLists: _.groupBy(options.getOptionsList(), 'cate'),
      snackbar: false,
    }
  },
  computed: {
    ...mapState(['opts']),
  },
  created() {
    this.init()
  },
  methods: {
    __,
    formatTime,
    ...mapMutations(['setOption']),
    isNew(option) {
      return option.new && currentVersion.startsWith(option.new)
    },
    emitChanges: _.debounce(async function emitChanges(key, value) {
      console.log(1)
      console.log(key, value)
      // when type of option is string options can not be set correctly after first storage.setOptions() called
      const opts = _.clone(this.opts) // eslint-disable-line no-invalid-this
      await storage.setOptions(opts)
      await storage.setOptions(opts)
      console.log(2)
      await sendMessage({optionsChanged: {[key]: value}})
    }, 100),
    optionsChanged(key, value) {
      this.setOption({[key]: value})
      this.emitChanges(key, value)
    },
    init() {
      chrome.runtime.onMessage.addListener(msg => {
        if (msg.optionsChangeHandledStatus === 'success') {
          this.snackbar = true
        }
      })
    }
  }
}
</script>
<style lang="scss">
.select-amend {
  padding: 4px 0 0;
}
.tooltip {
  max-width: 240px;
}
</style>
