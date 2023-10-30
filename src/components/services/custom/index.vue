<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__inputs order__field">
        <div class="order__option">
          <template v-if="typesOptions.length > 1">
            <div style="margin-bottom: 7px">
              {{ $t('filter') }} {{ $t('by') }} {{ $t('groupname') }}:
            </div>
            <a-checkbox-group
              v-model:value="checkedTypes"
              style="margin-bottom: 15px"
              :options="typesOptions"
            />
          </template>

          <div v-for="(resource, key) in resources" :key="key">
            <span>{{ $t('filter') }} {{ $t('by') }} {{ key }}:</span>
            <a-slider
              range
              style="margin-top: 10px"
              :marks="{ ...resource }"
              :tip-formatter="null"
              :default-value="[0, resource.length - 1]"
              :max="resource.length - 1"
              :min="0"
              @change="([i, j]) => filters[key] = [resource[i], resource[j]]"
            />
          </div>

          <div class="order__grid">
            <div
              v-for="size of filteredSizes"
              :key="size.key"
              class="order__grid-item"
              :class="{ 'order__grid-item--active': options.size === size.key }"
              @click="options.size = size.key"
            >
              <h1>{{ size.label }}</h1>
              <p v-for="resource of products[size.key].meta?.resources" :key="resource.id">
                {{ resource.key }}: {{ resource.title }}
              </p>
            </div>
          </div>

          <transition name="specs" mode="out-in">
            <div
              v-if="typeof getProducts.meta?.description === 'string'"
              style="margin-top: 15px"
              v-html="getProducts.meta?.description"
            />
            <table v-else-if="getProducts.meta?.description" class="product__specs">
              <tr v-for="resource in getProducts.meta?.description" :key="resource.name">
                <td>{{ resource.name }}</td>
                <td>{{ resource.value }}</td>
              </tr>
            </table>
          </transition>
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

        <a-row :gutter="[10, 10]" style="margin-top: 10px">
          <a-col v-if="services.length > 1">
            <a-select v-model:value="service" style="width: 100%" placeholder="services">
              <a-select-option v-for="item of services" :key="item.uuid">
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col v-if="namespacesStore.namespaces.length > 1">
            <a-select v-model:value="namespace" style="width: 100%" placeholder="namespaces">
              <a-select-option v-for="item of namespacesStore.namespaces" :key="item.uuid">
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col v-if="plans.length > 1">
            <a-select v-model:value="plan" style="width: 100%" placeholder="plans">
              <a-select-option v-for="item of plans" :key="item.uuid">
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>
        </a-row>

        <a-divider orientation="left" :style="{'margin-bottom': '0'}">
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
              {{ capitalize($t("order")) }}
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
    </div>
  </div>
</template>

<script>
import { mapStores, mapState } from 'pinia'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useAppStore } from '@/stores/app.js'
import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'

