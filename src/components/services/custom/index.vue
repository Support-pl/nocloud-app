<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <h3>{{ capitalize($t('filters')) }}</h3>
        <filters-view
          v-if="Object.keys(filters).length > 0"
          :type="filtersType"
          :filters="filters"
          :resources="resources"
          @update:filter="(key, value) => filters[key] = value"
        />
        <template v-else>
          {{ capitalize($t('select group or product')) }}
        </template>

        <template v-if="isResourcesExist && Object.keys(filters).length > 0">
          {{ capitalize($t('group')) }}:
          <a-select
            v-model:value="checkedType"
            allow-clear
            style="width: 100%"
            placeholder="Select"
            :options="typesOptions.map((value) => ({ value, label: value }))"
          />
        </template>

        <a-button type="primary" style="margin-top: 10px" @click="resetFilters">
          {{ $t('Reset') }}
        </a-button>
        <a-divider v-if="viewport < 1024" style="margin: 20px 0 0" />
      </div>

      <div class="order__field order__main">
        <div class="order__option">
          <a-radio-group
            v-if="typesOptions.length > 1 && !isResourcesExist"
            class="order__radio-group"
            :style="radioGroupStyle"
            :value="checkedType"
          >
            <a-radio-button
              v-for="group of typesOptions"
              :key="group"
              :value="group"
              @click="(checkedType === group) ? checkedType = '' : checkedType = group"
            >
              <img v-if="getGroupImage(group)" :src="getGroupImage(group)" :alt="group">
              <h1 style="margin-bottom: 4px">
                {{ group }}
              </h1>
            </a-radio-button>
          </a-radio-group>

          <div v-if="sizesByPage.length > 0" class="order__grid">
            <div
              v-for="size of sizesByPage"
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

              <h1 :style="(getResources(size)) ? null : 'margin-bottom: 0'">
                {{ size.label }}
              </h1>
              <a-divider v-if="getResources(size)" style="margin: -2px 0 7px" />

              <p v-for="resource of getResources(size)" :key="resource.id">
                {{ resource.key }}: {{ resource.title }}
              </p>
            </div>
          </div>

          <transition v-if="sizesByPage.length > 0 && !isResourcesExist" name="specs" mode="out-in">
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

          <custom-pagination
            v-if="isResourcesExist"
            style="margin-top: 20px"
            :visible="filteredSizes.length > 15"
            :options="paginationOptions"
            @update:options="(key, value) => paginationOptions[key] = value"
          />
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

        <transition v-if="sizesByPage.length > 0 && isResourcesExist" name="specs" mode="out-in">
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
                {{ getProducts.price ?? 0 }} {{ currency.code }}
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
import { nextTick } from 'vue'
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
import customPagination from '@/components/ui/pagination.vue'
import filtersView from '@/components/ui/filters.vue'
import promoBlock from '@/components/ui/promo.vue'

