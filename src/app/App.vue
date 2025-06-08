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

    // This is the new logic to detect the popup context.
    if (window.location.pathname.endsWith('popup.html')) {
      // If we are in the popup, add a specific class to the root <html> element.
      document.documentElement.classList.add('icetab-popup');
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
/* These styles will ONLY apply when the <html> element has the .icetab-popup class.
  This fixes the popup without affecting the full-sized options page.
*/
html.icetab-popup {
  /* 1. Constrain the document size to the popup's max dimensions. */
  width: 600px;
  height: 600px;

  /* 2. Completely disable scrolling on the main document. */
  overflow: hidden;

  /* 3. Make the #app container the new scrolling viewport. */
  #app {
    height: 100%;
    overflow-y: auto;   /* Allow vertical scrolling INSIDE the app if needed */
    overflow-x: hidden;  /* Forbid horizontal scrolling */
  }
}
</style>