<template>
  <div class="openInvoice__fullscreen">
    <transition name="invoiceApear">
      <div v-if="!isLoading" class="openInvoice">
        <div class="openInvoice__header">
          <div class="container full-height">
            <div class="openInvoice__header--content">
              <div class="openInvoice__back" @click="goBack()">
                <div class="icon__wrapper">
                  <a-icon type="left" />
                </div>
              </div>
              <div class="openInvoice__title">
                <div
                  class="openInvoice__title-color"
                  :style="{ 'background-color': statusColor }"
                />
                {{ `${$t("singleInvoice")} #${$route.params.uuid}` }}
              </div>
            </div>
          </div>
        </div>

        <div class="openInvoice__main">
          <div class="container full-height">
            <div class="openInvoice__main-content">
              <div class="openInvoice__cost">
                <svg viewBox="0 0 120 25">
                  <text
                    class="openInvoice__cost-text"
                    x="50%" y="75%"
                    dominant-baseline="middle"
                    text-anchor="middle"
                  >
                    {{ total }} {{ currency.code }}
                  </text>
                </svg>
              </div>
              <div class="openInvoice__info">
                <div class="info__header-title">
                  {{ $t("Information") }}
                </div>

                <div class="info__dates">
                  <div class="info__date-item">
                    <div class="info__date-title">
                      {{ $t("invoiceDate") }}
                    </div>
                    <div class="info__date-value">
                      {{ invoice && date(invoice.proc) }}
                    </div>
                  </div>
                  <div class="info__date-item">
                    <div class="info__date-title">
                      {{ $t("dueDate") }}
                    </div>
                    <div class="info__date-value">
                      {{ invoice && date(invoice.exec) }}
                    </div>
                  </div>
                </div>

                <div v-if="records.length > 0" class="info__main" style="overflow-x: auto">
                  <a-table row-key="uuid" :data-source="records" :columns="columns">
                    <template #date="{ record }">
                      {{ date(record.exec) }}
                    </template>
                    <template #amount="{ record }">
                      {{ +(record.total * currency.rate).toFixed(2) }} {{ currency.code }}
                    </template>
                    <template #product="{ record }">
                      {{ (record.product)
                        ? record.product.replaceAll('_', ' ').toUpperCase()
                        : record.resource.toUpperCase() }}
                    </template>
                  </a-table>
                </div>

                <div v-if="invoice?.meta.description" class="info__main">
                  <a-card :title="$t('description') | capitalize">
                    <div>{{ invoice.meta.description }}</div>
                  </a-card>

                  <a-card
                    v-if="invoice.meta.instances && invoice.meta.instances.length > 0"
                    style="margin-top: 15px"
                    :title="$t('services') | capitalize"
                  >
                    <template #extra>
                      <router-link :to="{ name: 'services' }">
                        {{ $t('comp_services.all') }}
                      </router-link>
                    </template>
                    <router-link
                      v-for="inst of invoice.meta.instances"
                      :key="inst"
                      :to="{ name: 'openCloud', params: { uuid: inst } }"
                    >
                      {{ instances[inst] }}
                    </router-link>
                  </a-card>
                </div>

                <div v-if="invoice.exec == 0" class="info__footer">
                  <a-button class="info__button" :loading="isPayLoading" @click="payRequest">
                    {{ $t("Pay") }}
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <loading v-else key="loading" class="loading" color="#fff" duration: />
    </transition>
  </div>
</template>

<script>
import config from '@/appconfig.js'
import loading from '@/components/ui/loading.vue'

export default {
  name: 'OpenTransaction',
  components: { loading },
  data: () => ({
    isLoading: true,
    isPayLoading: false,
    instances: {},
    records: [],
    columns: [
      {
        title: 'Instance',
        dataIndex: 'instance'
      },
      {
        title: 'Product',
        dataIndex: 'product',
        scopedSlots: { customRender: 'product' }
      },
      {
        title: 'Date',
        dataIndex: 'exec',
        scopedSlots: { customRender: 'date' }
      },
      {
        title: 'Amount',
        dataIndex: 'total',
        scopedSlots: { customRender: 'amount' }
      }
    ]
  }),
  computed: {
    user () {
      return this.$store.getters['nocloud/auth/billingData']
    },
    userdata () {
      return this.$store.getters['nocloud/auth/userdata']
    },
    baseURL () {
      return this.$store.getters['invoices/getURL']
    },
    currencies () {
      return this.$store.getters['nocloud/auth/currencies']
    },
    currency () {
      const code = this.user.currency_code ?? 'USD'
      const { rate } = this.currencies.find((el) =>
        el.from === code && el.to === this.invoice.currency
      ) ?? {}

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.to === code && el.from === this.invoice.currency
      ) ?? { rate: 1 }

      return { code, rate: (rate) || 1 / reverseRate }
    },
    statusColor () {
      return this.records[0]?.processed
        ? config.colors.success
        : config.colors.err
    },
    services () {
      return this.$store.getters['nocloud/vms/getServicesFull']
    },
    invoice () {
      return this.$store.getters['nocloud/transactions/all']
        .find((el) => el.uuid === this.$route.params.uuid)
    },
    total () {
      const sum = this.records?.reduce((prev, el) => +prev + +el.total, 0) ||
        this.invoice?.total || 0

      return +(sum * this.currency.rate)?.toFixed(2)
    }
  },
  watch: {
    userdata () {
      this.$store.dispatch('nocloud/transactions/fetch', {
        account: this.userdata.uuid,
        page: this.$store.getters['nocloud/transactions/page'],
        limit: this.$store.getters['nocloud/transactions/size'],
        field: 'proc',
        sort: 'desc'
      })
    }
  },
  created () {
    if (this.currency.code === '') {
      this.$store.dispatch('nocloud/auth/fetchCurrencies')
    }

    setTimeout(() => {
      const { uuid } = this.$route.params

      sessionStorage.setItem('invoice', uuid)
    })

    this.$api.get('/services', { params: { show_deleted: true } })
      .then(({ pool }) => {
        pool.forEach((service) => {
          service.instancesGroups.forEach((group) => {
            group.instances.forEach((inst) => {
              this.$set(this.instances, inst.uuid, inst.title)
            })
          })
        })

        return this.$api.transactions.records(this.$route.params.uuid)
      })
      .then(({ pool }) => {
        this.records = pool.map((el) => ({
          ...el, instance: this.instances[el.instance] ?? 'unknown'
        }))

        this.columns[1].title = (pool[0].product) ? 'Product' : 'Resource'
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        this.isLoading = false
      })
  },
  destroyed () {
    if (!this.$route.name.includes('billing')) {
      sessionStorage.removeItem('invoice')
    }
  },
  methods: {
    goBack () {
      this.$router.push('/billing')
    },
    date (timestamp) {
      if (timestamp < 1) return '-'

      const date = new Date(timestamp * 1000)
      const time = date.toTimeString().split(' ')[0]

      const year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()

      if (`${month}`.length < 2) month = `0${month}`
      if (`${day}`.length < 2) day = `0${day}`

      return `${day}.${month}.${year} ${time}`
    },
    payRequest () {
      this.isPayLoading = true
      this.$api.get(this.baseURL, {
        params: {
          run: 'create_inv',
          invoice_id: this.invoice.uuid,
          product: this.invoice.meta.description ?? this.invoice.service,
          sum: this.invoice.total
        }
      })
        .then(({ invoiceid }) => {
          this.$notification.success({ message: this.$t('Done') })
          this.getPaytoken(invoiceid)
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.$notification.error({ message: this.$t(message) })
          console.error(err)
        })
        .finally(() => {
          this.isPayLoading = false
        })
    },
    getPaytoken (invoiceId) {
      this.$api.get(this.baseURL, {
        params: {
          run: 'get_pay_token', invoice_id: invoiceId
        }
      })
        .then((res) => { window.location.href = res })
    }
  }
}
</script>

