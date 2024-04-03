<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <div class="order__option">
          <template v-if="typesOptions.length > 1">
            <div style="margin-bottom: 7px">
              {{ capitalize($t('filter')) }}:
            </div>
            <a-checkbox-group
              v-model:value="checkedTypes"
              style="margin-bottom: 15px"
              :options="typesOptions"
            />
          </template>

          <div v-for="(resource, key) in resources" :key="key">
            <span>{{ capitalize($t('filter')) }} {{ $t('by') }} {{ key }}:</span>
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
              :key="size.keys[options.period]"
              class="order__grid-item"
              :class="{
                'order__grid-item--active': options.size === size.keys[options.period],
                'order__grid-item--grid': size.image
              }"
              :style="(size.image) ? 'padding: 10px' : null"
              @click="options.size = size.keys[options.period]"
            >
              <img v-if="size.image" :src="size.image" :alt="size.label">
              <h1>{{ size.label }}</h1>
              <p v-for="resource of products[size.keys[options.period]]?.meta?.resources" :key="resource.id">
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

          <a-card
            v-if="fetchLoading || getProducts.addons && getProducts.addons.length > 0"
            style="margin-top: 15px"
            :title="`${$t('Addons')} (${$t('choose addons you want')})`"
            :loading="fetchLoading"
          >
            <div v-if="fetchLoading">
              Loading...
            </div>
            <template v-else>
              <a-card-grid
                v-for="addon of getProducts.addons"
                :key="addon.id"
                class="card-item"
                @click="changeAddons(addon.key)"
              >
                <div
                  class="order__slider-name"
                  style="grid-template-columns: 1fr auto auto; gap: 10px"
                >
                  <span style="font-weight: 700; font-size: 16px">
                    {{ addon.title }}
                  </span>

                  <span style="font-weight: 700">
                    {{ getPeriod(addon.period) }}
                  </span>

                  <a-checkbox :checked="options.addons.includes(addon.key)" />
                  <span style="grid-column: 1 / 4" v-html="addon.meta?.description ?? ''" />
                </div>
              </a-card-grid>
            </template>
          </a-card>
        </div>
      </div>

      <div class="order__calculate order__field">
        <a-row justify="space-around" style="margin-top: 5px">
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

        <a-row
          v-for="addon of options.addons"
          :key="addon"
          justify="space-around"
          style="margin-top: 20px"
        >
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ capitalize(getAddon(addon).title) }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12" style="font-size: 1.1rem; text-align: right">
            {{ getAddon(addon).price }} {{ currency.code }}
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

        <a-row justify="space-around">
          <a-col style="font-size: 1.5rem">
            <transition name="textchange" mode="out-in">
              <template v-if="!fetchLoading">
                {{ getProducts.price }} {{ currency.code }}
              </template>
              <div v-else class="loadingLine loadingLine--total" />
            </transition>
          </a-col>
        </a-row>

        <a-row justify="space-around" style="margin: 10px 0">
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
  name: 'CustomComponent',
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

    options: { size: '', period: '', addons: [] },
    modal: { confirmCreate: false, confirmLoading: false },

    products: {},
    sizes: [],
    periods: [],
    checkedTypes: [],
    filters: {},
    cachedPlans: {}
  }),
  computed: {
    ...mapStores(useNamespasesStore, useSpStore, usePlansStore, useInstancesStore),
    ...mapState(useAppStore, ['onLogin']),
    ...mapState(useAuthStore, ['isLogged', 'userdata', 'fetchBillingData', 'baseURL']),
    ...mapState(useCurrenciesStore, [
      'currencies',
      'defaultCurrency',
      'unloginedCurrency',
      'fetchCurrencies'
    ]),
    getProducts () {
      if (Object.keys(this.products).length === 0) return 'NAN'
      if ((this.options.size || true) === true) return 'NAN'
      if ((this.options.period ?? true) === true) return 'NAN'

      const { title } = this.products[this.options.size]
      const product = Object.values(this.products).find((product) =>
        product.title === title && +product.period === this.options.period
      )

      const price = product.price + this.options.addons.reduce(
        (sum, id) => {
          const addon = product.addons?.find(({ key }) => key === id)
          const period = addon?.period / product.period

          if (!addon) return sum
          return sum + addon.price * ((period >= 1) ? period : 1 / period)
        }, 0
      )

      return {
        ...product,
        price: +(price * this.currency.rate).toFixed(2)
      }
    },
    resources () {
      if (this.sizes.length < 2) return {}
      const result = {}

      this.sizes.forEach((size) => {
        const key = size.keys[this.options.period]
        const value = this.products[key]?.meta.resources ?? []

        value.forEach(({ key, value }) => {
          if (!key) return
          if (!result[key]) result[key] = []
          if (result[key].includes(value)) return

          result[key].push(value)
          result[key].sort((a, b) => a - b)
        })
      })

      Object.keys(result).forEach((key) => {
        if (result[key].length < 2) {
          delete result[key]
        }
      })

      return result
    },
    typesOptions () {
      const types = []

      this.sizes.forEach(({ group, label }) => {
        if (types.includes(group)) return
        types.push(group ?? label)
      })

      return types
    },
    filteredSizes () {
      return this.sizes.filter(({ group, keys }) => {
        const isIncluded = (this.checkedTypes.length > 0)
          ? this.checkedTypes.includes(group)
          : true

        const { meta } = this.products[keys[this.options.period]] ?? {}

        if (!meta?.resources) return isIncluded
        return isIncluded && meta?.resources?.every(({ key, value }) => {
          const a = this.filters[key]?.at(0) <= value
          const b = this.filters[key]?.at(-1) >= value

          return (this.filters[key]) ? a && b : true
        })
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

        if (!items) return type === 'empty'
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === this.provider) {
            plans.push(plan)
          }
        })

        if (plans.length < 1) return type === 'empty'
        return type === 'empty' && plans.includes(uuid)
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
        this.plan = this.plans[0]?.uuid
        this.changeProducts()
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.$notification.error({ message })
      }
    },
    resources (value) {
      Object.entries(value).forEach(([key, resource]) => {
        this.filters[key] = [resource.at(0), resource.at(-1)]
      })
    },
    'options.size' (value, prev) {
      const size = this.sizes.find(({ keys }) => Object.values(keys).includes(prev))
      const keys = Object.values(size?.keys ?? {})

      if (!keys.includes(value)) this.changePeriods(value)
      this.options.addons = []

      this.getProducts.addons.forEach(({ meta, key }) => {
        if (meta.autoEnable) this.options.addons.push(key)
      })

      this.fetchLoading = false
    },
    'options.period' (value) {
      const { title } = this.products[this.options.size]
      const [key, product] = Object.entries(this.products).find(([, product]) =>
        product.title === title && +product.period === value
      )

      this.options.size = key
      this.plan = this.cachedPlans[this.provider].find(
        ({ uuid }) => uuid === product.planId
      )?.uuid
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
      this.spStore.fetch(!this.isLogged),
      this.spStore.fetchShowcases(!this.isLogged)
    ]

    if (this.isLogged) {
      promises.push(
        this.namespacesStore.fetch(),
        this.instancesStore.fetch()
      )
    }

    if (this.spStore.showcases.length < 1) {
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
    changeProducts () {
      const productsAndSizes = this.plans.reduce((result, plan) => {
        for (const [key, product] of Object.entries(plan.products)) {
          const i = result.sizes.findIndex(({ label }) => label === product.title)

          if (!product.public) continue
          result.products.push([key, product, plan.uuid])

          if (i === -1) {
            result.sizes.push({
              keys: { [product.period]: key },
              label: product.title,
              group: product.group ?? product.title,
              price: product.price,
              sorter: product.sorter,
              image: product.meta.image
            })
          } else {
            result.sizes[i].keys[product.period] = key
          }
        }

        return result
      }, { products: [], sizes: [] })
      const plan = this.plans.at(0)

      productsAndSizes.products.forEach(([productKey, value, planId]) => {
        this.products[productKey] = {
          ...value,
          planId,
          addons: plan.resources.filter(({ key }) =>
            value.meta.addons?.includes(key)
          )
        }
      })

      productsAndSizes.sizes
        .sort((a, b) => a.price - b.price)
        .sort((a, b) => a.sorter - b.sorter)
      this.sizes = productsAndSizes.sizes
      this.options.size = Object.values(this.sizes[0]?.keys)[0] ?? ''
    },
    changePeriods (key) {
      const { title } = this.products[key]

      this.periods = []
      Object.values(this.products).forEach((product) => {
        if (product.title !== title) return
        if (this.periods.includes(+product.period)) return
        this.periods.push(+product.period)
      })

      this.periods.sort((a, b) => a - b)
      if (this.periods.includes(this.options.period)) return
      this.options.period = this.periods[0]
    },
    changeAddons (key) {
      if (this.options.addons.includes(key)) {
        this.options.addons = this.options.addons.filter((addon) => addon !== key)
      } else {
        this.options.addons.push(key)
      }
    },
    getAddon (addon) {
      const item = this.getProducts.addons.find(({ key }) => key === addon)
      const period = item.period / this.getProducts.period
      const price = item.price * ((period >= 1) ? period : 1 / period)

      return {
        ...item,
        price: +(price * this.currency.rate).toFixed(2)
      }
    },
    orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)

      const instances = [{
        config: {
          addons: this.options.addons,
          auto_start: plan.meta.auto_start
        },
        title: this.getProducts.title,
        billing_plan: { uuid: this.plan },
        product: this.options.size
      }]
      const newGroup = {
        title: this.userdata.title + Date.now(),
        type: 'empty',
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

          if (url.startsWith('http')) {
            localStorage.setItem('order', 'Invoice')
            this.$router.push({ path: '/billing' })
            return
          }

          const config = { namespace: this.namespace, service: orderData }
          const message = error.response?.data?.message ?? error.message ?? error

          this.$api.services.testConfig(config)
            .then(({ result, errors }) => {
              if (!result) {
                errors.forEach(({ error }) => {
                  this.$notification.error({ message: error })
                })
              }
            })
          this.$notification.error({ message: this.$t(message) })
          console.error(error)
        })
    },
    orderConfirm () {
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

<style scoped>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: 15px;
}

