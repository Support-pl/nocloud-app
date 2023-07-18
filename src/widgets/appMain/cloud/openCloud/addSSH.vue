<template>
  <div>
    <a-modal
      v-model="isVisible"
      :title="$t('Add a new SSH key')"
      @ok="handleOk"
    >
      <a-row
        :gutter="[10, 10]"
        style="display: flex; align-items: center"
      >
        <a-col
          :xs="24"
          :sm="4"
        >
          {{ $t('title') | capitalize }}
        </a-col>
        <a-col
          :xs="24"
          :sm="20"
        >
          <a-input
            v-model="title"
            type="text"
          />
        </a-col>
      </a-row>
      <a-row
        :gutter="[10, 10]"
        style="display: flex; align-items: center; margin-top: 5px"
      >
        <a-col
          :xs="24"
          :sm="4"
        >
          SSH
        </a-col>
        <a-col
          :xs="24"
          :sm="20"
        >
          <a-textarea
            v-model="value"
            :auto-size="{ minRows: 3, maxRows: 5 }"
          />
        </a-col>
      </a-row>
    </a-modal>
    <a-button @click="showModal">
      {{ $t('Add') }} SSH
    </a-button>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import notification from '@/shared/mixins/notification'

export default {
  mixins: [notification],
  data () {
    return {
      isLoading: false,
      isVisible: false,
      title: '',
      value: ''
    }
  },
  computed: {
    ...mapGetters('nocloud/auth', ['userdata'])
  },
  methods: {
    showModal () {
      this.isVisible = true
    },
    handleOk () {
      this.isLoading = true
      const ssh = { title: this.title, value: this.value }
      const dataObj = {
        data: {
          ssh_keys: []
        }
      }
      if (this.userdata.data?.ssh_keys) {
        dataObj.data.ssh_keys.push(...this.userdata.data.ssh_keys, ssh)
      } else {
        dataObj.data.ssh_keys.push(ssh)
      }
      const dataSSH = {
        id: this.userdata.uuid,
        body: dataObj
      }
      this.$store
        .dispatch('nocloud/auth/addSSH', dataSSH)
        .then((result) => {
          if (result) {
            this.openNotificationWithIcon('success', {
              message: this.$t('Add SSH key successfully')
            })
            this.isVisible = false
            this.title = ''
            this.value = ''
            this.$store.dispatch('nocloud/auth/fetchUserData')
          } else {
            this.openNotificationWithIcon('error', {
              message: this.$t('Error adding SSH key')
            })
          }
        })
        .catch((err) => {
          this.openNotificationWithIcon('error', {
            message: this.$t('Error adding SSH key')
          })
          console.error(err)
        })
        .finally(() => {
          this.isLoading = false
        })
    }
  }
}
</script>
