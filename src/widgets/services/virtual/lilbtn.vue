<template>
  <div class="btn">
    <a-button
      block
      @click.stop="logIntoCpanel"
    >
      {{ $t('enter') | capitalize }}
    </a-button>
  </div>
</template>

<script>
import api from '@/shared/api/api.js'
import notification from '@/shared/mixins/notification.js'

export default {
  mixins: [notification],
  props: ['service'],
  computed: {
    baseURL () {
      return this.$store.getters['products/getURL']
    }
  },
  methods: {
    logIntoCpanel () {
      this.loginLoading = true
      this.$store.dispatch('nocloud/auth/fetchBillingData')
        .then((user) => {
          api.get(`${this.baseURL}/cpanel.createSession.php`, {
            params: {
              serviceid: this.service.hostingid, userid: user.client_id
            }
          })
            .then(res => {
              if (res.result == 'error') { throw res }
              if (res?.cpanelresult?.error) {
                throw res
              }
              window.open(res.data.url)
            })
            .catch(err => {
              const message = err.response?.data?.message ?? err.message ?? err

              this.openNotificationWithIcon('error', {
                message: this.$t(message)
              })
              console.error(err)
            })
            .finally(() => {
              this.loginLoading = false
            })
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })
    }
  }
}
</script>

<style scoped>
.btn{
  grid-column: 2 / 4;
  justify-self: end;
  width: fit-content;
}

.btn button{
	height: 100%;
}
</style>