export default {
  name: 'CustomComponent',
  components: { selectsToCreate, customPagination, filtersView, promoBlock },
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
    checkedType: '',
    filters: {},
    filtersType: 'range-with-prefixes',
    paginationOptions: { total: 0, size: 10, page: 1 },
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
      const description = (this.isResourcesExist)
        ? product.meta.description?.replace(
          /[\wА-ЯЁа-яё \-_+]{1,};/,
          '<span style="font-weight: 700">$&</span>'
        )
        : product.meta.description

      return {
        ...product,
        price: +(price * this.currency.rate).toFixed(2),
        meta: { ...product.meta, description }
      }
    },
    resources () {
      if (this.sizes.length < 2) return {}
      const result = {}

      this.sizes.forEach((size) => {
        const key = size.keys[this.options.period]
        const value = this.products[key]?.meta.resources ?? []

        value.forEach(({ key, value, group }) => {
          if (!key) return
          if (!result[key]) result[key] = []
          if (result[key].includes(group || value)) return

          result[key].push(group || value)
          result[key].sort((a, b) => {
            if (isNaN(parseFloat(a)) && isNaN(parseFloat(b))) {
              return a.localeCompare(b)
            } else if (isNaN(parseFloat(a))) {
              return -1
            } else if (isNaN(parseFloat(b))) {
              return 1
            }
            return parseFloat(a) - parseFloat(b)
          })
        })

        if (!result.$price) result.$price = []
        if (this.products[key]) {
          result.$price.push(this.products[key].price)
        }
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
        const { meta, price } = this.products[keys[this.options.period]] ?? {}
        let isIncluded = (this.typesOptions.length > 1) ? this.checkedType === group : true

        if (!keys[this.options.period]) return false
        if (!this.checkedType && this.isResourcesExist) {
          isIncluded = true
        }
        if (!meta?.resources) return isIncluded

        const groups = []
        meta?.resources?.forEach(({ group }) => {
          if (!group || groups.includes(group)) return

          groups.push(group)
        })

        const isPricesEqual = this.checkPricesEqual(price, this.filters.$price)

        return isIncluded && isPricesEqual &&
          meta?.resources?.every(({ key, value, group }) => {
            const a = this.filters[key]?.at(0) <= (group || value)
            const b = this.filters[key]?.at(-1) >= (group || value)
            const isNotNumber = this.filters[key]?.some((value) => isNaN(value))

            if (this.filters[key]?.length < 1) return true
            if (isNotNumber) {
              return this.filters[key].includes(group || value)
            }
            return (this.filters[key]) ? a && b : true
          })
      })
    },
    sizesByPage () {
      if (!this.isResourcesExist) return this.filteredSizes

      const start = this.paginationOptions.size * (this.paginationOptions.page - 1)
      const end = start + this.paginationOptions.size

      return this.filteredSizes.slice(start, end)
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
    },
    isResourcesExist () {
      return Object.values(this.products).every(
        ({ meta }) => meta.resources?.length > 0
      )
    },

    viewport () {
      return document.documentElement.offsetWidth
    },
    groupWidthStyle () {
      const count = (this.typesOptions.length > 3)
        ? 3
        : this.typesOptions.length

      return (this.viewport >= 1024) ? `calc(${100 / count}% - 10px)` : '100%'
    },
    groupWrapStyle () {
      if (this.typesOptions.length > 3) return 'wrap'
      return null
    },
    radioGroupStyle () {
      if (this.viewport < 1024) return 'margin-bottom: 15px'

      return (this.filteredSizes.length > 0) ? 'margin-bottom: 30px' : null
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
      } finally {
        this.fetchLoading = false
      }
    },
    resources (value) {
      Object.entries(value).forEach(([key, resource]) => {
        if (this.filtersType.includes('slider')) {
          this.filters[key] = [resource.at(0), resource.at(-1)]
        } else {
          this.filters[key] = []
        }
      })
    },
    sizes (value) {
      const { keys } = value?.at(0) ?? {}
      const data = JSON.parse(this.$route.query.data ?? '{}')

      if (data.productSize) {
        const { group } = this.products[data.productSize] ?? {}

        this.checkedType = group
        this.options.size = data.productSize
        return
      }

      if (keys && this.options.period) {
        this.options.size = keys[this.options.period]
      } else if (keys) {
        this.options.size = Object.values(keys)[0]
      }
    },
    filteredSizes (value) {
      this.paginationOptions.total = value.length
    },
    checkedType (value) {
      const { keys } = this.sizes.find(({ group }) => group === value) ?? {}

      if (keys && this.options.period) {
        this.options.size = keys[this.options.period]
      } else if (keys) {
        this.options.size = Object.values(keys)[0]
      }
    },
    'options.size' (value, prev) {
      const size = this.sizes.find(({ keys }) => Object.values(keys).includes(prev))
      const keys = Object.values(size?.keys ?? {})

      if (!keys.includes(value)) this.changePeriods(value)
      this.options.addons = []

      this.getProducts.addons.forEach(({ meta, key }) => {
        if (meta.autoEnable) this.options.addons.push(key)
      })

      this.plan = this.getProducts.planId
    },
    'options.period' (value) {
      const { title } = this.products[this.options.size]
      const [key, product] = Object.entries(this.products).find(([, product]) =>
        product.title === title && +product.period === value
      )
      const data = JSON.parse(this.$route.query.data ?? '{}')

      if (data.productSize) {
        const { group } = this.products[data.productSize] ?? {}

        this.checkedType = group
        this.options.size = data.productSize
      } else {
        this.options.size = key
      }

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

      const data = JSON.parse(this.$route.query.data ?? '{}')

      if (data.productSize) {
        const { group } = this.products[data.productSize] ?? {}

        this.checkedType = group
        this.options.size = data.productSize
      } else if (this.typesOptions.length < 2) {
        nextTick(() => {
          this.options.size = Object.values(this.sizes[0]?.keys ?? {})[0] ?? ''
        })
      }
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
      const data = JSON.parse(this.$route.query.data ?? '{}')

      if (data.period && this.periods.includes(+data.period)) {
        this.options.period = +data.period
      } else {
        this.options.period = this.periods[0]
      }
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
    getResources (size) {
      const key = size.keys[this.options.period]

      return this.products[key]?.meta?.resources
    },

    checkPricesEqual (price, [minPrice, maxPrice]) {
      const a = (minPrice) ? price >= minPrice : true
      const b = (maxPrice) ? price <= maxPrice : true

      return a && b
    },
    resetFilters () {
      Object.keys(this.filters).forEach((key) => {
        this.filters[key] = []
      })

      if (this.isResourcesExist) {
        this.checkedType = ''
      }
    },

    orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)
      const { resources = [] } = this.getProducts.meta

      const instances = [{
        resources: resources.reduce((result, { key, title }) => {
          result[key] = title
          return result
        }, {}),

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

          if (this.getProducts.price > 0) {
            await this.createInvoice(instance, uuid, account, this.baseURL)
          }
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
    },

    getGroupImage (group) {
      const { image } = this.sizes.find((size) => size.group === group) ?? {}

      return image
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
  grid-template-columns: 15% calc(65% - 30px) 20%;
  gap: 15px;
  width: 100%;
  max-width: 1600px;
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

.order__promo {
  grid-column: 2;
}

.order__promo img {
  height: auto;
  max-width: 100%;
  object-fit: contain;
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

.order__radio-group {
  display: flex;
  flex-wrap: v-bind(groupWrapStyle);
  gap: 15px;
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
  font-weight: 700;
}

.order__grid-item p {
  margin-bottom: 6px;
  line-height: 1.2;
}

.order__radio-group img,
.order__grid-item img {
  max-width: 50px;
  padding: 2px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
  background: #fff;
}

.order__radio-group > * {
  display: flex;
  align-items: center;
  flex-basis: v-bind(groupWidthStyle);
  height: auto;
  padding: 5px 15px;
  border-radius: 10px;
  border-inline-start-width: 1px;
  border-color: var(--border-color);
}

.order__radio-group > *::before {
  content: none;
}

.order__radio-group > :deep(* > span) {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: 100%;
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
  .order_wrapper {
    padding: 0;
  }
  .order {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .order__field {
    padding: 10px;
    box-shadow: none;
    border-radius: 20px 20px 0 0;
  }
  .order__main {
    border-radius: 0;
  }
  .order__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }
  .order__promo {
    grid-column: 1;
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
  .order__radio-group {
    flex-wrap: wrap;
    gap: 10px;
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