.order {
  display: grid;
  grid-template-columns: calc(72% - 20px) 28%;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
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

.order :deep(.ant-slider-mark-text) {
  white-space: nowrap;
}

.order :deep(.ant-slider-mark-text:first-of-type) {
  transform: translateX(-10px) !important;
}

.order :deep(.ant-slider-mark-text:last-of-type) {
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
  box-shadow: inset 0 0 0 1px var(--border_color);
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__grid-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__grid-item h1 {
  margin-bottom: 5px;
  color: inherit;
  font-size: 18px;
}

.order__grid-item p {
  margin-bottom: 6px;
  line-height: 1.2;
}

.order__grid-item img {
  max-width: 50px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
  background: #fff;
}

.order__grid-item--active {
  background-color: var(--main);
  color: var(--gloomy_font);
}

.order__grid-item--grid {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.order__option :deep(.ant-card-head) {
  background: var(--bright_bg);
}

.order__option :deep(.ant-card-body) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.order__option :deep(.ant-card-loading-content) {
  width: 100%;
}

.order__option .card-item {
  width: 100%;
  cursor: pointer;
  border: 0 solid transparent;
  background: var(--bright_bg);
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name :deep(.ant-checkbox) {
  box-shadow: 0 0 5px var(--main);
}

.order__option .order__slider-name img {
  max-height: 65px;
}

.card-item .order__slider-name {
  justify-items: start;
}

.card-item--active {
  padding: 19px;
  border: 5px solid var(--main);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr;
  }
}

.removeMarginSkeleton :deep(.ant-skeleton-title) {
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
  /* border: 1px solid var(--border_color); */
  box-shadow: inset 0 0 0 1px var(--border_color);
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
