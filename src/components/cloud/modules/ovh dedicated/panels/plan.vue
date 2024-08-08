<template>
  <template v-if="$route.query.product">
    <left-icon
      style="margin-bottom: 10px; font-size: 20px"
      @click="$router.go(-1)"
    />

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">CPU:</span>
      </a-col>
      <a-col class="changing__field" style="text-align: right">
        <loading-icon v-if="options.cpu.size === 'loading'" />
        <template v-else>
          {{ options.cpu.size }}
        </template>
      </a-col>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">RAM:</span>
      </a-col>
      <a-col
        v-if="resources[product]?.ram.length > 1"
        :sm="{ span: 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
      >
        <a-select
          style="width: 100%"
          :value="options.ram.size"
          :options="resources[product].ram"
          @update:value="setResource({ key: 'ram', value: $event }, false)"
        />
      </a-col>
      <transition name="textchange" mode="out-in">
        <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
          {{ options.ram.size }} Gb
        </a-col>
      </transition>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">{{ $t("Drive") }}:</span>
      </a-col>
      <a-col
        v-if="resources[product]?.disk.length > 1"
        :sm="{ span: 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
      >
        <a-select
          style="width: 100%"
          :value="options.disk.size / 1024"
          :options="resources[product].disk"
          @update:value="setResource({ key: 'disk', value: $event * 1024 }, false)"
        />
      </a-col>
      <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
        {{ diskSize }}
      </a-col>
    </a-row>
  </template>

  <template v-else-if="filteredProductsByRegion.length > 0">
    <a-checkbox-group v-model:value="checkedTypes" :options="typesOptions" />
    <div class="order__grid">
      <div
        v-for="item of filteredProducts"
        :key="item.value"
        class="order__grid-item"
        :class="{ 'order__grid-item--active': product === item.value }"
        @click="product = item.value"
      >
        <h1>{{ item.title }}</h1>
        <div>
          {{ $t('cpu') }}:
          <loading-icon v-if="options.cpu.size === 'loading' && product === item.value" />
          <template v-else>
            {{ item.resources.cpu ?? '?' }}
          </template>
        </div>
        <div style="margin-top: 6px; line-height: 1.3">
          {{ $t('ram') }}: {{ $t('from') }}
          {{ resources[item.value]?.ram[0]?.label ?? '?' }}
        </div>
        <div style="margin-top: 6px; line-height: 1.3">
          {{ $t('Drive') }}: {{ $t('from') }}
          {{ resources[item.value]?.disk[0]?.label ?? '?' }}
        </div>
        <div style="margin-top: 5px">
          {{ capitalize($t('from')) }}
          <span
            :style="{
              fontSize: '18px',
              fontWeight: 700,
              color: (product === item.value) ? null : 'var(--main)'
            }"
          >
            {{ +((resources[item.value]?.prices[mode] ?? 0) * currency.rate).toFixed(2) }}
            {{ currency.code }}
          </span>
        </div>
        <a-button
          v-if="product === item.value"
          ghost
          class="config__button"
          @click="$router.push({ query: { ...$route.query, product } })"
        >
          {{ capitalize($t('config')) }}
        </a-button>
      </div>
    </div>
  </template>
  <a-alert
    v-else
    show-icon
    type="warning"
    :message="$t('No linked plans. Choose another location')"
  />
</template>

<script setup>
import { getCurrentInstance, watch, inject, computed, ref, nextTick, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useCloudStore } from '@/stores/cloud.js'
import { useAddonsStore } from '@/stores/addons.js'

import { useCurrency } from '@/hooks/utils'
import { getDisk } from '@/functions.js'

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)
const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)

