<template>
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
        @click="$router.push({ query: { product } })"
      >
        {{ capitalize($t('config')) }}
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { getCurrentInstance, watch, inject, computed, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'
import api from '@/api.js'

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
const authStore = useAuthStore()
const cloudStore = useCloudStore()

const [options, setOptions] = inject('useOptions', () => [])()
const [, setPrice] = inject('usePriceOVH', () => [])()

const product = ref('')
const cpus = ref({})
const checkedTypes = ref([])

watch(product, (value) => {
  const product = props.products.find((item) => item.value === value)

  emits('update:product-size', product?.title)
  setResources(product?.value)
  fetchCpu()
})

watch(() => props.mode, () => {
  setResources(null, false)
})

const resources = computed(() => {
  const ram = new Set()
  const disk = new Set()

  if (!cloudStore.plan.products) return { plans: [], ram: [], disk: [] }
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
  const { value } = props.products.find((el) => el.value === plan) ?? {}

  return cpus.value[value]
}

const { extra } = cloudStore.locations
  .find(({ id }) => cloudStore.locationId.includes(id)) ?? {}

setOptions('config.configuration.dedicated_datacenter', extra.region)
</script>

<script>
export default { name: 'OvhDedicatedPlanPanel' }
</script>
