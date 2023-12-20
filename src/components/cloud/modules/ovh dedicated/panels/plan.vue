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
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.ram }"
          :tip-formatter="null"
          :max="resources.ram.length - 1"
          :min="0"
          :value="resources.ram.indexOf(options.ram.size)"
          @change="(i) => setOptions('ram.size', resources.ram[i])"
          @after-change="setResource({ key: 'ram', value: options.ram.size })"
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
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.disk }"
          :tip-formatter="null"
          :max="resources.disk.length - 1"
          :min="0"
          :value="resources.disk.indexOf(parseInt(diskSize))"
          @change="(i) => setOptions('disk.size', resources.disk[i] * 1024)"
          @after-change="setResource({ key: 'disk', value: options.disk.size / 1024 })"
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
        v-for="item of resources.products"
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
            {{ getCpu(item.value) ?? '?' }}
          </template>
        </div>
        <div>
          {{ $t('ram') }}: {{ $t('from') }}
          {{ allResources[item.value]?.ram[0] ?? '?' }} Gb
        </div>
        <div>
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
import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'
import { useCurrency } from '@/hooks/utils'
import api from '@/api.js'

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
const i18n = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const cloudStore = useCloudStore()

const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()
const { currency } = useCurrency()

const product = ref('')
const cpus = ref({})
const checkedTypes = ref([])

watch(product, (value) => {
  const product = props.products.find((item) => item.value === value)

  emits('update:product-size', product?.title)
  setResources()
  if (!product.resources.cpu) fetchCpu()
})

watch(() => props.mode, () => {
  setResources(false)
})

const resources = computed(() => {
  const ram = new Set()
  const disk = new Set()

  if (!cloudStore.plan.products) return { products: [], ram: [], disk: [] }
  const { value } = props.products.find((el) => el.value === product.value) ?? {}

  getResources(ram, disk, value)

  return {
    products: props.products.filter(({ group }) => {
      if (checkedTypes.value.length < 1) return true
      return checkedTypes.value.find((type) => group.includes(type))
    }),
    ram: Array.from(ram).sort((a, b) => a - b),
    disk: Array.from(disk).sort((a, b) => a - b)
  }
})

const allResources = computed(() => {
  if (!cloudStore.plan.products) return {}

  return props.products.reduce((result, { value, periods }) => {
    const ram = new Set()
    const disk = new Set()

    getResources(ram, disk, value)

    return {
      ...result,
      [value]: {
        price: periods.map(({ price }) => price.value).sort((a, b) => a - b),
        ram: Array.from(ram).sort((a, b) => a - b),
        disk: Array.from(disk).sort((a, b) => a - b)
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

watch(resources, (value) => {
  if (value.products.length < 1) return

  const dataString = (localStorage.getItem('data'))
    ? localStorage.getItem('data')
    : route.query.data ?? '{}'

  if (dataString.includes('productSize')) {
    const data = JSON.parse(dataString)

    product.value = data.productSize
  } else if (product.value === '') {
    nextTick(() => {
      product.value = value.products[1]?.value ?? value.products[0]?.value
    })
  }
})

const diskSize = computed(() => {
  const size = (options.disk.size / 1024).toFixed(1)

  return (size >= 1) ? `${size} Gb` : `${options.disk.size} Mb`
})

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

  let addonKey = addons?.find(({ id }) => id.includes(resource.value))?.id
  let item = periods[0]
  const tarifs = []

  if (resource.key === 'ram') {
    setOptions('ram.size', parseInt(addonKey?.split('-')[1] ?? 0))
  }
  if (resource.key === 'disk') {
    addonKey = addons?.find(({ id }) => {
      const isDisk = id.includes('raid')
      const [count, size] = id.split('-')[1].split('x')

      return isDisk && (count * parseInt(size)) === resource.value
    })?.id
    const [count, size] = addonKey?.split('-')[1].split('x') ?? ['0', '0']

    setOptions('disk.size', count * parseInt(size) * 1024)
    if (addonKey?.includes('hybrid')) setOptions('disk.type', 'SSD + HDD')
    else if (size.includes('sa')) setOptions('disk.type', 'HDD')
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

  setOptions('config', {
    ...options.config,
    planCode: value,
    duration: item.duration,
    pricingMode: item.pricingMode,
    addons: []
  })
}

function setResources (changeTarifs = true) {
  setResource({ key: 'ram', value: resources.value.ram[0] }, changeTarifs)
  setResource({ key: 'disk', value: resources.value.disk[0] }, false)
}

async function fetchCpu () {
  await nextTick()

  const duration = (props.mode === 'upfront12') ? 'P1Y' : 'P1M'
  const { value } = props.products.find((el) => el.value === product.value) ?? {}
  const { meta: { addons: allAddons } } = cloudStore.plan.products[`${duration} ${value}`] ??
    Object.values(cloudStore.plan.products)[0]
  const addons = []

  allAddons.forEach(({ id }) => {
    const isRamExist = addons.find((addon) => addon.includes('ram'))
    const isDiskExist = addons.find((addon) => addon.includes('raid'))

    if (id.includes('ram') && !isRamExist) addons.push(id)
    if (id.includes('raid') && !isDiskExist) addons.push(id)
  })

  setOptions('cpu.size', cpus.value[value] ?? 'loading')

  if (cpus.value[value] || !authStore.isLogged) return
  try {
    const { meta: { order: { details } } } = await api.post(
      `/sp/${cloudStore.provider.uuid}/invoke`,
      {
        method: 'checkout_baremetal',
        params: { ...options.config, addons }
      }
    )

    const cpu = details.find(({ description }) =>
      description.toLowerCase().includes('amd') ||
        description.toLowerCase().includes('intel')
    )

    cpus.value[value] = cpu?.description ?? i18n.t('No Data')
    setOptions('cpu.size', cpu?.description ?? i18n.t('No Data'))
  } catch {
    cpus.value[value] = i18n.t('No Data')
    setOptions('cpu.size', i18n.t('No Data'))
  }
}

function getResources (ram, disk, value) {
  const duration = (props.mode === 'upfront12') ? 'P1Y' : 'P1M'
  const { meta: { addons } } = cloudStore.plan.products[`${duration} ${value}`] ??
    Object.values(cloudStore.plan.products)[0]

  addons?.forEach(({ id }) => {
    const resource = cloudStore.plan.resources.find(
      ({ key }) => key === `${duration} ${value} ${id}`
    )

    if (!resource) return
    if (id.includes('ram')) {
      ram.add(parseInt(id.split('-')[1]))
    }
    if (id.includes('raid')) {
      const [count, size] = id.split('-')[1].split('x')

      disk.add(count * parseInt(size))
    }
  })
}

function getCpu (plan) {
  const { value, resources } = props.products.find((el) => el.value === plan) ?? {}

  return resources.cpu ?? cpus.value[value]
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
  grid-template-columns: repeat(3, 1fr);
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
    grid-template-columns: 1fr 1fr;
  }
}
</style>
