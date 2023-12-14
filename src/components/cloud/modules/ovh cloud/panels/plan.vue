<template>
  <template v-for="(filter, key) of filtersOptions" :key="key">
    <a-row v-if="resources[key].length > 0" type="flex" justify="space-between" align="middle">
      <a-col>
        <span style="display: inline-block">
          {{ $t(filter.title) }}: ({{ filter.postfix }})
        </span>
      </a-col>

      <a-col :span="24" :md="20">
        <a-slider
          range
          style="margin-top: 10px"
          :marks="{ ...resources[key] }"
          :tip-formatter="null"
          :default-value="[0, resources[key].length - 1]"
          :max="resources[key].length - 1"
          :min="0"
          @change="([i, j]) => filters[key] = [resources[key][i], resources[key][j]]"
        />
      </a-col>
    </a-row>
  </template>

  <div class="order__grid" style="margin-top: 10px">
    <div
      v-for="item of filteredProducts"
      :key="item.title"
      class="order__grid-item"
      :class="{ 'order__grid-item--active': product === item.title }"
      @click="product = item.title"
    >
      <h1>{{ item.title }}</h1>
      <div>
        {{ $t('cpu') }}: {{ item.resources.cpu ?? '?' }}
      </div>
      <div>
        {{ $t('ram') }}: {{ item.resources.ram / 1000 ?? '?' }} Gb
      </div>
      <div>
        {{ $t('gpu') }}:
        <template v-if="item.resources.gpu_name !== ''">
          {{ item.resources.gpu_name }} (x{{ item.resources.gpu_count }})
        </template>
        <template v-else>
          {{ $t('ip.none') }}
        </template>
      </div>
      <div>
        {{ $t('Drive') }}: {{ item.resources.drive_size / 1024 ?? '?' }} Gb
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, inject, reactive, ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useCloudStore } from '@/stores/cloud.js'

const props = defineProps({
  products: { type: Array, required: true },
  mode: { type: String, required: true }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

onMounted(sortProducts)

const route = useRoute()
const cloudStore = useCloudStore()
const [options, setOptions] = inject('useOptions', () => [])()
const [, setPrice] = inject('usePriceOVH', () => [])()

const product = ref('')
const sortedProducts = ref([])
const filters = reactive({ cpu: [], ram: [], disk: [] })

watch(product, (value) => {
  const product = sortedProducts.value.find(({ title }) => title === value)

  emits('update:product-size', value)
  setResources(product?.value)
})

const filtersOptions = {
  cpu: { title: 'cpu', postfix: 'cores' },
  ram: { title: 'ram', postfix: 'Gb' },
  disk: { title: 'Drive', postfix: 'Gb' }
}

const filteredProducts = computed(() => {
  const result = []

  sortedProducts.value.forEach(({ title, value, resources }) => {
    const byCpu = resources.cpu >= filters.cpu.at(0) &&
      resources.cpu <= filters.cpu.at(-1)

    const byRam = resources.ram / 1000 >= filters.ram.at(0) &&
      resources.ram / 1000 <= filters.ram.at(-1)

    const byDisk = resources.drive_size / 1024 >= filters.disk.at(0) &&
      resources.drive_size / 1024 <= filters.disk.at(-1)

    if (byCpu && byRam && byDisk) {
      result.push({ title, value, resources })
    }
  })

  return result
})

const resources = computed(() => {
  const products = sortedProducts.value.map(({ title }) => title)
  const cpu = []
  const ram = []
  const disk = []

  sortedProducts.value.forEach(({ resources }) => {
    if (!cpu.includes(resources.cpu)) {
      cpu.push(resources.cpu)
    }
    if (!ram.includes(resources.ram / 1000)) {
      ram.push(resources.ram / 1000)
    }
    if (!disk.includes(resources.drive_size / 1024)) {
      disk.push(resources.drive_size / 1024)
    }
  })

  cpu.sort((a, b) => a - b)
  ram.sort((a, b) => a - b)
  disk.sort((a, b) => a - b)

  return { products, cpu, ram, disk }
})

watch(resources, async (value) => {
  await nextTick()
  if (value.products.length < 1) return

  filters.cpu = [value.cpu.at(0), value.cpu.at(-1)]
  filters.ram = [value.ram.at(0), value.ram.at(-1)]
  filters.disk = [value.disk.at(0), value.disk.at(-1)]

  const dataString = (localStorage.getItem('data'))
    ? localStorage.getItem('data')
    : route.query.data ?? '{}'

  if (dataString.includes('productSize')) {
    const data = JSON.parse(dataString)

    product.value = data.productSize
  } else if (product.value === '') {
    await nextTick()
    product.value = resources.value.products[1] ?? resources.value.products[0]
  }
})

watch(() => props.mode, () => {
  const plan = sortedProducts.value.find((el) => el.title === product.value)

  setResources(plan.value, false)
})

function setResources (productKey, changeTarifs = true) {
  const { periods, value, resources } = sortedProducts.value.find(
    (el) => el.value.includes(productKey)
  ) ?? {}
  if (!value) return

  const tarifs = []
  let product = periods[0]

  setOptions('cpu.size', +resources.cpu)
  setOptions('ram.size', +(resources.ram / 1000).toFixed(2))
  setOptions('disk', { size: resources.drive_size, type: 'SSD' })

  periods.forEach((period) => {
    if (period.pricingMode === props.mode) product = period
    switch (period.pricingMode) {
      case 'upfront12':
        tarifs.push({ value: 'Annually', label: 'annually' })
        break
      case 'upfront24':
        tarifs.push({ value: 'Biennially', label: 'biennially' })
        break
      case 'default':
      case 'monthly':
        tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' })
        break
      case 'hourly':
        tarifs.push({ value: 'Hourly', label: 'ssl_product.Hourly' })
    }
  })

  if (changeTarifs) emits('update:periods', tarifs)
  setPrice('value', product.price.value)
  setPrice('addons', {})

  setOptions('config', {
    ...options.config,
    planCode: value,
    monthlyBilling: (product.duration === 'P1M'),
    duration: product.duration,
    pricingMode: product.pricingMode,
    addons: []
  })
}

function sortProducts () {
  sortedProducts.value = JSON.parse(JSON.stringify(props.products))

  sortedProducts.value.sort((a, b) =>
    a.periods[0].price.value - b.periods[0].price.value
  )
}

function setDatacenter () {
  const { extra } = cloudStore.locations
    .find(({ id }) => cloudStore.locationId.includes(id)) ?? {}

  setOptions('config.configuration.cloud_datacenter', extra.region)
}

watch(() => cloudStore.locationId, setDatacenter)
setDatacenter()
</script>

<script>
export default { name: 'OvhCloudPlanPanel' }
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
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
  word-break: break-all;
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
