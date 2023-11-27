<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <div class="order_option">
          <a-steps class="order__steps" size="small" :current="currentStep">
            <a-step :title="$t('ssl_product.product')" />
            <a-step :title="$t('ssl_product.CSR')" />
            <a-step :title="$t('ssl_product.personal data')" />
            <a-step :title="$t('ssl_product.verification')" />
          </a-steps>

          <component
            :is="template"
            :csr="csr"
            :personal="personal"
            :personal-back="personal"
            :product-info="getProducts"
            :verification-back="verification"
            @handle-click-next="handleClickNext"
            @handle-click-prev="handleClickPrev"
            @get-verification="(data) => verification = data"
          />

          <template v-if="currentStep === 0">
            <a-row class="order__prop" style="margin-bottom: 5px">
              <a-col span="8" :xs="6">
                {{ capitalize($t('provider')) }}:
              </a-col>
            </a-row>

            <div class="order__slider">
              <template v-if="!fetchLoading">
                <div
                  v-for="product of Object.keys(products)"
                  :key="product"
                  class="order__slider-item"
                  :class="{ 'order__slider-item--active': options.provider === product }"
                  @click="options.provider = product"
                >
                  {{ product }}
                </div>
              </template>
              <template v-else>
                <div
                  v-for="(_, index) of Array(4)"
                  :key="index"
                  class="order__slider-item order__slider-item--loading"
                />
              </template>
            </div>

            <a-row class="order__prop">
              <a-col span="8" :xs="6">
                {{ capitalize($t('product_name')) }}:
              </a-col>
              <a-col span="16" :xs="18">
                <a-select v-if="!fetchLoading" v-model:value="options.tarif" style="width: 100%">
                  <a-select-option v-for="kind of products[options.provider]" :key="kind.product">
                    {{ kind.product }}
                  </a-select-option>
                </a-select>
                <div v-else class="loadingLine" />
              </a-col>
            </a-row>

            <a-row class="order__prop">
              <a-col span="8" :xs="6">
                {{ $t('ssl_product.domain') }}:
              </a-col>
              <a-col span="16" :xs="18">
                <a-input
                  v-if="!fetchLoading"
                  v-model:value="options.domain"
                  placeholder="example.com"
                />
                <div v-else class="loadingLine" />
              </a-col>
            </a-row>

            <a-row class="order__prop">
              <a-col span="24">
                <router-link :to="{ name: 'csr' }">
                  <a-button type="primary" :disabled="true">
                    {{ $t("ssl_product.generate") }} CSR
                  </a-button>
                </router-link>
                <a-button type="primary" style="margin-left: 10px" @click="handleClickNext">
                  {{ $t("ssl_product.continue") }} <right-icon />
                </a-button>
              </a-col>
            </a-row>
          </template>
        </div>
      </div>

      <div class="order__calculate order__field">
        <a-row type="flex" justify="space-around" style="margin-top: 20px">
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('Payment period') }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12">
            <a-select v-if="!fetchLoading" v-model:value="options.period" style="width: 100%">
              <a-select-option v-for="period in periods" :key="period">
                {{ $tc('month', period) }}
              </a-select-option>
            </a-select>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <selects-to-create
          v-model:plan="plan"
          v-model:service="service"
          v-model:namespace="namespace"
          v-model:provider="provider"
          :plans-list="plans"
          :sp-list="sp"
        />

        <a-divider orientation="left" :style="{'margin-bottom': '0'}">
          {{ $t('Total') }}:
        </a-divider>

        <a-row type="flex" justify="space-around" :style="{'font-size': '1.5rem'}">
          <a-col v-if="getProducts.prices">
            <template v-if="!fetchLoading">
              {{ getProducts.prices[options.period] }} {{ currency.code }}
            </template>
            <div v-else class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin-top: 24px; margin-bottom: 10px">
          <a-col :span="22">
            <a-button type="primary" block shape="round" :disabled="currentStep !== 3" @click="orderConfirm">
              {{ capitalize($t("order")) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="() => { modal.confirmCreate = false }"
            >
              <p>{{ $t('order_services.Do you want to order') }}: {{ getProducts.product }}</p>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-page class="order__promo" />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapStores, mapState } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'

import notification from '@/mixins/notification.js'
import selectsToCreate from '@/components/ui/selectsToCreate.vue'
import promoPage from '@/components/ui/promo.vue'

const rightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RightOutlined')
)

