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
                    v-if="!cloudStore.locationId"
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
                    v-model:value="cloudStore.showcaseId"
                    :placeholder="$t('select service')"
                    style="width: 180px; position: relative; z-index: 4"
                  >
                    <a-select-option v-for="item in cloudStore.showcases" :key="item.uuid">
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
                      :value="cloudStore.locationId"
                      :markers="cloudStore.locations"
                      :marker-color="cloudStore.provider?.meta.markerColor"
                      :marker-url="cloudStore.provider?.meta.markerUrl"
                      @input="(value) => cloudStore.locationId = value"
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
        :panels="panelsKeys"
      />
      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, provide, readonly, computed, defineAsyncComponent, watch, markRaw, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
import { useNotification } from '@/hooks/utils'
import { setValue, getTarification } from '@/functions.js'

import promoBlock from '@/components/ui/promo.vue'
import calculatorBlock from '@/components/cloud/create/calculator.vue'

const router = useRouter()
const route = useRoute()
const i18n = useI18n()
const { openNotification } = useNotification()

const authStore = useAuthStore()
const instancesStore = useInstancesStore()
const namespasesStore = useNamespasesStore()
const currenciesStore = useCurrenciesStore()

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
const cachedPlans = ref({})
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

const panelsKeys = computed(() =>
  Object.entries(panels.value)
    .filter(([, { visible }]) => visible ?? true)
    .map(([key]) => key)
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

  if (!components[result]) return {}
  return defineAsyncComponent(() => components[result]())
}

