<template>
  <v-app :dark="nightmode">
    <v-content>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@/assets/css/fontawesome-all.min.css'
import { mapState } from 'vuex'

export default {
  name: 'app',
  computed: {
    ...mapState(['nightmode'])
  },
  created() {
    this.$store.dispatch('initializeState')

    // This logic adds the .icetab-popup class to the <html> element
    if (window.location.pathname.endsWith('popup.html')) {
      document.documentElement.classList.add('icetab-popup')
    }

    /* eslint-disable-next-line */
    if (PRODUCTION) import(
      /* webpackChunkName: "tracker", webpackMode: "lazy" */
      '@/common/tracker'
    ).then(({tracker}) => {
      tracker()
      if (!this.$route.name) return
      ga('set', 'page', this.$route.name)
      ga('send', 'pageview')
    })
  },
}
</script>

<style lang="scss">
/* All previous CSS fixes should be removed from here. */
</style>