export default {
  name: 'SslComponent',
  components: { passwordMeter, selectsToCreate, promoPage, rightIcon },
  mixins: [notification],
  inject: ['checkBalance'],
  data: () => ({
    products: {},
    cachedPlans: {},
    currentStep: 0,
    plan: null,
    service: null,
    namespace: null,
    provider: null,
    fetchLoading: false,

    options: {
      provider: '',
      tarif: '',
      domain: '',
      period: ''
    },
    modal: {
      confirmCreate: false,
      confirmLoading: false
    },

    csr: {},
    personal: {},
    verification: {}
  }),
  computed: {
    ...mapStores(useNamespasesStore, useSpStore, usePlansStore, useInstancesStore),
    ...mapState(useAppStore, ['onLogin']),
    ...mapState(useAuthStore, ['isLogged', 'userdata', 'fetchBillingData']),
    ...mapState(useCurrenciesStore, [
      'currencies',
      'defaultCurrency',
      'unloginedCurrency',
      'fetchCurrencies'
    ]),
    getProducts () {
      if (Object.keys(this.products).length === 0) return 'NAN'
      const product = this.products[this.options.provider]
        .find(el => el.product === this.options.tarif)

      return { ...product, price: +(product.price * this.currency.rate).toFixed(2) }
    },
    template () {
      switch (this.currentStep) {
        case 1:
          return () => import('@/components/services/ssl/csr.vue')
        case 2:
          return () => import('@/components/services/ssl/personal.vue')
        case 3:
          return () => import('@/components/services/ssl/verification.vue')
        default:
          return null
      }
    },
    currency () {
      const code = this.unloginedCurrency
      const { rate } = this.currencies.find((el) =>
        el.to === this.defaultCurrency && el.from === code
      ) ?? {}

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.from === this.defaultCurrency && el.to === code
      ) ?? { rate: 1 }

      if (!this.isLogged) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: this.userdata.currency ?? this.defaultCurrency }
    },
    periods () {
      return Object.keys(this.getProducts.prices || {})
        .filter((el) => isFinite(+el))
    },
    services () {
      return this.instancesStore.services.filter((el) => el.status !== 'DEL')
    },
    plans () {
      return this.cachedPlans[this.provider]?.filter(({ type, uuid }) => {
        const { items } = this.spStore.showcases.find(
          ({ uuid }) => uuid === this.$route.query.service
        ) ?? {}
        const plans = []

        if (!items) return type === 'goget'
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === this.provider) {
            plans.push(plan)
          }
        })

        if (plans.length < 1) return type === 'goget'
        return type === 'goget' && plans.includes(uuid)
      }) ?? []
    },
    sp () {
      const { items } = this.spStore.showcases.find(
        ({ uuid }) => uuid === this.$route.query.service
      ) ?? {}

      if (!items) return []
      return this.spStore.servicesProviders.filter(({ uuid }) =>
        items.find((item) => uuid === item.servicesProvider)
      )
    }
  },
  watch: {
    sp (value) {
      if (value.length > 0) this.provider = value[0].uuid
    },
    async provider (uuid) {
      if (this.cachedPlans[uuid]) return
      try {
        const { pool } = await this.plansStore.fetch({
          anonymously: !this.isLogged, sp_uuid: uuid
        })

        this.cachedPlans[uuid] = pool
        this.plan = pool[0]?.uuid
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.$notification.error({ message })
      }
    },
    'options.provider' (value) {
      this.options.tarif = this.products[value][0].product
    },
    periods (value) {
      this.options.period = value[0]
    },
    currentStep (value) {
      if (value === 1) this.csr.domain = this.options.domain
    }
  },
  mounted () {
    const { action } = this.onLogin

    if (typeof action !== 'function') return
    this.modal.confirmCreate = true
    this.modal.confirmLoading = true
    action()
  },
  created () {
    this.fetchBillingData()
    this.spStore.fetch(!this.isLogged).then(() => this.fetch())
    this.spStore.fetchShowcases(!this.isLogged)

    if (this.isLogged) {
      this.namespacesStore.fetch()
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          if (err.response?.data?.code === 16) return
          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })

      this.instancesStore.fetch()
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          if (err.response?.data?.code === 16) return
          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })
    }

    if (this.currencies.length < 1) this.fetchCurrencies()
  },
  methods: {
    fetch () {
      this.fetchLoading = true
      this.$api.post(`/sp/${this.provider}/invoke`, {
        method: 'get_certificate'
      })
        .then(({ meta }) => {
          const plan = this.plans.find(({ uuid }) => uuid === this.plan)

          meta.cert.products.forEach((product) => {
            const prices = {}

            Object.keys(product.prices).forEach((period) => {
              const key = `${period} ${product.id}`

              if (plan.products[key]) prices[period] = plan.products[key].price
            })

            if (Object.keys(prices).length > 0) {
              if (!(product.brand in this.products)) {
                this.products[product.brand] = []
              }
              this.products[product.brand].push({ ...product, prices })
            }
          })

          this.options.provider = Object.keys(this.products)[0]
          this.options.tarif = this.products[this.options.provider][0].product
          this.products = Object.assign({}, this.products)
        })
        .catch(err => console.error(err))
        .finally(() => {
          this.fetchLoading = false
        })
    },
    orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)

      const instances = [{
        resources: {
          id: this.getProducts.id,
          user: this.personal,
          domain: this.options.domain,
          period: this.options.period,
          csr: this.csr.csr,
          dcv: this.verification.dcv,
          approver_email: this.verification.email
        },
        title: this.options.tarif,
        billing_plan: plan ?? {}
      }]
      const newGroup = {
        title: this.userdata.title + Date.now(),
        type: 'goget',
        sp: this.provider,
        instances
      }

      if (plan.kind === 'STATIC') instances[0].product = this.options.provider

      const info = (!this.service) ? newGroup : JSON.parse(JSON.stringify(service))
      const group = info.instancesGroups?.find(({ type }) => type === 'goget')

      if (group) group.instances = [...group.instances, ...instances]
      else if (this.service) info.instancesGroups.push(newGroup)

      if (!this.isLogged) {
        this.onLogin.redirect = this.$route.name
        this.onLogin.info = {
          type: 'ssl',
          title: 'SSL Certificate',
          cost: this.getProducts.prices[this.options.period],
          currency: this.currency.code
        }
        this.onLogin.action = () => {
          this.createSSL(info)
        }

        this.$router.push({ name: 'login' })
        return
      }

      this.createSSL(info)
    },
    createSSL (info) {
      this.modal.confirmLoading = true
      const action = (this.service) ? 'update' : 'create'
      const orderData = (this.service)
        ? info
        : {
            namespace: this.namespace,
            service: {
              title: this.userdata.title,
              context: {},
              version: '1',
              instancesGroups: [info]
            }
          }

      this.instancesStore[`${action}Service`](orderData)
        .then(({ uuid }) => { this.deployService(uuid) })
        .catch((err) => {
          const config = { namespace: this.namespace, service: orderData }
          const message = err.response?.data?.message ?? err.message ?? err

          this.$api.services.testConfig(config)
            .then(({ result, errors }) => {
              if (!result) {
                errors.forEach(({ error }) => {
                  this.openNotificationWithIcon('error', { message: error })
                })
              }
            })
          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })
    },
    orderConfirm (order = true) {
      const isValid = this.options.domain.match(/.+\..+/)

      if (!isValid) {
        this.$message.error('domain is wrong')
        return
      }
      if (!this.checkBalance(this.getProducts.prices[this.options.period])) return
      if (order) this.modal.confirmCreate = true

      return isValid
    },
    deployService (uuid) {
      this.$api.services.up(uuid)
        .then(() => {
          this.openNotificationWithIcon('success', {
            message: this.$t('SSL created successfully')
          })
          this.$router.push({ path: '/services' })
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
        })
        .finally(() => {
          this.modal.confirmLoading = false
        })
    },
    handleClickPrev (data) {
      if (data.csr) {
        this.csr = data
      } else if (data.firstname) {
        this.personal = data
      } else if (data.dcv) {
        this.verification = data
      }
      this.currentStep--
    },
    handleClickNext (data) {
      if (data.csr) {
        this.csr = data
      } else if (data.firstname) {
        this.personal = data
      }

      if (this.orderConfirm(false)) {
        this.currentStep++
      }
    }
  }
}
</script>

