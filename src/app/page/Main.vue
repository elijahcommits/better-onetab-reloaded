<template>
  <v-app
    :dark="nightmode"
    :class="{'no-transition': opts.disableTransition}"
  >
    <drawer :value="drawer" />
    <toolbar />
    <v-content>
      <v-container>
        <keep-alive>
          <router-view />
        </keep-alive>
      </v-container>
    </v-content>
    <v-footer>
      <v-spacer />
      <span>
        Made with <i
          class="fa fa-heart throb"
          style="color:#d43f57"
        /> by <a
          style="color:red; text-decoration: none;"
          href="https://www.cnwangjie.com/"
          target="_blank"
        >WangJie</a>,
        sporked by <a
          style="color:red; text-decoration: none;"
          href="https://www.elicrab.com/"
          target="_blank"
        >Elijah</a>
      </span>
      <v-spacer />
    </v-footer>
    <snackbar />
  </v-app>
</template>
<script>
import drawer from '@/app/component/main/Drawer'
import toolbar from '@/app/component/main/Toolbar'
import snackbar from '@/app/component/main/Snackbar'

import {mapState} from 'vuex'

export default {
  components: {
    drawer,
    toolbar,
    snackbar,
  },
  computed: {
    ...mapState(['drawer', 'nightmode', 'opts']),
  },
}
</script>
<style>
.no-transition * {
  transition: none !important;
}
</style>
