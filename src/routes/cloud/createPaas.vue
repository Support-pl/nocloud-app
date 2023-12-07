<template>
  <div class="newCloud_wrapper">
    <div class="newCloud">
      <div class="newCloud__inputs order__field">
        <a-collapse
          v-model:active-key="activeKey"
          accordion
          style="border-radius: 20px"
        >
          <template v-for="(panel, key) in panelsComponents" :key="key">
            <a-collapse-panel
              v-if="panels[key].visible ?? true"
              :key="key"
              :header="panels[key].title"
              :collapsible="panels[key].disabled"
            >
              <a-row v-if="key === 'location'" justify="space-between">
                <a-col span="24">
                  <a-alert
                    v-if="!locationId"
                    show-icon
                    type="warning"
                    style="margin-bottom: 15px"
                    :message="$t('Please select a suitable location')"
                  />

                  <!-- <a-select
                    v-model="locationId"
                    :placeholder="$t('select location')"
                    style="width: 180px; position: relative; z-index: 4; margin-right: 8px"
                  >
                    <a-select-option v-for="item in locations" :key="item.id" :value="item.id">
                      {{ item.title }}
                    </a-select-option>
                  </a-select> -->

                  <a-select
                    v-model:value="showcaseId"
                    :placeholder="$t('select service')"
                    style="width: 180px; position: relative; z-index: 4"
                  >
                    <a-select-option v-for="item in showcases" :key="item.uuid">
                      {{ item.title }}
                    </a-select-option>
                  </a-select>
                </a-col>

                <a-col span="24" style="overflow: hidden; margin-top: 15px">
                  <a-spin
                    style="display: block; margin: 15px auto"
                    :tip="$t('loading')"
                    :spinning="isPlansLoading"
                  >
                    <nc-map
                      :value="locationId"
                      :markers="locations"
                      :marker-color="provider?.meta.markerColor"
                      :marker-url="provider?.meta.markerUrl"
                      @input="(value) => locationId = value"
                    />
                  </a-spin>
                </a-col>
              </a-row>

              <component
                :is="panel"
                v-else
                v-model:product-size="productSize"
                :plans="filteredPlans"
                :products="products"
                :product-key="productKey"
                :mode="mode"
                @update:periods="periods = $event"
              />
            </a-collapse-panel>
          </template>
        </a-collapse>
      </div>

      <calculator-block
        v-model:tarification="tarification"
        :filtered-plans="filteredPlans"
        :product-size="productSize"
        :periods="periods"
      />
      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script>
import { ref, reactive, provide, readonly, computed, defineAsyncComponent, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mapState, mapActions, storeToRefs } from 'pinia'
import { NcMap } from 'nocloud-ui'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useInstancesStore } from '@/stores/instances.js'
import { useCloudStore } from '@/stores/cloud.js'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'

import useProducts from '@/hooks/cloud/products.js'
import useCloudPanels from '@/hooks/cloud/panels.js'
import notification from '@/mixins/notification.js'
import { setValue } from '@/functions.js'

import loading from '@/components/ui/loading.vue'
import promoBlock from '@/components/ui/promo.vue'
import calculatorBlock from '@/components/cloud/create/calculator.vue'