const props = defineProps({
  plans: { type: Array, default: () => [] },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  mode: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

const app = getCurrentInstance().appContext.config.globalProperties
const route = useRoute()
const i18n = useI18n()
const cloudStore = useCloudStore()
const addonsStore = useAddonsStore()

const [productItem] = inject('useProduct', () => [])()
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()
const { currency } = useCurrency()

const product = ref('')
const checkedTypes = ref([])

watch(product, (value) => {
  const product = props.products.find((item) => item.value === value)

  if (!product) return
  emits('update:product-size', product?.title)
  setResources()
})

watch(() => props.mode, () => {
  setResources(false)
})

const filteredProductsByRegion = computed(() =>
  props.products.filter(({ datacenter }) => {
    const key = options.config.configuration.dedicated_datacenter

    return datacenter?.includes(key)
  })
)
const filteredProducts = computed(() =>
  filteredProductsByRegion.value.filter(({ group }) => {
    if (checkedTypes.value.length < 1) return true
    return checkedTypes.value.find(
      (type) => group.toLowerCase().includes(type.toLowerCase())
    )
  })
)

watch([filteredProducts, () => addonsStore.addons], ([products, addons]) => {
  if (products.length < 1 || addons.length < 1) {
    resetData()
    return
  }

  products.sort((a, b) =>
    a.periods[0].price.value - b.periods[0].price.value
  )

  const dataString = (localStorage.getItem('data'))
    ? localStorage.getItem('data')
    : route.query.data ?? '{}'

  if (dataString.includes('productSize')) {
    const data = JSON.parse(dataString)

    product.value = data.productSize
    return
  }

  nextTick(() => {
    product.value = products[1]?.value ?? products[0]?.value
  })
})

const resources = computed(() => {
  if (!cloudStore.plan.products) return {}

  return props.products.reduce((result, { value, periods }) => {
    const ram = []
    const disk = []
    const prices = {}

    getResources(ram, disk, value)
    for (const item of periods) {
      prices[item.pricingMode] = item.price.value
    }

    return {
      ...result,
      [value]: {
        prices,
        ram: ram.sort((a, b) => a.price - b.price),
        disk: disk.sort((a, b) => a.price - b.price)
      }
    }
  }, {})
})

const typesOptions = computed(() => {
  const types = []

  props.products.forEach(({ group, datacenter }) => {
    const value = group.split('-')[0]
    const productType = types.find((type) =>
      type.value.toLowerCase().includes(value.toLowerCase())
    )
    const key = options.config.configuration.dedicated_datacenter

    if (productType) return
    if (!datacenter?.includes(key)) return
    if (group.includes('STOR') || group.includes('SDS')) {
      types.push({ value, label: 'Storage' })
    }

    switch (value) {
      case 'HGR':
        types.push({ value, label: 'High grade' })
        break
      case 'HOST':
        types.push({ value, label: 'Hosting' })
        break
      case 'MG':
        types.push({ value, label: 'Enterprise' })
        break
      case 'FS':
        types.push({ value, label: 'Storage' })
        break
      default:
        types.push({ value, label: app.capitalize(value.toLowerCase()) })
    }
  })

  return types
})

const diskSize = computed(() => {
  const size = options.disk.size / 1024

  if (size > 1024) return `${(size / 1024).toFixed(1)} Tb`
  if (size >= 1) return `${size.toFixed(1)} Gb`
  return `${options.disk.size.toFixed(1)} Mb`
})

function resetData () {
  product.value = ''
  emits('update:product-size', '-')
  emits('update:periods', [{ value: '-', label: 'unknown' }])

  setOptions('cpu.size', 0)
  setOptions('ram.size', 0)
  setOptions('disk.size', 0)

  setPrice('value', 0)
  setPrice('addons', {})

  setOptions('config.planCode', '')
  setOptions('config.duration', '')
  setOptions('config.pricingMode', '')
  setOptions('config.addons', [])
}

async function setResource (resource, changeTarifs = true) {
  await nextTick()
  const duration = (props.mode === 'upfront12') ? 'P1Y' : 'P1M'
  const { periods, value } = props.products.find(
    (el) => el.value === product.value
  ) ?? {}
  if (!value) return

  const prod = Object.entries(cloudStore.plan.products)
    .find(([key]) => key.includes(value))

  const { addons } = cloudStore.plan.products[`${duration} ${value}`] ?? prod[1]

  let addon = addonsStore.addons.find(({ uuid, meta }) => {
    const isIncluded = addons?.includes(uuid)
    const addonId = meta.id?.toJson() ?? ''

    return isIncluded && addonId.includes(resource.value)
  })
  let addonKey = addon?.meta.id?.toJson()

  let item = periods[0]
  const tarifs = []

  if (resource.key === 'ram') {
    setOptions('ram.size', parseInt(addonKey?.split(' ').at(-1).split('-')[1] ?? 0))
  }
  if (resource.key === 'disk') {
    addon = addonsStore.addons.find(({ uuid, meta }) => {
      const isIncluded = addons?.includes(uuid)
      const addonId = meta.id?.toJson() ?? ''
      const isDisk = addonId.includes('raid')

      return isIncluded && isDisk && (getDisk(addonId) * 1024) === resource.value
    })
    addonKey = addon?.meta.id?.toJson()

    setOptions('disk.size', getDisk(addonKey) * 1024)
    if (addonKey?.includes('hybrid')) setOptions('disk.type', 'SSD + HDD')
    else if (addonKey?.match(/[0-9]x[0-9]{1,}sa/g)) setOptions('disk.type', 'HDD')
    else setOptions('disk.type', 'SSD')
  }
  if (!addons || !addonKey) return

  periods.forEach((period) => {
    if (period.pricingMode === props.mode) item = period
    switch (period.pricingMode) {
      case 'upfront12':
        tarifs.push({ value: 'Annually', label: 'annually' })
        break
      case 'upfront24':
        tarifs.push({ value: 'Biennially', label: 'biennially' })
        break
      case 'default':
        tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' })
    }
  })

  if (changeTarifs) emits('update:periods', tarifs)
  setPrice('value', item.price.value)
  setPrice('addons', {
    ...price.addons,
    [resource.key]: addon?.periods[productItem.value.period] ?? 0
  })

  setOptions('config.planCode', value)
  setOptions('config.duration', item.duration)
  setOptions('config.pricingMode', item.pricingMode)
  setOptions('config.addons', [])
}

function setResources (changeTarifs = true) {
  const item = props.products.find((item) => item.value === product.value)
  const { ram, disk } = resources.value[item.value]

  setOptions('cpu.size', item.resources.cpu ?? i18n.t('ip.none'))
  setResource({ key: 'ram', value: ram[0].value }, changeTarifs)
  setResource({ key: 'disk', value: disk[0].value * 1024 }, false)
}

function getResources (ram, disk, value) {
  const entries = Object.entries(cloudStore.plan.products)
  const { addons } = entries.find(([key]) => key.includes(value))[1]

  addons?.forEach((id) => {
    const resource = addonsStore.addons.find(({ uuid }) => uuid === id)
    const addonKey = resource?.meta.id?.toJson()

    if (!resource || !resource?.public) return
    if (addonKey.includes('ram')) {
      const value = parseInt(addonKey.split(' ').at(-1).split('-')[1])
      const i = ram.findIndex((item) => item.value === value)

      if (i !== -1) return
      ram.push({ value, label: resource.title, price: resource.price })
    }

    if (addonKey.includes('raid')) {
      const value = getDisk(addonKey)
      const i = disk.findIndex((item) => item.value === value)

      if (i !== -1) return
      disk.push({ value, label: resource.title, price: resource.price })
    }
  })
}

function setDatacenter () {
  const { extra } = cloudStore.locations
    .find(({ id }) => cloudStore.locationId.includes(id)) ?? {}

  setOptions('config.configuration.dedicated_datacenter', extra.region)
}

watch(() => cloudStore.locationId, setDatacenter)
setDatacenter()
</script>

<script>
export default { name: 'OvhDedicatedPlanPanel' }
</script>

<style scoped>
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
}

.order__grid-item--active {
  background-color: var(--main);
  color: var(--gloomy_font);
}

.config__button {
  display: block;
  margin: 5px 0 0 auto;
  color: var(--gloomy_font);
  border-color: var(--gloomy_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr;
  }
}
</style>
