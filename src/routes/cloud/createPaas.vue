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
              :force-render="(cloudStore.provider) ? true : false"
              :header="capitalize(panels[key].title)"
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

                  <a-select
                    v-model:value="cloudStore.showcaseId"
                    :placeholder="$t('select service')"
                    style="width: 180px; position: relative; z-index: 4; margin-right: 8px"
                  >
                    <a-select-option v-for="item in cloudStore.showcases" :key="item.uuid">
                      {{ item.title }}
                    </a-select-option>
                  </a-select>

                  <a-select
                    v-model:value="cloudStore.locationId"
                    :placeholder="$t('select location')"
                    style="width: 180px; position: relative; z-index: 4"
                  >
                    <a-select-option v-for="item in cloudStore.locations" :key="item.id">
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
                      @input="setLocation"
                    />
                  </a-spin>
                </a-col>
              </a-row>

              <component
                :is="(panel.setup) ? panel : loading"
                v-else
                v-model:product-size="productSize"
                :plans="filteredPlans"
                :products="products"
                :mode="mode"
                :is-flavors-loading="isPlansLoading"
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
import { ref, reactive, provide, readonly, computed, defineAsyncComponent, watch, markRaw, onUnmounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NcMap } from 'nocloud-ui'

import { Modal, Spin } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'
import { usePlansStore } from '@/stores/plans.js'

import useProducts from '@/hooks/cloud/products.js'
import useCloudPlans from '@/hooks/cloud/plans.js'
import useCloudOptions from '@/hooks/cloud/options.js'
import useCloudPanels from '@/hooks/cloud/panels.js'

import { setValue } from '@/functions.js'

import promoBlock from '@/components/ui/promo.vue'
import calculatorBlock from '@/components/cloud/create/calculator.vue'

const router = useRouter()
const route = useRoute()
const i18n = useI18n()

const authStore = useAuthStore()
const plansStore = usePlansStore()
const cloudStore = useCloudStore()

const loading = computed(() => h(Spin, {
  style: 'display: block; margin: 15px auto',
  tip: i18n.t('loading'),
  spinning: true
}))

const activeKey = ref('location')
const periods = ref([])
const tarification = ref('')
const priceOVH = reactive({ value: 0, addons: {} })

const { mode, products } = useProducts(tarification)
const { options, dataLocalStorage, fetch } = useCloudOptions(activeKey, tarification)
const { filteredPlans, product, productSize, isPlansLoading } = useCloudPlans(tarification, options)

watch(isPlansLoading, () => {
  if (dataLocalStorage.value.billing_plan) {
    cloudStore.planId = dataLocalStorage.value.billing_plan.uuid
  } else if (dataLocalStorage.value.locationId) {
    tarification.value = periods.value[0]?.value ?? ''
  }

  activeKey.value = dataLocalStorage.value?.activeKey ?? 'location'
})

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
  if (/configuration\.\w{1,}_/.test(path)) {
    options.config.configuration[path.split('.').at(-1)] = value
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

watch(() => [cloudStore.provider, cloudStore.locationId], () => {
  priceOVH.addons = {}
})

watch(() => cloudStore.locations, setDefaultLocation)

watch(periods, (periods) => {
  if (dataLocalStorage.value.productSize) return
  if (periods.find(({ value }) => value === tarification.value)) return
  tarification.value = periods[0]?.value ?? ''
})

function setLocation (value) {
  if (!(localStorage.getItem('data') && authStore.isLogged)) {
    cloudStore.locationId = value
    return
  }

  openModal(() => {
    cloudStore.locationId = value
  })
}

function openModal (onOk, onCancel) {
  Modal.confirm({
    title: i18n.t('disk_manage.Do you want to proceed?'),
    content: h(
      'div',
      { style: 'color: red' },
      i18n.t('Data will be lost')
    ),
    okText: i18n.t('Yes'),
    cancelText: i18n.t('Cancel'),
    onOk: () => {
      dataLocalStorage.value = ''
      localStorage.removeItem('data')
      onOk()
    },
    onCancel
  })
}

function setDefaultLocation () {
  const data = localStorage.getItem('data') ?? route.query.data
  if (data) return

  const item = cloudStore.showcases.find(({ uuid }) =>
    uuid === cloudStore.showcaseId
  )
  const locationItem = cloudStore.locations.find(({ id }) =>
    id.includes(item?.promo?.main?.default)
  )

  if (!locationItem) return
  cloudStore.locationId = locationItem.id
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
    openModal(next, () => next(false))
  } else next()
})
fetch()

provide('useProduct', () => [readonly(product)])
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
  border-radius: 4px !important;
  border-left: 1px solid var(--bright_bg);
}
.newCloud_wrapper .ant-radio-button-wrapper-checked:not(
  .ant-radio-button-wrapper-disabled
 ) {
  border-left-color: var(--main);
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

.newCloud .map_ui > .map__popup {
  color: #000;
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

.newCloud .ant-slider-horizontal .ant-slider-rail {
  width: calc(100% + 10px);
  transform: translateX(-5px);
}

.newCloud .ant-slider-horizontal .ant-slider-dot {
  width: 16px;
  height: 16px;
  inset-block-start: -6px;
  transform: translateX(-8px);
  background-color: var(--gloomy_font);
}

.newCloud .ant-slider .ant-slider-handle::after {
  background-color: var(--gloomy_font);
}

.newCloud__inputs.order__field {
  padding: 0;
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
.ant-collapse-item:last-child > .ant-collapse-content {
  border-radius: 0 0 20px 20px;
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