<style>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  left: 50%;
  display: grid;
  grid-template-columns: calc(72% - 20px) 28%;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.order__prop:not(:first-child){
  margin-top: 15px;
}

.order__field {
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate {
  padding: 10px 15px 10px;
  font-size: 1.1rem;
}

.order__steps > .ant-steps-item {
  flex: 1 1 auto;
}

.order__steps > .ant-steps-item:last-child {
  flex: none;
}

.order__field-header{
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.order__template{
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.order__template.one-line{
  flex-wrap: nowrap;
  justify-content: space-between;
}

.order__template-item{
  width: 116px;
  margin-bottom: 10px;
  background-color: var(--bright_font);
  box-shadow:
    3px 2px 6px rgba(0, 0, 0, .08),
    0px 0px 8px rgba(0, 0, 0, .05);
  border-radius: 15px;
  transition: box-shadow .2s ease, transform .2s ease;
  cursor: pointer;
  text-align: center;
  overflow: hidden;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: max-content auto;
}

.order__template-item:not(:last-child){
  margin-right: 10px;
}

.order__template-item:hover{
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
}

.order__template-item.active{
  box-shadow:
    5px 8px 12px rgba(0, 0, 0, .08),
    0px 0px 13px rgba(0, 0, 0, .05);
  transform: scale(1.02);
}

.order__template-image{
  padding: 10px;
}

.order__template-image__rate{
  font-size: 2rem;
}

.order__template-name{
  padding: 10px;
}

.order__template-item.active .order__template-name{
  background-color: var(--main);
  color: var(--bright_font);
}

.max-width{
  width: 100%;
}

.ant-collapse-item:last-of-type .ant-collapse-content{
  border-radius: 0 0 28px 28px;
}

.slider_btn{
  cursor: pointer;
}

.removeMarginSkeleton .ant-skeleton-title{
  margin: 0;
  margin-top: 4px;
}

.removeMarginSkeleton{
  min-width: 75px;
}

.total.removeMarginSkeleton{
  width: 100%;
}

.order__slider{
  display: flex;
  overflow-x: auto;
  padding-bottom: 10px;
}

.order__slider-item:not(:last-child){
  margin-right: 10px;
}

.order__slider-item{
  flex-shrink: 0;
  /* border: 1px solid rgba(0, 0, 0, .15); */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 150px;
  height: 70px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover{
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active{
  background-color: var(--main);
  color: var(--bright_font);
}

.order__slider-item--loading{
  /* background-color: #f2f2f2; */
  box-shadow: none;
  /* animation: glowing .5s ease infinite; */
  animation-name: glowing;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.loadingLine{
  min-width: 100px;
  width: 100%;
  height: 2rem;
  border-radius: 4px;
  animation-name: glowing;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.loadingLine--total{
  margin-top: 10px;
  height: 26px;
}

@keyframes glowing {
  from {
    background-color: #f2f2f2;
  }
  to {
    background-color: #e9e9e9;
    /* background-color: red; */
  }
}

@media screen and (max-width: 1024px) {
  .order {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .order__field {
    box-shadow: none;
    border-radius: 20px 20px 0 0;
  }
  .order__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }
  .order__promo {
    margin-top: 20px;
  }
}

@media screen and (max-width: 576px) {
  .order__template{
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
  .order__template-item{
    grid-template-columns: max-content auto;
    grid-template-rows: 1fr;
    width: auto;
    height: 50px;
  }
  .order__template-item:not(:last-child){
    margin-right: 0px;
  }
  .order__template-image{
    width: 50px;
    height: 50px;
    padding: 4px;
  }
  .order__template-image__rate{
    line-height: 42px;
    font-size: 1.4rem;
  }
  .order__template-image img{
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  .order__template-name{
    text-align: left;
    line-height: 30px;
    display: flex;
  }
  .order__template-type{
    width: 56px;
  }
  .order__template-name ul{
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1
  }
  .order__template-name ul li{
    margin-left: 20px;
  }
}

.networkApear-enter-active, .networkApear-leave-active {
  transition: opacity .5s, height .5s;
  height: 26px;
}
.networkApear-enter-from, .networkApear-leave-to {
  opacity: 0;
  height: 0;
}
</style>
