<template>
  <v-app :dark="nightmode">
    <router-view></router-view>
  </v-app>
</template>

<script>
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@/assets/css/fontawesome-all.min.css'
// 3. Import `mapState` from Vuex to easily access store properties.
import { mapState } from 'vuex'

export default {
  name: 'app',
  // 4. Add a computed property to get the live 'nightmode' state from the store.
  computed: {
    ...mapState(['nightmode'])
  },
  created() {
    // 5. Dispatch our new action to load all settings as soon as the app is created.
    this.$store.dispatch('initializeState')

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
</style>

