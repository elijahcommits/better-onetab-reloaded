<template>
  <v-toolbar
    v-scroll="onScroll"
    app
    clipped-left
    :color="nightmode ? null : 'primary'"
    :flat="flat"
  >
    <v-toolbar-side-icon
      dark
      @click="switchDrawer"
    />
    <v-toolbar-title class="white--text">
      IceTab
    </v-toolbar-title>
    <v-spacer />
    <search-form v-if="!opts.disableSearch" />
    <v-spacer />

    <v-tooltip left>
      <v-btn
        slot="activator"
        icon
        dark
        @click="switchNightmode"
      >
        <v-icon>{{ nightmode ? 'brightness_5' : 'brightness_4' }}</v-icon>
      </v-btn>
      <span>{{ __('ui_nightmode') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>
<script>
import __ from '@/common/i18n'
import searchForm from './SearchForm'
import {mapState, mapActions, mapMutations} from 'vuex'
// import {sendMessage} from '@/common/utils' // Commented out as it was likely used by sync-related methods

export default {
  components: {
    searchForm,
  },
  data() {
    return {
      flat: false,
      // sync-related data properties are commented out below:
      // syncing: false,
      // online: navigator.onLine,
      // uploadSuccess: false,
    }
  },
  computed: {
    ...mapState(['opts', 'hasToken', 'nightmode', 'scrollY']),
    // sync-related computed properties are commented out below:
    // tooltip() {
    //   return !this.online ? __('ui_offline')
    //     : !this.hasToken ? __('ui_not_login')
    //     : this.syncing ? __('ui_syncing')
    //     : __('ui_refresh')
    // },
    // syncIcon() {
    //   return !this.online ? 'cloud_off'
    //     : !this.hasToken ? 'cloud_off'
    //     : this.uploadSuccess ? 'cloud_done'
    //     : 'cloud_upload'
    // },
  },
  created() {
    this.init()
  },
  methods: {
    __,
    ...mapMutations(['setScrollY']),
    ...mapActions(['switchNightmode', 'switchDrawer']),
    init() {
      this.onScroll()
      // sync-related event listeners are commented out below:
      // window.addEventListener('online', () => { this.online = true })
      // window.addEventListener('offline', () => { this.online = false })
      // chrome.runtime.onMessage.addListener(msg => {
      //   if (msg.refreshing) {
      //     this.syncing = true
      //   } else if (msg.refreshed) {
      //     this.syncing = false
      //     this.uploadSuccess = msg.refreshed.success
      //     if (this.uploadSuccess) {
      //       setTimeout(() => { this.uploadSuccess = false }, 3000)
      //     }
      //   }
      // })
    },
    onScroll() {
      this.setScrollY(window.pageYOffset || document.documentElement.scrollTop)
      this.flat = this.scrollY === 0
    },
    // sync-related method is commented out below:
    // syncBtnClicked() {
    //   if (this.uploadSuccess) return
    //   if (!this.hasToken) {
    //     return this.$router.push('/app/options/sync')
    //   }
    //   return sendMessage({refresh: true})
    // },
  }
}
</script>
<style scoped>
.v-toolbar {
  transition-delay: 0;
  transition-duration: .25s;
  transition-property: box-shadow;
  transition-timing-function: ease;
}
.slide-enter-active, .slide-leave-active {
  transition: all ease-out .22s;
}
.fade-enter-to, .fade-leave {
  opacity: 1;
}
.fade-leave-to, .fade-enter {
  opacity: 0;
}
</style>
