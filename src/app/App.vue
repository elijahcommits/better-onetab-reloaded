<template>
  <v-app
    :dark="nightmode"
    :class="{'no-transition': opts.disableTransition}"
  >
    <drawer v-model="drawerState" />
    <toolbar />
    <v-content>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-content>
    <v-footer app />
    <snackbar />
  </v-app>
</template>

<script>
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import '@/assets/css/fontawesome-all.min.css';
import { mapState, mapActions } from 'vuex';
import drawer from '@/app/component/main/Drawer.vue';
import toolbar from '@/app/component/main/Toolbar.vue';
import snackbar from '@/app/component/main/Snackbar.vue';

export default {
  name: 'App',
  components: {
    drawer,
    toolbar,
    snackbar,
  },
  computed: {
    ...mapState(['nightmode', 'opts', 'drawer']),
    drawerState: {
      get() {
        return this.drawer;
      },
      set(value) {
        this.switchDrawer(value);
      },
    },
  },
  created() {
    this.$store.dispatch('initializeState');

    if (window.location.pathname.endsWith('popup.html')) {
      document.documentElement.classList.add('icetab-popup');
    }
  },
  methods: {
    ...mapActions(['switchDrawer']),
  },
};
</script>

<style>
.no-transition * {
  transition: none !important;
}
</style>