export default {
  name: 'NewPaaS',
  components: {
    NcMap,
    loading,
    calculatorBlock,
    promoBlock
  },
  mixins: [notification],
  setup () {
    const router = useRouter()
    const route = useRoute()

    const spStore = useSpStore()
    const plansStore = usePlansStore()
    const cloudStore = useCloudStore()

    const isPlansLoading = ref(false)
    const dataLocalStorage = ref('')
    const productSize = ref('')
    const activeKey = ref('location')
    const periods = ref([])
    const tarification = ref('')

    const product = ref({})
    const priceOVH = reactive({ value: 0, addons: {} })
    const options = reactive({
      isSSHExist: false,
      highCPU: false,
      cpu: { size: 1, min: 1, max: 8 },
      ram: { size: 1, min: 1, max: 12 },
      disk: { type: 'SSD', step: 1, size: 1, min: 20, max: 480 },
      os: { id: -1, name: '' },
      network: {
        public: { status: true, count: 1 },
        private: { status: false, count: 0 }
      },
      config: { addons: [], configuration: {} }
    })

    const filteredPlans = computed(() => {
      const locationItem = cloudStore.locations.find(({ id }) =>
        id === cloudStore.locationId
      )

      const { items } = cloudStore.showcases.find(({ uuid }) => {
        if (cloudStore.showcaseId === '') {
          return uuid === locationItem?.showcase
        }
        return uuid === cloudStore.showcaseId
      }) ?? {}
      const plans = []

      if (!items) return plansStore.plans
      items.forEach(({ servicesProvider, plan }) => {
        if (servicesProvider === cloudStore.provider?.uuid) {
          plans.push(plan)
        }
      })

      if (plans.length < 1) return plansStore.plans
      return plansStore.plans.filter(({ uuid, type }) =>
        locationItem?.type === type && plans.includes(uuid)
      )
    })

    const { mode, productKey, products } = useProducts(options, tarification, productSize)

    const isProductExist = computed(() =>
      !route.query.product && cloudStore.plan.type?.includes('dedicated')
    )

    const components = import.meta.glob('@/components/cloud/modules/*/panels/*.vue')
    const { panels } = useCloudPanels(tarification, options, productSize)
    const panelsComponents = ref(
      Object.keys(panels.value).reduce((result, key) =>
        ({ ...result, [key]: markRaw(getComponent(key)) }), {}
      )
    )

    watch(() => cloudStore.plan.type, () => {
      panelsComponents.value = Object.keys(panels.value).reduce((result, key) =>
        ({ ...result, [key]: markRaw(getComponent(key)) }), {}
      )
    })

    function getComponent (name) {
      const result = Object.keys(components).find((key) =>
        key.includes(`/${cloudStore.plan.type}/panels/${name}.vue`)
      )

      return defineAsyncComponent(() => components[result]())
    }

    function setOptions (path, value) {
      setValue(path, value, options)
    }

    function setPrice (path, value) {
      setValue(path, value, priceOVH)
    }

    function nextStep () {
      if (activeKey.value === 'location') {
        activeKey.value = 'plan'
      } else if (activeKey.value === 'plan') {
        if (!isProductExist.value) {
          activeKey.value = 'os'
          return
        }
        router.push({ query: { ...route.query, product: productSize.value } })
      } else if (activeKey.value === 'os') {
        activeKey.value = 'addons'
      }
    }

    provide('product', readonly(product))
    provide('usePriceOVH', () => [readonly(priceOVH), setPrice])
    provide('useOptions', () => [readonly(options), setOptions])
    provide('useActiveKey', () => [readonly(activeKey), nextStep])

    return {
      isPlansLoading,
      dataLocalStorage,
      productSize,
      activeKey,
      periods,

      cachedPlans: ref({}),
      filteredPlans,
      tarification,
      products,
      productKey,
      mode,

      product,
      priceOVH,
      options,
      panels,
      panelsComponents,

      ...storeToRefs(cloudStore),
      createOrder: cloudStore.createOrder,
      nextStep
    }
  },

  computed: {
    ...mapState(useAuthStore, ['isLogged']),
    ...mapState(useCurrenciesStore, ['currencies']),
    ...mapState(useNamespasesStore, ['namespaces']),
    ...mapState(usePlansStore, ['plans']),
    ...mapState(useInstancesStore, { getServicesFull: 'services' }),

    itemService () {
      const data = this.getServicesFull.find((el) => {
        return this.serviceId === el.uuid
      })
      return data
    },
    services () {
      return this.getServicesFull.filter((el) => el.status !== 'DEL')
    },
    template () {
      if (this.provider?.type.includes('ovh')) {
        const { type = 'ovh vps' } = this.plan ?? {}
        const components = import.meta.glob('@/components/cloud/modules/*/createInstance.vue')
        const component = Object.keys(components).find((key) => key.includes(`/${type}/`))

        return defineAsyncComponent(() => components[component]())
      } else {
        return defineAsyncComponent(() => import('@/components/cloud/modules/ione/createInstance.vue'))
      }
    }
  },

  watch: {
    tarification (value) {
      if (this.plan.type === 'ione' && value) {
        const type = (value === 'Hourly') ? 'DYNAMIC' : 'STATIC'
        const item = this.filteredPlans.find(({ kind, products }) => {
          if (type === 'DYNAMIC') return kind === type
          let period = 0

          switch (value) {
            case 'Daily':
              period = 3600 * 24
              break
            case 'Annually':
              period = 3600 * 24 * 365
              break
            case 'Biennially':
              period = 3600 * 24 * 365 * 2
              break
            default:
              period = 3600 * 24 * 30
          }

          return kind === type && Object.values(products).find((el) => +el.period === period)
        })

        this.planId = item.uuid
        this.setData({ key: 'productSize', value: this.products[1] ?? this.products[0] })
      } else if (this.plan.type?.includes('cloud')) {
        setTimeout(() => {
          const period = (this.options.config.monthlyBilling) ? 'P1M' : 'P1H'
          const { planCode } = this.options.config

          this.product = {
            ...this.plan.products[`${period} ${planCode}`],
            key: `${period} ${planCode}`
          }
        }, 100)
      }
    },
    productSize (size) {
      const plan = (this.plan.kind === 'DYNAMIC' && this.plan.type === 'ione')
        ? this.plans.find((el) => el.uuid === this.plan.meta.linkedPlan)
        : this.plan

      if (!plan) return
      for (const [key, value] of Object.entries(plan.products ?? {})) {
        if (value.title === size) {
          const product = { ...value, key }

          this.options.ram.size = product.resources.ram / 1024
          this.options.cpu.size = product.resources.cpu
          this.options.disk.size = product.resources.disk ?? (plan.meta.minDisk ?? 20) * 1024
          this.product = product
        } else if (value.group === size) {
          this.product = { ...value, key }
        }
      }
    },
    periods (periods) {
      if (this.dataLocalStorage.productSize) return
      this.tarification = ''

      setTimeout(() => {
        this.tarification = periods[0]?.value ?? ''
      })
    },
    itemService (service) {
      const group = service.instancesGroups.find(({ type }) =>
        this.plan.type?.includes(type)
      ) ?? {}

      if (group.config?.ssh) this.options.isSSHExist = true
      else this.options.isSSHExist = false
    },
    locationId () {
      if (!this.dataLocalStorage.config) {
        this.options.os = { id: -1, name: '' }
      }

      if (!this.provider?.uuid) return
      if (this.cachedPlans[this.provider.uuid]) {
        this.setPlans(this.cachedPlans[this.provider.uuid])

        const { items } = this.showcases.find(({ uuid }) => uuid === this.showcaseId) ?? {}
        const { plan } = items?.find((item) => item.locations.includes(this.locationId)) ?? {}

        this.planId = plan ?? this.filteredPlans[0]?.uuid ?? ''
        return
      }

      this.isPlansLoading = true
      this.fetchPlans({
        sp_uuid: this.provider.uuid,
        anonymously: !this.isLogged
      })
        .then(({ pool }) => {
          this.cachedPlans[this.provider.uuid] = pool
          this.planId = this.filteredPlans[0]?.uuid ?? pool[0]?.uuid ?? ''

          if (this.dataLocalStorage.billing_plan) {
            this.planId = this.dataLocalStorage.billing_plan.uuid
            this.setData({ key: 'productSize', value: this.dataLocalStorage.productSize })
          } else if (this.dataLocalStorage.locationId) {
            this.tarification = this.periods[0]?.value ?? ''
          }

          this.activeKey = this.dataLocalStorage?.activeKey ?? 'plan'
          setTimeout(() => { this.activeKey = 'location' })
        })
        .finally(() => {
          this.isPlansLoading = false
        })

      const { min_drive_size: minSize, max_drive_size: maxSize } = this.provider.vars

      if (minSize) {
        this.options.disk.min = minSize.value[this.options.disk.type]
      }
      if (maxSize) {
        this.options.disk.max = maxSize.value[this.options.disk.type]
      }
    },
    plan (value) {
      if (value.meta?.minDisk) {
        this.options.disk.min = +value.meta.minDisk
      }
      if (value.meta?.maxDisk) {
        this.options.disk.max = +value.meta.maxDisk
      }
    },
    'options.os.name' () {
      if (this.plan.type !== 'ione') return
      if (this.options.disk.min > 0) return
      const { id } = this.options.os
      const { min_size: minSize } = this.provider.publicData.templates[id]

      this.options.disk.min = minSize / 1024
    },
    'options.disk.size' (value) {
      if (value / 1024 >= 200) {
        this.options.disk.step = 20
      } else if (value / 1024 >= 100) {
        this.options.disk.step = 10
      } else if (value / 1024 >= 50) {
        this.options.disk.step = 5
      } else {
        this.options.disk.step = 1
      }
    },
    activeKey () {
      setTimeout(() => {
        const { $el } = this.$refs['periods-group'] ?? {}

        if ($el?.style.gridColumn === '' && Object.keys(this.periods).length > 4) {
          if (Object.keys(this.periods).length % 3 === 1) $el.style.gridColumn = '2 / 3'
        }
      })
    },
    showcaseId () { this.setDefaultLocation() },
    locations () { this.setDefaultLocation() }
  },
  created () {
    this.showcaseId = this.$route.query.service ?? ''
    this.fetchShowcases(!this.isLogged)
    this.fetchProviders(!this.isLogged)
      .then(async () => {
        const data = localStorage.getItem('data')
        const { query } = this.$route

        if (data || ('data' in query)) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 100))
            this.dataLocalStorage = (data)
              ? JSON.parse(localStorage.getItem('data'))
              : JSON.parse(query.data)

            this.tarification = this.dataLocalStorage.tarification ?? ''
            this.authData.vmName = this.dataLocalStorage.titleVM ?? ''
            this.locationId = this.locations.find(({ id }) => {
              const locationId = this.dataLocalStorage.locationId.split('-')

              locationId.shift()
              return id.includes(locationId.join('-'))
            })?.id ?? ''
            this.activeKey = null

            if (this.dataLocalStorage.config) {
              this.options.os.id = this.dataLocalStorage.config.template_id
              this.options.os.name = this.dataLocalStorage.config.template_name
            }

            if (this.dataLocalStorage.ovhConfig) {
              this.options.config = this.dataLocalStorage.ovhConfig
            }

            if (this.dataLocalStorage.resources) {
              this.options.disk.size = this.dataLocalStorage.resources.drive_size
              this.options.disk.type = this.dataLocalStorage.resources.drive_type
            }
          } catch (e) {
            localStorage.removeItem('data')
          }
        }
      })

    if (this.isLogged) {
      Promise.all([
        this.fetchServices(),
        this.fetchNamespaces(),
        this.fetchBillingData()
      ])
        .then(() => {
          setTimeout(this.setOneService, 300)
          setTimeout(this.setOneNameSpace, 300)
        })
    }

    if (this.currencies.length < 1) this.fetchCurrencies()

    this.$router.beforeEach((to, from, next) => {
      if (
        from.path === '/cloud/newVM' &&
        localStorage.getItem('data') &&
        this.isLogged
      ) {
        if (window.confirm(this.$t('Data will be lost'))) {
          localStorage.removeItem('data')
          next()
        } else next(false)
      } else next()
    })
  },
  methods: {
    ...mapActions(useAuthStore, ['fetchBillingData']),
    ...mapActions(useCurrenciesStore, ['fetchCurrencies']),
    ...mapActions(useNamespasesStore, { fetchNamespaces: 'fetch' }),
    ...mapActions(useSpStore, {
      fetchProviders: 'fetch',
      fetchShowcases: 'fetchShowcases'
    }),
    ...mapActions(usePlansStore, { fetchPlans: 'fetch', setPlans: 'setPlans' }),
    ...mapActions(useInstancesStore, {
      fetchServices: 'fetch',
      updateService: 'updateService',
      createService: 'createService'
    }),

    onScore ({ score }) {
      this.score = score
    },
    setData ({ key, value, type }) {
      if (type === 'ovh') {
        if (key.includes('datacenter') || key.includes('os')) {
          value = { [key]: value }
        }
        if (key.includes('datacenter')) {
          const confKey = Object.keys(this.options.config.configuration)
            .find((el) => el.includes('os'))

          value[confKey] = this.options.config.configuration[confKey]
          key = 'configuration'
        }
        if (key.includes('os')) {
          const confKey = Object.keys(this.options.config.configuration)
            .find((el) => el.includes('datacenter'))

          value[confKey] = this.options.config.configuration[confKey]
          key = 'configuration'
        }

        this.options.config[key] = value
        return
      }

      if (key === 'priceOVH') {
        this.priceOVH.value = value.value
        this.priceOVH.addons = value.addons
      } else if (typeof value === 'object') {
        this[key] = Object.assign({}, value)
      } else this[key] = value

      if (key === 'type') {
        const plan = this.plans.find(({ type }) => type.includes(value))
        const products = Object.values(plan.products)
        const product = products[1] ?? products[0]

        this.planId = plan.uuid
        this.setData({ key: 'productSize', value: product.title })
      }
    },
    setOneService () {
      console.log(this.services)
      if (this.services?.length === 1) {
        this.serviceId = this.services[0].uuid
      }
    },
    setOneNameSpace () {
      if (this.namespaces.length === 1) {
        this.namespaceId = this.namespaces[0].uuid
      }
    },

    setDefaultLocation () {
      const item = this.showcases.find(({ uuid }) => uuid === this.showcaseId)
      const locationItem = this.locations.find(({ id }) =>
        id.includes(item?.promo?.main?.default)
      )

      if (!locationItem) return
      this.locationId = locationItem.id
    }
  }
}
</script>