<style>
.openInvoice__fullscreen {
  background: var(--main);
}
.openInvoice {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.openInvoice__header {
  height: 64px;
  line-height: 64px;
  background-color: var(--main);
  color: var(--bright_font);
  padding: 0;
}

.openInvoice__header--content {
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
  height: 100%;
}

.openInvoice__title {
  font-weight: bold;
  line-height: 1.1rem;
  position: relative;
}

.openInvoice__title-color {
  position: absolute;
  height: 10px;
  width: 10px;
  border-radius: 50%;
  top: calc(50% - 2px);
  left: -15px;
  transform: translateY(-50%);
}

.openInvoice__back {
  font-size: 1.4rem;
  cursor: pointer;
}

.openInvoice__main {
  flex: 1 0;
  background-color: var(--main);
}

.openInvoice__main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.openInvoice__cost {
  width: 100%;
}

.openInvoice__cost-text {
  fill: var(--bright_font);
}

.openInvoice__info {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  background-color: var(--bright_font);
  border-radius: 25px 25px 0 0;
  padding: 10px 20px 20px;
  position: relative;
}

.info__main {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  padding-bottom: 64px;
}

.info__dates {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.info__date-item {
  text-align: center;
}
.info__date-title {
  font-weight: bold;
  font-size: 16px;
  padding: 0;
}
.info__date-value {
  font-weight: bold;
  font-size: 16px;
  line-height: 1.2;
  padding: 0;
}

.full-height {
  height: 100%;
}

.info__header-title {
  text-align: center;
  margin-top: 15px;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.info__footer {
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  height: 45px;
  position: absolute;
  bottom: 30px;
  left: 20px;
  right: 20px;
  flex-direction: column;
}

.info__button {
  flex: 1 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  font-weight: 600;
  color: var(--bright_font);
  cursor: pointer;
  font-size: 16px;
  transition: filter 0.2s ease;
  background-color: var(--success);
  background-size: 150% 200%;
  background-position: 0 0;
  animation: AnimationName 1s ease infinite;
}

.loading {
  position: absolute;
  height: 100%;
  width: 100%;
}

/* anims */

.invoiceApear-enter-active,
.invoiceApear-leave-active {
  transition: opacity 0.6s;
}
.invoiceApear-enter,
.invoiceApear-leave-to {
  opacity: 0;
}

.invoiceApear-enter-active .openInvoice__title {
  transition: transform 0.2s 0.4s ease;
}

.invoiceApear-enter .openInvoice__title {
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}

.invoiceApear-enter-active .openInvoice__cost {
  transition: transform 0.2s 0.3s ease, opacity 0.2s 0.4s ease;
}

.invoiceApear-enter .openInvoice__cost {
  opacity: 0;
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}

.opencloud-enter-active .openInvoice__info {
  transition: transform 0.2s 0.4s ease, opacity 0.2s 0.2s ease;
}

.opencloud-enter .openInvoice__info {
  transform: translateY(200px);
  opacity: 0;
}
.invoiceApear-enter-active .info__footer {
  transition: transform 0.3s 0.3s ease, opacity 0.2s 0.4s ease;
}

.invoiceApear-enter .info__footer {
  transform: translateY(50px);
  opacity: 0;
}

@media screen and (max-width: 768px) {
  .info__dates {
    justify-content: space-between;
  }
  .openInvoice__info {
    border-radius: 60px 0px 0 0;
    margin-top: 55px;
  }
  .openInvoice__info::after {
    content: url("/public/img/images/radius.png");
    position: absolute;
    top: -49px;
    right: 0;
  }
}
</style>
