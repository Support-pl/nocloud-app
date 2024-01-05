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
      <a-col v-if="resources.ram.length > 1" :sm="{ span: 18, order: 0 }" :xs="{ span: 24, order: 1 }">
        <a-select
          style="width: 100%"
          :value="options.ram.size"
          :options="resources.ram"
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
      <a-col v-if="resources.disk.length > 1" :sm="{ span: 18, order: 0 }" :xs="{ span: 24, order: 1 }">
        <a-select
          style="width: 100%"
          :value="options.disk.size / 1024"
          :options="resources.disk"
          @update:value="setResource({ key: 'disk', value: $event * 1024 }, false)"
        />
      </a-col>
      <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
        {{ diskSize }}
      </a-col>
    </a-row>
  </template>

  <template v-else>
    <a-checkbox-group v-model:value="checkedTypes" :options="typesOptions" />
    <div class="order__grid">
      <div
        v-for="item of products"
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
          {{ allResources[item.value]?.ram[0] ?? '?' }} Gb
        </div>
        <div style="margin-top: 6px; line-height: 1.3">
          {{ $t('Drive') }}: {{ $t('from') }}
          {{ allResources[item.value]?.disk[0] ?? '?' }} Gb
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
            {{ +((allResources[item.value]?.price[0] ?? 0) * currency.rate).toFixed(2) }}
            {{ currency.code }}
          </span>
        </div>
        <a-button
          v-if="product === item.value"
          ghost
          style="display: block; margin: 5px 0 0 auto"
          @click="$router.push({ query: { ...$route.query, product } })"
        >
          {{ capitalize($t('config')) }}
        </a-button>
      </div>
    </div>
  </template>
</template>

<script setup>
import { getCurrentInstance, watch, inject, computed, ref, nextTick, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCloudStore } from '@/stores/cloud.js'
import { useCurrency } from '@/hooks/utils'

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)
const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)

const props = defineProps({
  plans: { type: Array, default: () => [] },
  products: { type: Array, required: true },
  productKey: { type: String, required: true, default: '' },
  productSize: { type: String, required: true },
  mode: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

const app = getCurrentInstance().appContext.config.globalProperties
const route = useRoute()
const i18n = useI18n()
const cloudStore = useCloudStore()

const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()
const { currency } = useCurrency()

const product = ref('')
const checkedTypes = ref([])

watch(product, (value) => {
  const product = props.products.find((item) => item.value === value)

  emits('update:product-size', product?.title)
  setResources()
})

watch(() => props.mode, () => {
  setResources(false)
})

const products = computed(() =>
  props.products.filter(({ group, datacenter }) => {
    const key = options.config.configuration.dedicated_datacenter

    if (!datacenter?.includes(key)) return false
    if (checkedTypes.value.length < 1) return true
    return checkedTypes.value.find((type) => group.includes(type))
  })
)

watch(products, (value) => {
  if (value.length < 1) return

  const dataString = (localStorage.getItem('data'))
    ? localStorage.getItem('data')
    : route.query.data ?? '{}'

  if (dataString.includes('productSize')) {
    const data = JSON.parse(dataString)

    product.value = data.productSize
  }
  nextTick(() => {
    product.value = value[1]?.value ?? value[0]?.value
  })
})

const resources = computed(() => {
  const ram = []
  const disk = []

  if (!cloudStore.plan.products) return { ram: [], disk: [] }
  getResources(ram, disk, product.value)

  return {
    ram: ram.sort((a, b) => a.value - b.value),
    disk: disk.sort((a, b) => a.value - b.value)
  }
})

const allResources = computed(() => {
  if (!cloudStore.plan.products) return {}

  return props.products.reduce((result, { value, periods }) => {
    const ram = []
    const disk = []

    getResources(ram, disk, value)

    return {
      ...result,
      [value]: {
        price: periods.map(({ price }) => price.value).sort((a, b) => a - b),
        ram: ram.sort((a, b) => a.value - b.value).map(({ label }) => label),
        disk: disk.sort((a, b) => a.value - b.value).map(({ label }) => label)
      }
    }
  }, {})
})

const typesOptions = computed(() => {
  const types = []

  props.products.forEach(({ group }) => {
    const value = group.split('-')[0]

    if (types.find((type) => type.value.includes(value))) return
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
        types.push({ value, label: app.capitalize(value) })
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

function getDisk (key) {
  const keys = key?.match(/[0-9]x[0-9]{1,}/g) ?? []

  return keys.reduce((sum, key) => {
    const [count, size] = key.split('x')

    return sum + count * size
  }, 0)
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

  const { meta: { addons } } = cloudStore.plan
    .products[`${duration} ${value}`] ?? prod[1]

  let addonKey = (addons?.some((el) => typeof el === 'string'))
    ? addons?.find((id) => id.includes(resource.value))
    : addons?.find(({ id }) => id.includes(resource.value))?.id
  let item = periods[0]
  const tarifs = []

  if (resource.key === 'ram') {
    setOptions('ram.size', parseInt(addonKey?.split(' ').at(-1).split('-')[1] ?? 0))
  }
  if (resource.key === 'disk') {
    addonKey = addons?.find((id) => {
      if (typeof id !== 'string') id = id.id
      const isDisk = id.includes('raid')

      return isDisk && (getDisk(id) * 1024) === resource.value
    })
    if (addonKey?.id) addonKey = addonKey.id

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
    [resource.key]: cloudStore.plan.resources
      .find((el) => el.key.includes(addonKey))?.price ?? 0
  })

  setOptions('config.planCode', value)
  setOptions('config.duration', item.duration)
  setOptions('config.pricingMode', item.pricingMode)
  setOptions('config.addons', [])
}

function setResources (changeTarifs = true) {
  const item = props.products.find((item) => item.value === product.value)

  setOptions('cpu.size', item.resources.cpu ?? i18n.t('ip.none'))
  setResource({ key: 'ram', value: resources.value.ram[0].value }, changeTarifs)
  setResource({ key: 'disk', value: resources.value.disk[0].value * 1024 }, false)
}

function getResources (ram, disk, value) {
  const duration = (props.mode === 'upfront12') ? 'P1Y' : 'P1M'
  const { meta: { addons } } = cloudStore.plan.products[`${duration} ${value}`] ??
    Object.values(cloudStore.plan.products)[0]

  addons?.forEach((id) => {
    if (typeof id !== 'string') id = id.id
    const resource = cloudStore.plan.resources.find(({ key }) => key === id)

    if (!resource || !resource?.public) return
    if (id.includes('ram')) {
      const value = parseInt(id.split(' ').at(-1).split('-')[1])

      if (ram.find((item) => item.value === value)) return
      ram.push({ value, label: resource.title })
    }

    if (id.includes('raid')) {
      const value = getDisk(id)

      if (disk.find((item) => item.value === value)) return
      disk.push({ value, label: resource.title })
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

.order__grid-item--active {
  background-color: var(--main);
  color: var(--bright_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr;
  }
}
</style>