<style>
.password.invalid {
  border: 1px solid red;
}
.location_item {
  display: flex;
  justify-content: center;
}
.ant-slider-mark-text {
  white-space: nowrap;
}
.ant-slider-mark-text:first-of-type {
  transform: translateX(-10px) !important;
}
.ant-slider-mark-text:last-of-type {
  transform: translateX(calc(-100% + 10px)) !important;
}
.newCloud_wrapper .ant-radio-button-wrapper {
  margin: 1px;
  border-radius: 4px !important;
  border-left: 1px solid #d9d9d9;
}
.newCloud_wrapper .ant-radio-button-wrapper-checked:not(
  .ant-radio-button-wrapper-disabled
 ) {
  border-left-color: #1890ff;
}
.newCloud_wrapper .ant-radio-button-wrapper:not(:first-child)::before {
  content: none;
}
.newCloud__prop {
  margin-bottom: 15px;
}
.period__wrapper {
  display: block;
  padding: 15px 0 0;
}
.vdc_plan .ant-input-number-handler-wrap {
  display: none;
}
.vdc_plan .ant-input-number-input {
  text-align: center;
}
.period__item {
  display: flex;
  justify-content: center;
  position: relative;
}
.period__discount {
  position: absolute;
  top: -22px;
  font-size: 1.1rem;
  color: var(--err);
  font-weight: bold;
}
.newCloud_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.newCloud {
  position: absolute;
  left: 50%;
  display: grid;
  grid-template-columns: calc(72% - 20px) 28%;
  grid-template-rows: auto 1fr;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  padding: 15px 0;
  transform: translateX(-50%);
}