export default {
  name: 'CustomComponent',
  inject: ['checkBalance'],
  data: () => ({
    plan: null,
    service: null,
    namespace: null,
    fetchLoading: false,

    options: { size: '', period: '' },
    modal: { confirmCreate: false, confirmLoading: false },

    products: {},
    sizes: [],
    periods: [],
    checkedTypes: [],
    filters: {}
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
      const product = this.products[this.options.size]

      return { ...product, price: +(product.price * this.currency.rate).toFixed(2) }
    },
    resources () {
      if (this.sizes.length < 2) return {}
      const result = {}

      this.sizes.forEach((size) => {
        const value = this.products[size.key].meta.resources ?? []

        value.forEach(({ key, value }) => {
          if (!result[key]) result[key] = []
          if (result[key].includes(value)) return

          result[key].push(value)
          result[key].sort((a, b) => a - b)
        })
      })

      return result
    },
    typesOptions () {
      const types = []

      Object.values(this.products).forEach(({ group, title }) => {
        if (types.includes(group)) return
        types.push(group ?? title)
      })

      return types
    },
    filteredSizes () {
      return this.sizes.filter(({ group, key }) => {
        const isIncluded = (this.checkedTypes.length > 0)
          ? this.checkedTypes.includes(group)
          : true

        const { meta } = this.products[key] ?? {}

        if (!meta?.resources) return isIncluded
        return isIncluded && meta?.resources?.every(({ key, value }) =>
          this.filters[key]?.at(0) <= value && this.filters[key]?.at(-1) >= value
        )
      })
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
      return { rate: 1, code: this.billingUser.currency_code ?? this.defaultCurrency }
    },
    services () {
      return this.instancesStore.services.filter((el) => el.status !== 'DEL')
    },
    plans () {
      return this.plansStore.plans.filter(({ type, uuid }) => {
        const { plans } = this.spStore.getShowcases.find(
          ({ uuid }) => uuid === this.$route.query.service
        ) ?? {}

        if (!plans) return type === 'empty'

        if (plans.length < 1) return type === 'empty'
        return type === 'empty' && plans.includes(uuid)
      })
    },
    sp () {
      return this.spStore.servicesProviders.find((sp) => sp.type === 'empty')
    },
    rules () {
      const message = this.$t('ssl_product.field is required')

      return { req: [{ required: true, message }] }
    }
  },
  watch: {
    'namespacesStore.namespaces' (value) { this.namespace = value[0]?.uuid },
    services (value) { this.service = value[0]?.uuid },
    plans (value) { this.plan = value[0]?.uuid },
    plan (value) {
      const plan = this.plans.find(({ uuid }) => uuid === value)

      this.changeProducts(plan)
      this.fetchLoading = false
    },
    resources (value) {
      Object.entries(value).forEach(([key, resource]) => {
        this.filters[key] = [resource.at(0), resource.at(-1)]
      })
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
    this.fetchLoading = true
    const promises = [
      this.fetchBillingData(),
      this.plansStore.fetch({ anonymously: !this.isLogged }),
      this.spStore.fetch(!this.isLogged)
    ]

    if (this.isLogged) {
      promises.push(
        this.namespacesStore.fetch(),
        this.instancesStore.fetch()
      )
    }

    if (this.spStore.getShowcases.length < 1) {
      this.spStore.fetchShowcases(!this.isLogged)
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
      const sortedProducts = Object.entries(plan?.products ?? {})

      this.products = plan?.products ?? {}
      this.plan = plan?.uuid

      sortedProducts.sort(([, a], [, b]) => a.sorter - b.sorter)
      this.sizes = sortedProducts.map(([key, value]) => ({
        key,
        label: value.title,
        group: value.group ?? value.title
      }))
      this.options.size = this.sizes[0]?.key ?? ''
      this.periods = []

      Object.values(this.products).forEach(({ period }) => {
        if (this.periods.includes(period)) return
        this.periods.push(period)
      })
      this.options.period = this.periods[0]
    },
    orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)

      const instances = [{
        config: {},
        title: this.getProducts.title,
        billing_plan: plan ?? {}
      }]
      const newGroup = {
        title: this.billingUser.fullname + Date.now(),
        type: this.sp.type,
        sp: this.sp.uuid,
        instances
      }

      if (plan.kind === 'STATIC') instances[0].product = this.options.size
      else {
        instances[0].config = {
          product: this.options.size,
          period: +this.options.period
        }
      }

      const info = (!this.service) ? newGroup : JSON.parse(JSON.stringify(service))
      const group = info.instancesGroups?.find(({ type }) => type === 'empty')

      if (group) group.instances = [...group.instances, ...instances]
      else if (this.service) info.instancesGroups.push(newGroup)

      if (!this.userdata.uuid) {
        this.onLogin.redirect = this.$route.name
        this.onLogin.info = {
          type: 'custom',
          title: 'Custom',
          cost: this.getProducts.price,
          currency: this.currency.code,
          goToInvoice: this.modal.goToInvoice
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
    },
    onError ({ target }) {
      target.src = '/img/OS/default.png'
    },
    getPeriod (timestamp) {
      const hour = 3600
      const day = hour * 24
      const month = day * 30
      const year = month * 12

      let period = ''
      let count = 0

      if (timestamp / hour < 24 && timestamp >= hour) {
        period = 'hour'
        count = timestamp / hour
      } else if (timestamp / day < 30 && timestamp >= day) {
        period = 'day'
        count = timestamp / day
      } else if (timestamp / month < 12 && timestamp >= month) {
        period = 'month'
        count = timestamp / month
      } else {
        period = 'year'
        count = timestamp / year
      }
      return this.$tc(period, Math.round(count))
    }
  }
}
</script>

<style>
.order_wrapper{
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order{
  position: absolute;
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1024px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
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

.order__inputs{
  margin-right: 20px;
  width: 72%;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.order__grid-item {
  padding: 10px 20px;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__grid-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__grid-item h1 {
  margin-bottom: 5px;
  color: inherit;
}

.order__grid-item p {
  margin-bottom: 6px;
  line-height: 1.2;
}

.order__grid-item--active {
  background-color: var(--main);
  color: var(--bright_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr;
  }
}

.order__field{
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate{
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
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
  justify-content: space-evenly;
  margin-bottom: 10px;
  overflow-x: auto;
}

.order__slider-item:not(:last-child){
  margin-right: 10px;
}

.order__slider-item{
  flex-shrink: 0;
  /* border: 1px solid rgba(0, 0, 0, .15); */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  height: 100%;
  padding: 7px 10px;
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

.loadingLine--image{
  min-width: 60px;
  width: 60px;
  height: 60px;
  margin: auto;
  margin-bottom: 15px;
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
  .order{
    flex-direction: column;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .order__inputs{
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
  }
  .order__field{
    box-shadow: none;
    flex-grow: 0;
  }
  .order__calculate{
    border-radius: 0 0 20px 20px;
    width: auto;
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
