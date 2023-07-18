<template>
  <a-row
    class="module"
    :gutter="[10, 10]"
  >
    <a-col span="12">
      <div style="font-weight: 700">
        {{ $t('token') | capitalize }}:
      </div>
      <div style="font-size: 1.1rem">
        {{ service.data?.token ?? '-' }}
      </div>
    </a-col>
    <a-col span="12">
      <div style="font-weight: 700">
        {{ $t('Token expiration date') }}:
      </div>
      <div style="font-size: 1.1rem">
        {{ service.data?.expires_at ?? '-' }}
      </div>
    </a-col>

    <a-col>
      <a-table
        :columns="columns"
        :data-source="acronisData"
        :pagination="false"
      />
    </a-col>

    <a-col style="display: flex; gap: 10px">
      <a-button
        type="primary"
        :loading="isLoading"
        @click="openLink"
      >
        {{ $t('open') }}
      </a-button>
      <a-button
        type="primary"
        :loading="isRefreshLoading"
        @click="refreshToken"
      >
        {{ $t('Refresh token') }}
      </a-button>
    </a-col>
  </a-row>
</template>

<script>
export default {
  name: 'AcronisDraw',
  props: { service: { type: Object, required: true } },
  data () {
    return {
      isLoading: false,
      isRefreshLoading: false,
      columns: [
        {
          title: this.$options.filters.capitalize(this.$t('name')),
          dataIndex: 'title',
          key: 'title'
        },
        {
          title: this.$options.filters.capitalize(this.$t('count')),
          dataIndex: 'count',
          key: 'count'
        },
        {
          title: this.$t('invoice_Price'),
          dataIndex: 'price',
          key: 'price'
        }
      ]
    }
  },
  computed: {
    user () {
      return this.$store.getters['nocloud/auth/billingData']
    },
    currency () {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency']

      return { code: this.user.currency_code ?? defaultCurrency }
    },
    acronisData () {
      return Object.entries(this.service.config.items)
        .reduce((res, [key, count]) => {
          const { price: rowPrice, meta } = this.service.billingPlan.products[key]
          const price = `${rowPrice} ${this.currency.code}`
          const title = meta.edition

          if (key === 'local_storage') return res
          return [...res, { key, count, title, price }]
        }, [])
    }
  },
  methods: {
    openLink () {
      this.isLoading = true
      this.$api.instances
        .action({ action: 'get_link', uuid: this.service.uuid })
        .then(({ meta }) => location.assign(meta.link))
        .catch((err) => { console.error(err) })
    },
    refreshToken () {
      this.isRefreshLoading = true
      this.$api.instances
        .action({ action: 'refresh_token', uuid: this.service.uuid })
        .then(() => this.$message.success(this.$t('Done')))
        .catch((err) => { console.error(err) })
        .finally(() => { this.isRefreshLoading = false })
    }
  }
}
</script>
