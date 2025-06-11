<template>
  <v-app :dark="nightmode">
    <v-content>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@/assets/css/fontawesome-all.min.css'
import { mapState } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapState(['nightmode'])
  },
  created() {
    this.$store.dispatch('initializeState')

    // This logic adds the .is-popup class to the body, which our new CSS will use.
    if (new URLSearchParams(window.location.search).get('context') === 'popup') {
      document.body.classList.add('is-popup')
    }
  },
}
</script>

<style lang="scss">
/* This is the new CSS rule that fixes the drawer issue. */
/* It forces the drawer to its closed position on startup in the popup. */
.is-popup .v-navigation-drawer--open {
  transform: translateX(-100%) !important;
}
</style>
