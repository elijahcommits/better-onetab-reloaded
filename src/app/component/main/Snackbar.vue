<template>
  <v-snackbar
    v-model="snackbar.status"
    :timeout="0"
    bottom
  >
    {{ snackbar.msg }}
  </v-snackbar>
</template>
<script>
import {mapState} from 'vuex'

export default {
  computed: {
    ...mapState(['snackbar']),
  }
}
</script>

