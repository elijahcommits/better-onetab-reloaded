<template>
  <div />
</template>

<script>
/*
import __ from '@/common/i18n'
import {SYNC_SERVICE_URL} from '@/common/constants'
import {formatTime} from '@/common/utils'
import boss from '@/common/service/boss'
import browser from 'webextension-polyfill'
import {mapState, mapActions} from 'vuex'

export default {
  data() {
    return {
      uid: '',
      apiUrl: SYNC_SERVICE_URL,
    }
  },
  created() {
    this.init()
  },
  computed: {
    ...mapState(['hasToken']),
    bossSubtitle() {
      if (this.uid) return __('ui_logged_uid') + ' ' + this.uid
      return __('ui_not_login')
    },
  },
  methods: {
    __,
    formatTime,
    ...mapActions(['checkToken']),
    async loadUID() {
      await this.checkToken()
      if (!this.hasToken) return
      const {uid} = await boss.getInfo()
      this.uid = uid
    },
    init() {
      this.loadUID()
      browser.runtime.onMessage.addListener(({logged}) => {
        this.uid = logged.uid
      })
    },
    async turnOff() {
      this.uid = ''
      await boss.removeToken()
      await this.checkToken()
    }
  }
}
*/
</script>
