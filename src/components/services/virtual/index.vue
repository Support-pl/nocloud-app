<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <div class="order_option">
          <a-slider
            :marks="{ ...sizes }"
            :value="sizes.indexOf(options.size)"
            :tip-formatter="null"
            :max="sizes.length - 1"
            :min="0"
            @change="(value) => options.size = sizes[value]"
          />

          <transition name="specs" mode="out-in">
            <table v-if="getProducts.resources" :key="getProducts.title" class="product__specs">
              <tr v-for="(value, key) in getProducts.resources" :key="key">
                <td>{{ capitalize($t('virtual_product.' + key)) }}</td>
                <td>{{ (['Не ограничен', 'unlimited'].includes(value)) ? $t('virtual_product.unlimited') : value }}</td>
              </tr>
            </table>
          </transition>

          <a-form
            style="margin-top: 15px"
            :model="config"
            :rules="rules"
            :label-col="{ span: 8, xs: 6 }"
            :wrapper-col="{ span: 16, xs: 18 }"
          >
            <a-form-item name="domain" :label="capitalize($t('ssl_product.domain'))">
              <a-input
                v-if="!fetchLoading"
                v-model:value="config.domain"
                placeholder="example.com"
              />
              <div v-else class="loadingLine" />
            </a-form-item>

            <a-form-item v-if="!billingUser.email && isLogged" name="email" :label="capitalize($t('ssl_product.email'))">
              <a-input
                v-if="!fetchLoading"
                v-model:value="config.email"
                placeholder="email"
              />
              <div v-else class="loadingLine" />
            </a-form-item>
          </a-form>
        </div>
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
          :is-plans-visible="false"
        />

        <a-divider orientation="left" :style="{'margin-bottom': '0'}">
          {{ $t('Total') }}:
        </a-divider>

        <a-row type="flex" justify="space-around">
          <a-col style="font-size: 1.5rem">
            <transition name="textchange" mode="out-in">
              <template v-if="!fetchLoading">
                {{ getProducts.price * currency.rate }} {{ currency.code }}
              </template>
              <div v-else class="loadingLine loadingLine--total" />
            </transition>
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button
              block
              shape="round"
              type="primary"
              :disabled="score < 4"
              @click="orderConfirm"
            >
              {{ capitalize($t("order")) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="() => {modal.confirmCreate = false}"
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

import { usePeriod } from '@/hooks/utils'
import useCreateInstance from '@/hooks/instances/create.js'
import { checkPayg, createInvoice } from '@/functions.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'

import selectsToCreate from '@/components/ui/selectsToCreate.vue'
import promoBlock from '@/components/ui/promo.vue'

export default {
  name: 'VirtualComponent',
  components: { selectsToCreate, promoBlock },
  inject: ['checkBalance'],
  setup () {
    const { getPeriod } = usePeriod()
    const { deployService } = useCreateInstance()

    return { getPeriod, deployService, createInvoice, checkPayg }
  },
  data: () => ({
    plan: null,
    service: null,
    namespace: null,
    provider: null,
    fetchLoading: false,
    score: 0,

    cachedPlans: {},
    options: { size: '', model: '', period: '' },
    config: { domain: '', email: '' },
    modal: { confirmCreate: false, confirmLoading: false },

    products: [],
    sizes: [],
    periods: []
  }),
  computed: {
    ...mapStores(useNamespasesStore, useSpStore, usePlansStore, useInstancesStore),
    ...mapState(useAppStore, ['onLogin']),
    ...mapState(useAuthStore, ['isLogged', 'userdata', 'fetchBillingData', 'baseURL', 'billingUser']),
    ...mapState(useCurrenciesStore, [
      'currencies',
      'defaultCurrency',
      'unloginedCurrency',
      'fetchCurrencies'
    ]),
    getProducts () {
      if (Object.keys(this.products).length === 0) return 'NAN'
      if (!(this.options.size && this.options.period)) return 'NAN'
      const product = JSON.parse(JSON.stringify(
        this.products.find(({ title, period }) =>
          title === this.options.size && +period === this.options.period
        )
      ))

      delete product.resources.model
      if (`${product.resources.ssd}`.includes('Gb')) return product
      product.resources.ssd = `${product.resources.ssd / 1024} Gb`

      return product
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
    services () {
      return this.instancesStore.services.filter((el) => el.status !== 'DEL')
    },
    plans () {
      return this.cachedPlans[this.provider]?.filter(({ type, uuid }) => {
        const { items } = this.spStore.showcases.find(
          ({ uuid }) => uuid === this.$route.query.service
        ) ?? {}
        const plans = []

        if (!items) return type === 'cpanel'
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === this.provider) {
            plans.push(plan)
          }
        })

        if (plans.length < 1) return type === 'cpanel'
        return type === 'cpanel' && plans.includes(uuid)
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
      const req = { required: true, message: this.$t('ssl_product.field is required') }

      return {
        domain: [req, {
          message: this.$t('domain is wrong'),
          pattern: /.+\..+/
        }],
        email: [req, {
          message: this.$t('email is not valid'),
          pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/
        }]
      }
    }
  },
  watch: {
    billingUser (value) {
      this.config.email = value.email
    },
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
        this.plan = this.plans[0]?.uuid
        this.changeProducts()
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.$notification.error({ message })
      }
    },
    getProducts () {
      const product = this.products.find(({ title, period }) =>
        title === this.options.size && +period === this.options.period
      )

      this.options.model = product?.resources.model ?? ''
    },
    'options.size' (value) {
      this.changePeriods(value)
      this.fetchLoading = false
    },
    'options.period' (value) {
      const product = this.products.find(({ title, period }) =>
        title === this.options.size && +period === value
      )

      this.plan = this.cachedPlans[this.provider]?.find(
        ({ uuid }) => uuid === product.planId
      )?.uuid
    }
  },
  mounted () {
    this.config.email = this.billingUser.email
    const { action } = this.onLogin

    if (typeof action !== 'function') return
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

    this.fetchLoading = true
    Promise.all(promises).catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err

      if (err.response?.data?.code === 16) return
      this.$notification.error({ message: this.$t(message) })
      console.error(err)
    }).finally(() => {
      this.fetchLoading = false
    })

    if (this.currencies.length < 1) this.fetchCurrencies()
  },
  methods: {
    changeProducts () {
      const productsAndSizes = this.plans.reduce((result, plan) => {
        for (const [key, product] of Object.entries(plan.products)) {
          const i = result.sizes.findIndex(({ title }) => title === product.title)

          result.products.push({ key, ...product, planId: plan.uuid })
          if (i === -1) {
            result.sizes.push({
              title: product.title, sorter: product.sorter, price: product.price
            })
          }
        }

        return result
      }, { products: [], sizes: [] })
      productsAndSizes.sizes
        .sort((a, b) => a.price - b.price)
        .sort((a, b) => a.sorter - b.sorter)

      this.products = productsAndSizes.products
      this.sizes = productsAndSizes.sizes.map(({ title }) => title)

      const data = JSON.parse(this.$route.query.data ?? '{}')

      if (data.productSize) this.options.size = data.productSize
      else this.options.size = this.sizes[0]
    },
    changePeriods (title) {
      this.periods = []
      this.products.forEach((product) => {
        if (product.title !== title) return
        if (this.periods.includes(+product.period)) return
        this.periods.push(+product.period)
      })

      this.periods.sort((a, b) => a - b)
      const data = JSON.parse(this.$route.query.data ?? '{}')

      if (data.period && this.periods.includes(+data.period)) {
        this.options.period = +data.period
      } else {
        this.options.period = this.periods[0]
      }
    },
    orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)

      const instances = [{
        config: { ...this.config, auto_start: plan.meta.auto_start },
        resources: {
          ...this.getProducts.resources,
          ssd: `${parseFloat(this.getProducts.resources.ssd) * 1024}`,
          model: this.options.model,
          plan: this.options.model
        },
        title: this.getProducts.title,
        billing_plan: { uuid: this.plan }
      }]
      const newGroup = {
        title: this.userdata.title + Date.now(),
        type: 'cpanel',
        sp: this.provider,
        instances
      }
      const { key } = this.products.find(({ title, period }) =>
        title === this.options.size && +period === this.options.period
      )

      instances[0].product = key

      const info = (!this.service) ? newGroup : JSON.parse(JSON.stringify(service))
      const group = info.instancesGroups?.find(({ sp }) => sp === this.provider)

      if (group) group.instances = [...group.instances, ...instances]
      else if (this.service) info.instancesGroups.push(newGroup)

      if (!this.userdata.uuid) {
        this.onLogin.redirect = this.$route.name
        this.onLogin.info = {
          type: 'virtual',
          title: 'Virtual Hosting',
          cost: this.getProducts.price,
          currency: this.currency.code
        }
        this.onLogin.action = () => {
          this.createVirtual(info)
        }

        this.$router.push({ name: 'login' })
        return
      }

      this.createVirtual(info)
    },
    createVirtual (info) {
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
        .then(async ({ uuid, instancesGroups }) => {
          await this.deployService(uuid, this.$t('Done'))
          const { instances } = instancesGroups.find(({ sp }) => sp === this.provider) ?? {}
          let instance

          for (let i = instances.length - 1; i >= 0; i--) {
            const { title } = instances[i]

            if (title === this.getProducts.title) {
              instance = instances[i]
            }
          }

          if (this.namespacesStore.namespaces.length < 1) {
            await this.namespacesStore.fetch()
          }

          const { access } = this.namespacesStore.namespaces.find(
            ({ uuid }) => uuid === this.namespace
          )
          const account = access.namespace ?? this.namespace

          await this.createInvoice(instance, uuid, account, this.baseURL)
          localStorage.setItem('order', 'Invoice')
          this.$router.push({ path: '/billing' })
        })
        .catch((error) => {
          const url = error.response?.data.redirect_url ?? error.response?.data ?? error

          if (url.startsWith && url.startsWith('http')) {
            localStorage.setItem('order', 'Invoice')
            this.$router.push({ path: '/billing' })
            return
          }

          const matched = (error.response?.data?.message ?? error.message ?? '').split(/error:"|error: "/)
          const message = matched.at(-1).split('" ').at(0)

          if (message) {
            this.$notification.error({ message })
          } else {
            const message = error.response?.data?.message ?? error.message ?? error

            this.$notification.error({ message })
          }
          this.modal.confirmLoading = false
          console.error(error)
        })
    },
    orderConfirm () {
      if (!this.config.domain.match(/.+\..+/)) {
        this.$message.error(this.$t('domain is wrong'))
        return
      }

      // const regexEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/
      // if (this.config.email.match(regexEmail)) {
      //   this.$message.error(this.$t('email is not valid'))
      //   return
      // }

      const instance = {
        config: {},
        billingPlan: this.plans.find(({ uuid }) => uuid === this.plan)
      }
      const isPayg = this.checkPayg(instance)
      const { price } = this.getProducts

      if (isPayg && !this.checkBalance(price)) return
      this.modal.confirmCreate = true
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
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  margin: 0 auto;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td{
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1){
  font-weight: 500;
  color: var(--gray);
}

.product__specs td:nth-child(2){
  text-align: right;
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
  /* border: 1px solid var(--border_color); */
  box-shadow: inset 0 0 0 1px var(--border_color);
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
  .product__specs {
    width: 100%;
  }
  .product__specs td {
    padding: 3px 7px;
  }
  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
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
