<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <a-collapse v-model:activeKey="activeKey" style="border-radius: 20px">
          <a-collapse-panel key="base" :header="`${$t('Base')}:`">
            <div class="order_option">
              <a-row v-for="(value, key) in getProducts.base" :key="key" class="order__prop">
                <a-col span="18">
                  {{ capitalize(value.meta.edition || value.title) }}:
                </a-col>
                <a-col span="6" style="text-align: right">
                  <a-input-number v-if="!fetchLoading" v-model:value="config[key]" :min="0" />
                  <div v-else class="loadingLine" />
                </a-col>
              </a-row>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="adv" :header="`${$t('Advanced')}:`">
            <div class="order_option">
              <a-row v-for="(value, key) in getProducts.adv" :key="key" class="order__prop">
                <a-col span="6">
                  {{ capitalize(value.meta.edition || value.title) }}:
                </a-col>
                <a-col span="18" style="text-align: right">
                  <a-input-number v-if="!fetchLoading" v-model:value="config[key]" :min="0" />
                  <div v-else class="loadingLine" />
                </a-col>
              </a-row>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="personal" style="border-bottom: 0" :header="`${capitalize($t('data'))}:`">
            <a-form-item :label="$t('login')">
              <a-input
                v-model:value="options.login"
                :style="{ boxShadow: (options.login.length < 2) ? '0 0 2px 2px var(--err)' : null }"
              />
              <div v-if="options.login.length < 2" style="line-height: 1.5; color: var(--err)">
                {{ $t('ssl_product.field is required') }}
              </div>
            </a-form-item>

            <a-form-item v-if="userdata.uuid" :label="$t('clientinfo.password')">
              <password-meter
                :style="{
                  height: (options.password.length > 0) ? '10px' : '0',
                  marginTop: (options.password.length < 1) ? '0' : null
                }"
                :password="options.password"
                @score="(value) => score = value.score"
              />
              <a-input-password v-model:value="options.password" class="password" />
            </a-form-item>
          </a-collapse-panel>
        </a-collapse>
      </div>

      <div class="order__calculate order__field">
        <a-row type="flex" justify="space-around" style="margin-top: 20px">
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('Pay period') }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12">
            <a-select v-if="!fetchLoading" v-model:value="options.period" style="width: 100%">
              <a-select-option v-for="period in periods" :key="period">
                {{ getPeriod(period) }}
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

        <a-divider orientation="left" style="margin-bottom: 0">
          {{ $t('Total') }}:
        </a-divider>

        <a-row type="flex" justify="space-around">
          <a-col style="font-size: 1.5rem">
            <transition name="textchange" mode="out-in">
              <template v-if="!fetchLoading">
                {{ getProducts.price }} {{ currency.code }}
              </template>
              <div v-else class="loadingLine loadingLine--total" />
            </transition>
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button type="primary" block shape="round" @click="orderConfirm">
              {{ capitalize($t('order')) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="modal.confirmCreate = false"
            >
              <p>{{ $t('order_services.Do you want to order') }}: {{ getProducts.title }}</p>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script>
import { mapStores, mapState } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'
import { usePeriod } from '@/hooks/utils'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useAppStore } from '@/stores/app.js'
import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'

import selectsToCreate from '@/components/ui/selectsToCreate.vue'
import promoBlock from '@/components/ui/promo.vue'

export default {
  name: 'AcronisComponent',
  components: { passwordMeter, selectsToCreate, promoBlock },
  inject: ['checkBalance'],
  setup () {
    const { getPeriod } = usePeriod()

    return { getPeriod }
  },
  data: () => ({
    plan: undefined,
    service: undefined,
    namespace: undefined,
    provider: undefined,
    fetchLoading: false,

    options: { login: '', password: '', period: '' },
    modal: { confirmCreate: false, confirmLoading: false },
    addfunds: { visible: false, amount: 0 },

    config: {},
    cachedPlans: {},
    products: [],
    periods: [],
    activeKey: 'base',
    score: 0
  }),
  computed: {
    ...mapStores(useNamespasesStore, useSpStore, usePlansStore, useInstancesStore),
    ...mapState(useAppStore, ['onLogin']),
    ...mapState(useAuthStore, ['isLogged', 'userdata', 'billingUser', 'fetchBillingData']),
    ...mapState(useCurrenciesStore, [
      'currencies',
      'defaultCurrency',
      'unloginedCurrency',
      'fetchCurrencies'
    ]),
    getProducts () {
      if (Object.keys(this.products).length === 0) return 'NAN'
      const title = []
      const base = {}
      const adv = {}
      let price = 0

      Object.entries(this.config).forEach(([key, value]) => {
        const product = this.products[key]

        if (key.includes('_adv_') && key !== 'local_storage') adv[key] = product
        else if (key !== 'local_storage') base[key] = product

        if (value === 0) return
        title.push(`${product.meta.edition ?? product.title}: ${value}`)
        price += product.price * value
      })

      price = +(price * this.currency.rate).toFixed(2)

      return { title: title.join(', '), price, base, adv }
    },
    currency () {
      const code = this.unloginedCurrency
      const { rate } = this.currencies.find((el) =>
        el.to === code && el.from === this.defaultCurrency
      ) ?? {}

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.from === code && el.to === this.defaultCurrency
      ) ?? { rate: 1 }

      if (!this.isLogged) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: this.userdata.currency ?? this.defaultCurrency }
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

        if (!items) return type === 'acronis'
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === this.provider) {
            plans.push(plan)
          }
        })

        if (plans.length < 1) return type === 'acronis'
        return type === 'acronis' && plans.includes(uuid)
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
    },
    rules () {
      const message = this.$t('ssl_product.field is required')

      return { req: [{ required: true, message }] }
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
    plan (value) {
      const plan = this.plans.find(({ uuid }) => uuid === value)

      this.config = {}
      this.changeProducts(plan)
    }
  },
  mounted () {
    const { action, info } = this.onLogin

    if (typeof action !== 'function') return
    this.modal.goToInvoice = info.goToInvoice
    this.modal.confirmCreate = true
    this.modal.confirmLoading = true
    action()
  },
  created () {
    const promises = [
      this.fetchBillingData(),
      this.spStore.fetch(!this.isLogged),
      this.spStore.fetchShowcases(!this.isLogged)
    ]

    if (this.isLogged) {
      promises.push(
        this.namespacesStore.fetch(),
        this.instancesStore.fetch()
      )
    }

    Promise.all(promises).catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err

      if (err.response?.data?.code === 16) return
      this.$notification.error({ message: this.$t(message) })
      console.error(err)
    })

    if (this.currencies.length < 1) this.fetchCurrencies()
  },
  methods: {
    changeProducts (plan) {
      const products = []

      Object.entries(plan.products).forEach(([key, value]) => {
        this.config[key] = 0
        products.push(value)
      })

      this.products = plan.products
      this.plan = plan?.uuid

      this.periods = []
      products.forEach(({ period }) => {
        if (this.periods.includes(period)) return
        this.periods.push(period)
      })
      this.options.period = this.periods[0]
    },
    orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)

      const items = { local_storage: 1 }
      const instances = [{
        config: {
          items,
          first_name: this.billingUser.firstname,
          last_name: this.billingUser.lastname,
          mail: this.billingUser.email,
          login: this.options.login,
          password: this.options.password,
          auto_start: plan.meta.auto_start
        },
        title: this.getProducts.title,
        billing_plan: { uuid: this.plan },
        product: this.options.size
      }]

      Object.entries(this.config).forEach(([key, value]) => {
        const isNA = this.products[key].meta.measurement_unit === 'n/a'

        if (isNA && value > 0) items[key] = 0
        else if (value > 0) items[key] = value
      })

      const newGroup = {
        title: this.billingUser.fullname + Date.now(),
        type: 'acronis',
        sp: this.provider,
        instances
      }

      const info = (!this.service) ? newGroup : JSON.parse(JSON.stringify(service))
      const group = info.instancesGroups?.find(({ sp }) => sp === this.provider)

      if (group) group.instances = [...group.instances, ...instances]
      else if (this.service) info.instancesGroups.push(newGroup)

      if (!this.userdata.uuid) {
        this.onLogin.redirect = this.$route.name
        this.onLogin.info = {
          type: 'acronis',
          title: 'Acronis',
          cost: this.getProducts.price,
          currency: this.currency.code,
          goToInvoice: this.modal.goToInvoice
        }
        this.onLogin.action = () => {
          this.createAcronis(info)
        }

        this.$router.push({ name: 'login' })
        return
      }

      this.createAcronis(info)
    },
    createAcronis (info) {
      this.modal.confirmLoading = true
      const action = (this.service) ? 'update' : 'create'
      const orderData = (this.service)
        ? info
        : {
            namespace: this.namespace,
            service: {
              title: this.billingUser.fullname,
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
                  this.$notification.error({ message: error })
                })
              }
            })
          this.$notification.error({ message: this.$t(message) })
          console.error(err)
        })
    },
    orderConfirm () {
      if (Object.values(this.config).every((value) => value === 0)) {
        this.$message.error(this.$t('Please select at least one option'))
        return
      }
      if (this.options.login.length < 2) {
        this.$message.error(this.$t('login is required'))
        return
      }
      if (this.score < 4) {
        this.$message.error(this.$t('Weak pass'))
        return
      }

      if (!this.checkBalance(this.getProducts.price)) return
      this.modal.confirmCreate = true
    },
    deployService (uuid) {
      this.$api.services.up(uuid)
        .then(() => {
          this.$notification.success({ message: this.$t('Done') })
          this.$router.push({ path: '/services' })
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.$notification.error({ message: this.$t(message) })
        })
        .finally(() => {
          this.modal.confirmLoading = false
        })
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

.order .ant-slider-mark-text {
  white-space: nowrap;
}

.order .ant-slider-mark-text:first-of-type {
  transform: translateX(-10px) !important;
}

.order .ant-slider-mark-text:last-of-type {
  transform: translateX(calc(-100% + 10px)) !important;
}

.product__specs{
  --color: rgb(126, 126, 126);
  color: var(--color);
  margin: 0 auto;
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td{
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1){
  font-weight: 500;
}

.product__specs td:nth-child(2){
  text-align: right;
  color: rgba(0, 0, 0, .7)
}

.product__specs tr{
  border-bottom: var(--border-line-weight) var(--border-line-type) var(--border-color);
}

.product__specs td:last-child::before{
  content: '';
  width: 2px;
  height: 50%;
  background: #f5f5f5;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
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

.specs-enter-active,
.specs-leave-active {
  transition: all .15s ease;
}

.specs-enter-from {
  transform: translateX(-1em);
  opacity: 0;
}

.specs-leave-to{
  transform: translateX(1em);
  opacity: 0;
}

.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to{
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
