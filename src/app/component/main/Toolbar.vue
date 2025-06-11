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
      @click="toggleDrawer"
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

export default {
  components: {
    searchForm,
  },
  data() {
    return {
      flat: false,
    }
  },
  computed: {
    ...mapState(['opts', 'hasToken', 'nightmode', 'scrollY']),
  },
  created() {
    this.init()
  },
  methods: {
    __,
    ...mapMutations(['setScrollY', 'setDrawer']),
    ...mapActions(['switchNightmode']),
    init() {
      this.onScroll()
    },
    onScroll() {
      this.setScrollY(window.pageYOffset || document.documentElement.scrollTop)
      this.flat = this.scrollY === 0
    },
    toggleDrawer() {
      this.$store.commit('setDrawer', !this.$store.state.drawer);
    }
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
