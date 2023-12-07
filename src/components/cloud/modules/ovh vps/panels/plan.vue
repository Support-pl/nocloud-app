<template>
  <a-spin
    v-if="isFlavorsLoading"
    style="display: block; margin: 0 auto"
    :tip="$t('loading')"
  />
  <template v-else-if="!$route.query.product">
    <a-row
      v-if="!$route.query.product"
      style="margin-bottom: 15px"
      align="middle"
    >
      <a-col v-if="resources.products.length < 6 && resources.products.length > 1" span="24">
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.products }"
          :tip-formatter="null"
          :max="resources.products.length - 1"
          :min="0"
          :value="resources.products.indexOf(product)"
          @change="(i) => product = resources.products[i]"
        />
      </a-col>

      <a-col v-else span="24">
        <div class="order__grid">
          <div
            v-for="provider of resources.products"
            :key="provider"
            class="order__slider-item"
            :class="{ 'order__slider-item--active': product === provider }"
            @click="product = provider"
          >
            {{ provider }}
          </div>
        </div>
      </a-col>
    </a-row>

    <left-icon
      v-else-if="$route.query.product"
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
          {{ options.cpu.size }} {{ (isNaN(+options.cpu.size)) ? '' : 'vCPU' }}
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
          @after-change="setResources(productKey)"
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
          @after-change="setResources(productKey)"
        />
      </a-col>
      <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
        {{ diskSize }}
      </a-col>
    </a-row>
  </template>
</template>

<script setup>
import { ref, inject, defineAsyncComponent, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useCloudStore } from '@/stores/cloud.js'

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

const route = useRoute()
const cloudStore = useCloudStore()
const [options, setOptions] = inject('useOptions', () => [])()
const [, setPrice] = inject('usePriceOVH', () => [])()
const product = ref('')

watch(product, (value) => {
  const product = props.products.find(({ group }) => group === value)

  emits('update:product-size', value)
  setResources(product?.value)
})

watch(() => options.ram.size, async (size) => {
  await nextTick()
  const plan = props.products.find(({ value }) => value === props.productKey)

  if (plan) return
  const { resources } = props.products.find((el) =>
    el.group === product.value && el.resources.ram / 1024 === size
  ) ?? {}

  setOptions('disk.size', resources.disk)
})

watch(() => options.disk.size, async (size) => {
  await nextTick()
  const plan = props.products.find(({ value }) => value === props.productKey)

  if (plan) return
  const { resources } = props.products.find((el) =>
    el.group === product.value && el.resources.disk === size
  ) ?? {}

  setOptions('ram.size', resources.ram / 1024)
})

watch(() => props.mode, () => {
  setResources(props.productKey, false)
})

const resources = computed(() => {
  const groups = new Set(props.products.map(({ group }) => group))

  const ram = new Set()
  const disk = new Set()

  const filteredPlans = props.products.filter(({ group }) => group === product.value)

  filteredPlans.forEach(({ resources }) => {
    ram.add(resources.ram / 1024)
    disk.add(resources.disk / 1024)
  })

  return {
    products: Array.from(groups),
    ram: Array.from(ram).sort((a, b) => a - b),
    disk: Array.from(disk).sort((a, b) => a - b)
  }
})

watch(resources, (value) => {
  if (value.length < 1) return

  const dataString = (localStorage.getItem('data'))
    ? localStorage.getItem('data')
    : route.query.data ?? '{}'

  if (dataString.includes('productSize')) {
    const data = JSON.parse(dataString)

    product.value = data.productSize
  } else if (product.value === '') {
    setTimeout(() => {
      product.value = resources.value.products[1] ?? resources.value.products[0]
    })
  }
})

const diskSize = computed(() => {
  const size = (options.disk.size / 1024).toFixed(1)

  return (size >= 1) ? `${size} Gb` : `${options.disk.size} Mb`
})

function setResources (productKey, changeTarifs = true) {
  const { periods, value, resources } = props.products.find((el) => el.value === productKey) ?? {}
  if (!value) return

  const tarifs = []
  let product = periods[0]

  setOptions('cpu.size', +resources.cpu)
  setOptions('ram.size', resources.ram / 1024)
  setOptions('disk.size', +resources.disk)
  setOptions('disk.type', 'SSD')

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
        tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' })
    }
  })

  if (changeTarifs) emits('update:periods', tarifs)
  setPrice('value', product.price.value)
  setPrice('addons', {})

  setOptions('config.planCode', value)
  setOptions('config.duration', product.duration)
  setOptions('config.pricingMode', product.pricingMode)
  setOptions('config.addons', [])
}

const { extra } = cloudStore.locations
  .find(({ id }) => cloudStore.locationId.includes(id)) ?? {}

setOptions('config.configuration.vps_datacenter', extra.region)
</script>

<script>
export default { name: 'OvhVpsPlanPanel' }
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  font-size: 1.1rem;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--bright_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