.newCloud__change-tariff {
  color: var(--main);
  cursor: pointer;
}

.order__field {
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  background-color: var(--bright_font);
  height: max-content;
}

.newCloud__calculate {
  grid-row: 1 / 3;
  grid-column: 2;
  padding: 10px 15px 10px;
  font-size: 1.1rem;
}

.order__promo {
  grid-column: 1;
}

.field--fluid {
  width: 100%;
  padding: 10px 15px;
}

.newCloud__calculate .ant-col {
  font-size: inherit;
}
.result__title {
  font-size: 1.5rem;
  text-align: center;
  padding: 2px 0 10px;
}
.tariff__header {
  text-align: center;
  padding: 5px 0;
  font-size: 1.6rem;
}
/* .tariff__wrapper:not(:last-child){ */
.tariff__wrapper {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.tariff__nav-item {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  color: var(--main);
  opacity: 0.7;
  --step: -55px;
  cursor: pointer;
  transition: opacity 0.2s ease, font-size 0.2s ease, transform 0.2s ease;
  user-select: none;
}
.tariff__nav-item_active:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}
.tariff__nav-item_active:active {
  opacity: 1;
  transform: translateY(-50%) scale(0.8);
}
.tariff__nav-item_prev {
  left: var(--step);
}
.tariff__nav-item_next {
  right: var(--step);
}
.tariff__nav-item_disabled {
  color: rgba(0, 0, 0, 0.6);
  font-size: 2.5rem;
}
.tariff__cards {
  display: flex;
  position: relative;
}
.tariff__items {
  display: flex;
}
.tariff__sizes {
  display: flex;
  justify-content: space-between;
  /* flex-wrap: wrap; */
  overflow-x: scroll;
}
.tariff-group--title {
  font-size: 1.4rem;
  text-transform: uppercase;
  padding-left: 12px;
}
.tariff__item {
  cursor: pointer;
  width: 200px;
  /* border: 1px solid lightgray; */
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 15px;
  flex-shrink: 0;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}
