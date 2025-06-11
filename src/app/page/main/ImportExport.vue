<template>
  <v-card>
    <v-tabs
      color="cyan"
      dark
      grow
      slider-color="yellow"
    >
      <v-tab key="import">
        {{ __('ui_import') }}
      </v-tab>
      <v-tab key="export">
        {{ __('ui_export') }}
      </v-tab>
      <v-tab-item key="import">
        <v-card flat>
          <v-card-text>
            <v-btn
              :loading="processing"
              :disabled="!importData"
              @click="imp(true)"
            >
              {{ __('ui_import_comp') }}
            </v-btn>
            <v-btn
              :loading="processing"
              :disabled="!importData"
              @click="imp(false)"
            >
              {{ __('ui_import_json') }}
            </v-btn>
            <input
              ref="fileSelector"
              type="file"
              hidden
              @change="impFile"
            >
            <v-btn
              :loading="processing"
              @click="$refs.fileSelector.click()"
            >
              {{ __('ui_import_from_file') }}
              <v-icon
                dark
                right
              >
                attach_file
              </v-icon>
            </v-btn>
            <v-textarea
              v-model="importData"
              autofocus
              clearable
              auto-grow
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item key="export">
        <v-card flat>
          <v-card-text>
            <v-btn @click="exp(true)">
              {{ __('ui_export_comp') }}
            </v-btn>
            <v-btn @click="exp(false)">
              {{ __('ui_export_json') }}
            </v-btn>
            <v-btn
              :disabled="!exportData"
              @click="copy"
            >
              {{ __('ui_copy') }}
            </v-btn>
            <v-btn
              :disabled="!exportType"
              @click="save"
            >
              {{ __('ui_save_as_file') }}
            </v-btn>
            <v-btn
              v-if="showGoogleDriveButton"
              color="success"
              :loading="saving"
              @click="saveToGdrive"
            >
              {{ __('ui_save_to_gdrive') }}
              <v-icon
                dark
                right
              >
                fab fa-google-drive
              </v-icon>
            </v-btn>
            <v-textarea
              v-model="exportData"
              auto-grow
              readonly
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs>


    <v-fab-transition>
      <v-btn
        v-if="scrollY > 100"
        color="pink"
        dark
        fab
        fixed
        bottom
        right
        @click="$vuetify.goTo(0)"
      >
        <v-icon>keyboard_arrow_up</v-icon>
      </v-btn>
    </v-fab-transition>
  </v-card>
</template>
<script>
import __ from '@/common/i18n'
import exchange from '@/common/exchange'
import {readFile} from '@/common/utils'
import gdrive from '@/common/service/gdrive'
import {mapMutations, mapActions, mapState} from 'vuex'
import {ADD_LIST} from '@/common/constants'
import logger from '@/common/logger'

export default {
  data() {
    return {
      exportData: '',
      importData: '',
      exportType: null,
      processing: false,
      file: null,
      saving: false,
      showGoogleDriveButton: false, // Set to 'false' to hide the button
    }
  },
  computed: {
    ...mapState(['scrollY']),
  },
  methods: {
    __,
    ...mapMutations([ADD_LIST]),
    ...mapActions(['showSnackbar']),
    async exp(comp) {
      if (this.processing) return this.showSnackbar(__('ui_main_processing'))
      this.processing = true
      try {
        this.exportData = await exchange.exportToText(comp)
        this.exportType = comp ? exchange.types.TEXT : exchange.types.JSON
        this.showSnackbar(__('ui_main_succeeded'))
      } catch (e) {
        logger.error(e)
        this.showSnackbar(__('ui_main_error_occurred'))
        this.exportType = null
      } finally {
        this.processing = false
      }
    },
    async imp(comp) {
      if (this.processing) return this.showSnackbar(__('ui_main_processing'))
      this.processing = true
      try {
        const lists = await exchange.importFromText(comp, this.importData)
        // reverse for keeping the order
        lists.reverse().forEach(list => this[ADD_LIST]([list]))
        this.showSnackbar(__('ui_main_succeeded'))
        this.importData = ''
        this.$router.push('/app/list')
      } catch (e) {
        logger.error(e)
        this.showSnackbar(__('ui_main_error_occurred'))
      } finally {
        this.processing = false
      }
    },
    async impFile(event) {
      const [file] = event.target.files
      // the biggest file size is 1MB & unrestricted file type
      if (file.size > (1 << 20)) return
      const text = await readFile(file)
      this.importData = text
    },
    async copy() {
      if (await this.$copyText(this.exportData)) this.showSnackbar(__('ui_copied'))
    },
    async save() {
      if (this.processing) return this.showSnackbar(__('ui_main_processing'))
      this.processing = true
      try {
        await exchange.exportToFile(this.exportData, this.exportType)
        this.showSnackbar(__('ui_main_succeeded'))
      } catch (e) {
        logger.error(e)
        this.showSnackbar(__('ui_main_error_occurred'))
      } finally {
        this.processing = false
      }
    },
    async saveToGdrive() {
      this.saving = true
      try {
        // Capture the result object from gdrive.saveCurrentTabLists()
        const result = await gdrive.saveCurrentTabLists()
        // Check the success property of the result
        if (result.success) {
          this.showSnackbar(__('ui_main_succeeded'))
        } else {
          // If not successful, use the message provided by the result,
          // or a generic error message if no specific message is provided.
          this.showSnackbar(result.message || __('ui_main_error_occurred'))
        }
      } catch (e) {
        logger.error(e)
        gdrive.clearToken()
      } finally {
        this.saving = false
      }
    },
  }
}
</script>
