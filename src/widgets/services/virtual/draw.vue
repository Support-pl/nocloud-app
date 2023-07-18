<template>
  <div class="module">
    <a-row :gutter="[10, 10]">
      <a-col
        :md="12"
        :xs="12"
        :sm="12"
      >
        <div class="service-page__info">
          <div class="service-page__info-title">
            {{ $t('virtual_product.used space') | capitalize }}:
          </div>

          <div class="service-page__info-value">
            {{ service.diskusage }}MB / {{ service.disklimit }}MB
            ({{ ((service.diskusage / service.disklimit * 100) || 0).toFixed(2) }}%)
          </div>
          <a-progress
            :percent="service.diskusage / service.disklimit * 100"
            :show-info="false"
          />
        </div>
      </a-col>

      <a-col
        :md="12"
        :xs="12"
        :sm="12"
      >
        <div class="service-page__info">
          <div class="service-page__info-title">
            {{ $t('virtual_product.bw') | capitalize }}:
          </div>

          <div class="service-page__info-value">
            {{ service.bwusage }}MB /
            {{ service.bwlimit ? service.bwlimit +
              'MB' + ' (' + service.bwusage / service.bwlimit * 100 + '%)' :
              $t('virtual_product.unlimited') }}
          </div>
          <a-progress
            :percent="service.bwusage / service.bwlimit * 100"
            :show-info="false"
          />
        </div>
      </a-col>
    </a-row>

    <a-row :gutter="[10, 10]">
      <a-col
        :md="12"
        :xs="24"
        :sm="12"
      >
        <a-button
          size="large"
          type="primary"
          :loading="loginLoading"
          @click="logIntoCpanel"
        >
          {{ $t('enter') | capitalize }}
        </a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import api from '@/shared/api/api.js'
import notification from '@/shared/mixins/notification.js'

export default {
  name: 'VirtualDraw',
  mixins: [notification],
  props: { service: { required: true } },
  data: () => ({ loginLoading: false }),
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
              serviceid: this.service.id, userid: user.client_id
            }
          })
            .then(res => {
              if (res.result == 'error') throw res
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

<style>

.module__row-title{
	font-weight: bold;
	margin-top: 10px;
	margin-bottom: 5px;
}
</style>
