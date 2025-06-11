<template>
  <v-app
    :dark="nightmode"
    :class="{'no-transition': opts.disableTransition}"
  >
    <drawer v-model="drawerState" /> <toolbar />
    <v-content>
      <v-container>
        <keep-alive>
          <router-view />
        </keep-alive>
      </v-container>
    </v-content>
    <v-footer />
    <snackbar />
  </v-app>
</template>

<script>
import drawer from '@/app/component/main/Drawer'
import toolbar from '@/app/component/main/Toolbar'
import snackbar from '@/app/component/main/Snackbar'

import { mapState, mapActions } from 'vuex'

export default {
  components: {
    drawer,
    toolbar,
    snackbar,
  },
  computed: {
    ...mapState(['nightmode', 'opts']),
    drawerState: {
      get() {
        return this.$store.state.drawer;
      },
      set(value) {
        this.switchDrawer(value);
      }
    }
  },
  created() {
    // Force the drawer to be closed if this is a popup.
    // This hook runs before the component is mounted to the DOM.
    const isPopup = new URLSearchParams(window.location.search).get('context') === 'popup';
    if (isPopup) {
      this.switchDrawer(false);
    }
  },
  methods: {
    ...mapActions(['switchDrawer'])
  }
}
</script>

<style>
.no-transition * {
  transition: none !important;
}
</style>