.tariff__item:not(:last-of-type) {
  margin-right: 15px;
}
.tariff__title {
  background-color: var(--main);
  color: var(--bright_font);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 5px;
  font-size: 1.6rem;
}
.tariff__body {
  padding: 5px 12px 15px;
}
.tariff__body ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
}
.tariff__currency {
  font-size: 1rem;
  opacity: 0.8;
  transition: font 0.2s ease;
}
.tariff__property:hover .tariff__currency {
  opacity: 9;
  font-size: 1.1rem;
}
.tariff__property {
  margin: 10px 0;
  font-size: 1.3rem;
  text-align: center;
}
.tariff__body-value {
  margin-left: 5px;
}
.tariff__order:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.changing__field {
  font-weight: 600;
}
.newCloud__template {
  display: flex;
  flex-wrap: wrap;
  gap: 17px;
}
.newCloud__template.one-line {
  flex-wrap: nowrap;
  justify-content: space-between;
}
.ant-collapse-item:last-child > .ant-collapse-content {
  border-radius: 0 0 20px 20px;
}
.newCloud__template-item {
  background-color: var(--bright_font);
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  transition: all 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  max-width: calc(50% - 9px);
}
.newCloud__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}
.newCloud__template-item.active {
  box-shadow: 5px 8px 12px rgba(0, 0, 0, 0.08), 0px 0px 13px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
  background-color: var(--main);
  color: var(--bright_font);
}
.newCloud__template-image {
  padding: 5px 0 5px 10px;
  overflow: hidden;
}
.newCloud__template-image img {
  object-fit: cover;
  max-width: 100%;
  max-height: 80px;
}
.newCloud__template-image img::before {
  width: 16px;
  display: inline-block;
  overflow: hidden;
  height: 15px;
}
.newCloud__template-image img::after {
  content: url('/img/OS/default.png');
  display: block;
  position: absolute;
  transform: translate(-36px, -59px) scale(0.21);
  background: var(--bright_font);
  border-radius: 50%;
  transition: 0.2s;
}
.newCloud__template-name {
  padding: 10px;
  word-break: break-word;
}
.newCloud__template-item.active .newCloud__template-image img {
  padding: 2px;
  background: var(--bright_font);
  border-radius: 50%;
  transition: 0.2s;
}
.newCloud__template-item.active .newCloud__template-image img::after {
  transform: translate(-37px, -61px) scale(0.18);
  padding: 2px;
}
.ant-collapse > .ant-collapse-item:last-child {
  border-radius: 0 0 15px 15px;
}
@media screen and (max-width: 991px) {
  .newCloud {
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
  .newCloud__calculate {
    grid-column: 1;
    grid-row: 2;
    width: auto;
    border-radius: 0 0 20px 20px;
  }
  .order__promo {
    margin-top: 20px;
  }
}
@media screen and (max-width: 768px) {
  .tariff__items {
    flex-direction: column;
  }
}
@media screen and (max-width: 575px) {
  .newCloud__template-item {
    grid-template-columns: 40px 1fr;
  }
  .newCloud__template-image {
    padding: 7px 0 7px 10px;
  }
  .newCloud__template-image__rate {
    line-height: 42px;
    font-size: 1.4rem;
  }
  .newCloud__template-type {
    width: 56px;
  }
  .newCloud__template-name ul {
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1;
  }
  .newCloud__template-name ul li {
    margin-left: 20px;
  }
  .ant-form-item-label {
    line-height: inherit;
  }
}
.networkApear-enter-active,
.networkApear-leave-active {
  transition: opacity 0.5s, height 0.5s;
  height: 28px;
}
.networkApear-enter-from,
.networkApear-leave-to {
  opacity: 0;
  height: 0;
}

.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
