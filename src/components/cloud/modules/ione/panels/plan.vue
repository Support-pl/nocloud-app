<template>
  <template v-if="cloudStore.plan?.uuid">
    <div v-show="false">
      <ione-filters
        :products="products"
        :plans="plans"
        @update:filter="(key, value) => filters[key] = value"
      />
      <a-divider style="margin: 10px 0" />
    </div>

    <ione-products
      v-if="products.length > 5"
      :type="(groups.length > 1) ? 'slider' : 'grid'"
      :products="filteredProducts"
      :product-size="productSize"
      :get-product="getProduct"
      @update:product="setProduct"
    />

    <div v-if="products.length > 5" class="newCloud__drive">
      <ione-drive :is-products-exist="isProductsExist" />
    </div>

    <a-slider
      v-if="products.length > 1 && products.length < 6"
      style="margin-top: 10px"
      :marks="{ ...products }"
      :tip-formatter="null"
      :max="products.length - 1"
      :min="0"
      :value="products.indexOf(productSize)"
      @update:value="setProduct(products[$event])"
    />

    <a-row
      v-if="products.length < 6"
      class="newCloud__prop"
      justify="space-between"
      align="middle"
      :style="{ marginTop: (!products.length < 2) ? null : '50px' }"
    >
      <a-col> <span style="display: inline-block; width: 70px">CPU:</span> </a-col>
      <transition name="textchange" mode="out-in">
        <a-col class="changing__field" span="6" style="text-align: right">
          <template v-if="isProductsExist">
            {{ options.cpu.size }} vCPU
          </template>

          <template v-else>
            <a-input-number
              allow-clear
              :value="options.cpu.size"
              :min="0"
              :max="32"
              @update:value="setOptions('cpu.size', $event)"
            /> vCPU
          </template>
        </a-col>
      </transition>
    </a-row>

    <a-row
      v-if="products.length < 6"
      class="newCloud__prop"
      justify="space-between"
      align="middle"
    >
      <a-col> <span style="display: inline-block; width: 70px">RAM:</span> </a-col>
      <transition name="textchange" mode="out-in">
        <a-col class="changing__field" span="6" style="text-align: right">
          <template v-if="isProductsExist">
            {{ +options.ram.size.toFixed(1) }} Gb
          </template>

          <template v-else>
            <a-input-number
              allow-clear
              :value="options.ram.size"
              :min="0"
              :max="64"
              @update:value="setOptions('ram.size', $event)"
            /> Gb
          </template>
        </a-col>
      </transition>
    </a-row>

    <div v-if="products.length < 6" class="newCloud__drive">
      <ione-drive :is-products-exist="isProductsExist" />
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
import { computed, inject, nextTick, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCloudStore } from '@/stores/cloud.js'
import { getPeriods, getTarification } from '@/functions.js'

import ioneDrive from '@/components/cloud/create/ioneDrive.vue'
import ioneFilters from '@/components/cloud/create/ioneFilters.vue'
import ioneProducts from '@/components/cloud/create/ioneProducts.vue'

const props = defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

const route = useRoute()
const cloudStore = useCloudStore()
const [options, setOptions] = inject('useOptions')()

emits('update:periods', getPeriods(props.productSize, props.plans))
watch(() => props.productSize, (value) => {
  const product = getProduct(value)

  nextTick(() => {
    if (product?.meta?.minDiskSize) {
      setOptions('disk.size', product.meta.minDiskSize * 1024)
      setOptions('disk.min', product.meta.minDiskSize)
    }
    if (product?.meta?.maxDiskSize) {
      setOptions('disk.max', product.meta.maxDiskSize)
    }
  })

  emits('update:periods', getPeriods(value, props.plans))
})

const data = localStorage.getItem('data') ?? route.query.data

if (props.products.length > 0) {
  const { productSize } = JSON.parse(data ?? '{}')

  if (productSize) setProduct(productSize)
  else if (props.products.length < 6) {
    setProduct(props.products[1] ?? props.products[0])
  }
}

const isProductsExist = computed(() =>
  props.products.length > 0
)
const filters = reactive({ cpu: [], ram: [] })

const filteredProducts = computed(() => {
  const result = []

  props.plans.forEach(({ products }) => {
    Object.values(products).forEach(({ resources, title }) => {
      if (!props.products.includes(title)) return
      const byCpu = resources.cpu >= filters.cpu.at(0) &&
        resources.cpu <= filters.cpu.at(-1)

      const byRam = Math.round(resources.ram / 1024) >= filters.ram.at(0) &&
        Math.round(resources.ram / 1024) <= filters.ram.at(-1)

      if (byCpu && byRam && !result.includes(title)) result.push(title)
    })
  })

  result.sort((a, b) => props.products.indexOf(a) - props.products.indexOf(b))
  return result
})

const groups = computed(() =>
  filteredProducts.value.reduce((result, product) => {
    const resources = getProduct(product)

    if (!resources.group) return result
    if (!result.includes(resources.group)) {
      result.push(resources.group)
    }

    return result
  }, [])
)

function getProduct (size, plan = cloudStore.plan) {
  const isDynamic = cloudStore.plan.kind === 'DYNAMIC'
  const products = Object.values(plan.products)
  const product = products.find(({ title, period }) =>
    title === size && (
      getTarification(period) === props.mode || isDynamic
    )
  )

  return { ...product?.resources, group: product?.group, meta: product?.meta }
}

async function setProduct (value) {
  emits('update:product-size', value)

  await nextTick()
  const plan = (cloudStore.plan.kind === 'DYNAMIC' && cloudStore.plan.type === 'ione')
    ? props.plans.find(({ uuid }) => uuid === cloudStore.plan.meta.linkedPlan)
    : cloudStore.plan

  if (!plan) return
  const resources = getProduct(value, plan) ?? {}
  const minDisk = (plan.meta.minDiskSize ?? {})[options.disk.type]

  setOptions('cpu.size', resources.cpu ?? 0)
  setOptions('ram.size', (resources.ram ?? 0) / 1024)
  setOptions('disk.size', resources.disk ?? (minDisk ?? 20) * 1024)
}
</script>

<script>
export default { name: 'IonePlanPanel' }
</script>

<style scoped>
.newCloud__drive {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 10px;
}
</style>