function setOptions (path, value) {
  if (/configuration.\w{1,}_/.test(path)) {
    options.config.configuration = {
      ...options.config.configuration, [path.split('.').at(-1)]: value
    }
    return
  }
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

watch(() => cloudStore.locations, setDefaultLocation)

watch(tarification, async (value) => {
  if (cloudStore.plan.type === 'ione' && value) {
    const type = (value === 'Hourly') ? 'DYNAMIC' : 'STATIC'
    const item = filteredPlans.value.find(({ kind, products }) => {
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

    cloudStore.planId = item.uuid
    productSize.value = products.value[1] ?? products.value[0]
  } else if (cloudStore.plan.type?.includes('cloud')) {
    nextTick(() => {
      const period = (options.config.monthlyBilling) ? 'P1M' : 'P1H'
      const { planCode } = options.config

      product.value = {
        ...cloudStore.plan.products[`${period} ${planCode}`],
        key: `${period} ${planCode}`
      }
    })
  } else if (cloudStore.plan.type === 'keyweb') {
    await nextTick()
    const [key] = Object.entries(cloudStore.plan.products).find(
      ([, { period, title }]) => (
        getTarification(period) === value && title === productSize.value
      )
    )

    product.value = { ...cloudStore.plan.products[key], key }
  }
})

watch(productSize, (size) => {
  const plan = (cloudStore.plan.kind === 'DYNAMIC' && cloudStore.plan.type === 'ione')
    ? plansStore.plans.find(({ uuid }) => uuid === cloudStore.plan.meta.linkedPlan)
    : cloudStore.plan

  if (!plan) return
  for (const [key, value] of Object.entries(plan.products ?? {})) {
    const isEqual = getTarification(value.period) === tarification.value

    if (value.title === size && isEqual) {
      const result = { ...value, key }

      options.ram.size = result.resources.ram / 1024
      options.cpu.size = result.resources.cpu
      options.disk.size = result.resources.disk ?? (plan.meta.minDisk ?? 20) * 1024
      product.value = result
    } else if (value.group === size) {
      product.value = { ...value, key }
    }
  }
})

watch(periods, (periods) => {
  if (dataLocalStorage.value.productSize) return
  tarification.value = ''

  setTimeout(() => {
    tarification.value = periods[0]?.value ?? ''
  })
})

watch(() => cloudStore.serviceId, (value) => {
  const service = instancesStore.services.find(({ uuid }) => uuid === value)
  const group = service.instancesGroups.find(({ type }) =>
    cloudStore.plan.type?.includes(type)
  ) ?? {}

  if (group.config?.ssh) options.isSSHExist = true
  else options.isSSHExist = false
})

watch(() => [cloudStore.locationId, spStore.servicesProviders], async () => {
  if (!dataLocalStorage.value.config) {
    options.os = { id: -1, name: '' }
  }
  options.config = { configuration: {}, addons: [] }
  priceOVH.addons = {}

  if (!cloudStore.provider?.uuid) return
  if (cachedPlans.value[cloudStore.provider.uuid]) {
    plansStore.setPlans(cachedPlans.value[cloudStore.provider.uuid])

    const { items } = cloudStore.showcases.find(
      ({ uuid }) => uuid === cloudStore.showcaseId
    ) ?? {}
    const { plan } = items?.find((item) =>
      item.locations.includes(cloudStore.locationId)
    ) ?? {}

    cloudStore.planId = plan ?? filteredPlans.value[0]?.uuid ?? ''
    return
  }

  try {
    isPlansLoading.value = true
    const { pool } = await plansStore.fetch({
      sp_uuid: cloudStore.provider.uuid,
      anonymously: !authStore.isLogged
    })

    cachedPlans.value[cloudStore.provider.uuid] = pool
    cloudStore.planId = filteredPlans.value[0]?.uuid ?? pool[0]?.uuid ?? ''

    if (dataLocalStorage.value.billing_plan) {
      cloudStore.planId = dataLocalStorage.value.billing_plan.uuid
      productSize.value = dataLocalStorage.value.productSize
    } else if (dataLocalStorage.value.locationId) {
      tarification.value = periods.value[0]?.value ?? ''
    }

    activeKey.value = dataLocalStorage.value?.activeKey ?? 'plan'
    setTimeout(() => { activeKey.value = 'location' })
  } catch (error) {
    openNotification('error', {
      message: error.response?.data.message ?? error.message ?? error
    })
  } finally {
    isPlansLoading.value = false
  }

  const { min_drive_size: minSize, max_drive_size: maxSize } = cloudStore.provider.vars

  if (minSize) {
    options.disk.min = minSize.value[options.disk.type]
  }
  if (maxSize) {
    options.disk.max = maxSize.value[options.disk.type]
  }
})

watch(() => cloudStore.plan, (value) => {
  if (value.meta?.minDisk) {
    options.disk.min = +value.meta.minDisk
  }
  if (value.meta?.maxDisk) {
    options.disk.max = +value.meta.maxDisk
  }
})

watch(() => options.os.name, () => {
  if (cloudStore.plan.type !== 'ione') return
  if (options.disk.min > 0) return
  const { id } = options.os
  const { min_size: minSize } = cloudStore.provider.publicData.templates[id]

  options.disk.min = minSize / 1024
})

watch(() => options.disk.size, (value) => {
  if (value / 1024 >= 200) {
    options.disk.step = 20
  } else if (value / 1024 >= 100) {
    options.disk.step = 10
  } else if (value / 1024 >= 50) {
    options.disk.step = 5
  } else {
    options.disk.step = 1
  }
})

function setDefaultLocation () {
  const item = cloudStore.showcases.find(({ uuid }) =>
    uuid === cloudStore.showcaseId
  )
  const locationItem = cloudStore.locations.find(({ id }) =>
    id.includes(item?.promo?.main?.default)
  )

  if (!locationItem) return
  cloudStore.locationId = locationItem.id
}

async function fetch () {
  spStore.fetchShowcases(!authStore.isLogged)
  spStore.fetch(!authStore.isLogged)
    .then(async () => {
      const data = localStorage.getItem('data') ?? route.query.data

      if (!data) return
      try {
        await nextTick()
        dataLocalStorage.value = JSON.parse(data)

        tarification.value = dataLocalStorage.value.tarification ?? ''
        cloudStore.authData.vmName = dataLocalStorage.value.titleVM ?? ''
        cloudStore.locationId = cloudStore.locations.find(({ id }) => {
          const locationId = dataLocalStorage.value.locationId.split('-')

          locationId.shift()
          return id.includes(locationId.join('-'))
        })?.id ?? ''
        activeKey.value = null

        if (dataLocalStorage.value.config) {
          options.os.id = dataLocalStorage.value.config.template_id
          options.os.name = dataLocalStorage.value.config.template_name
        }

        if (dataLocalStorage.value.ovhConfig) {
          options.config = dataLocalStorage.value.ovhConfig
        }

        if (dataLocalStorage.value.resources) {
          options.disk.size = dataLocalStorage.value.resources.drive_size
          options.disk.type = dataLocalStorage.value.resources.drive_type
        }
      } catch {
        localStorage.removeItem('data')
      }
    })

  if (authStore.isLogged) {
    const [services, namespaces] = await Promise.all([
      instancesStore.fetch(),
      namespasesStore.fetch(),
      authStore.fetchBillingData()
    ])

    if (services.pool.length === 1) {
      cloudStore.serviceId = services.pool[0].uuid
    }
    if (namespaces.pool.length === 1) {
      cloudStore.namespaceId = namespaces.pool[0].uuid
    }
  }

  if (currenciesStore.currencies.length < 1) {
    currenciesStore.fetchCurrencies()
  }
}

onUnmounted(() => {
  plansStore.setPlans([])
  cloudStore.$reset()
})

cloudStore.showcaseId = route.query.service ?? ''
router.beforeEach((_, from, next) => {
  if (
    from.path === '/cloud/newVM' &&
      localStorage.getItem('data') &&
      authStore.isLogged
  ) {
    if (window.confirm(i18n.t('Data will be lost'))) {
      localStorage.removeItem('data')
      next()
    } else next(false)
  } else next()
})
fetch()

provide('product', readonly(product))
provide('usePriceOVH', () => [readonly(priceOVH), setPrice])
provide('useOptions', () => [readonly(options), setOptions])
provide('useActiveKey', () => [readonly(activeKey), nextStep])
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
