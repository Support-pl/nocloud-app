<template>
  <template v-if="cloudStore.plan?.uuid">
    <template v-for="(resource, key) in resources" :key="key">
      <a-row
        v-if="Array.isArray(resource) && resource.length > 0"
        justify="space-between"
        align="middle"
      >
        <a-col>{{ $t(key) }}: ({{ prefixes[key] }})</a-col>
        <a-col :span="24" :md="20">
          <a-slider
            range
            style="margin-top: 10px"
            :marks="{ ...resource }"
            :tip-formatter="null"
            :default-value="[0, resource.length - 1]"
            :max="resource.length - 1"
            :min="0"
            @change="([i, j]) => filters[key] = [resource[i], resource[j]]"
          />
        </a-col>
      </a-row>

      <div
        v-else-if="resource === true"
        style="display: inline-flex; gap: 10px; width: 50%; margin-top: 10px"
      >
        <span style="display: inline-block">{{ capitalize($t(key)) }}:</span>

        <a-switch v-model:checked="filters[key]" size="small" />
      </div>
    </template>

    <a-divider style="margin: 10px 0" />

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

    <div v-else class="order__grid">
      <div
        v-for="item of filteredProducts"
        :key="item"
        class="order__grid-item"
        :class="{ 'order__grid-item--active': productSize === item }"
        @click="setProduct(item)"
      >
        <h1>{{ item }}</h1>
        <div>
          {{ $t('cpu') }}: {{ getProduct(item)?.cpu ?? '?' }} vCPU
        </div>
        <div>
          {{ $t('ram') }}: {{ getProduct(item)?.ram / 1024 ?? '?' }} Gb
        </div>
      </div>
    </div>

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
import { useCloudStore } from '@/stores/cloud.js'
import { getPeriods, getTarification } from '@/functions.js'
import ioneDrive from '@/components/cloud/create/ioneDrive.vue'

const props = defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

const cloudStore = useCloudStore()
const [options, setOptions] = inject('useOptions')()

const filters = reactive({ cpu: [], ram: [] })
const prefixes = reactive({ cpu: 'cores', ram: 'Gb' })

emits('update:periods', getPeriods(props.productSize, props.plans))
watch(() => props.productSize, (value) => {
  emits('update:periods', getPeriods(value, props.plans))
})

if (props.products.length > 0) {
  setProduct(props.products[1] ?? props.products[0])
}

const isProductsExist = computed(() =>
  props.products.length > 0
)

const resources = computed(() => {
  const { highCPU, withAdministration } = cloudStore.provider?.vars ?? {}
  const cpu = []
  const ram = []

  if (props.products.length < 6) return { cpu, ram }
  props.plans.forEach(({ products }) => {
    Object.values(products).forEach(({ resources, title }) => {
      if (!props.products.includes(title)) return
      if (!cpu.includes(resources.cpu)) {
        cpu.push(resources.cpu)
      }
      if (!ram.includes(Math.round(resources.ram / 1024))) {
        ram.push(Math.round(resources.ram / 1024))
      }
    })
  })

  cpu.sort((a, b) => a - b)
  ram.sort((a, b) => a - b)

  return { cpu, ram, highCPU, withAdministration }
})

if (resources.value.cpu.length > 1) {
  filters.cpu = [resources.value.cpu.at(0), resources.value.cpu.at(-1)]
}

if (resources.value.ram.length > 1) {
  filters.ram = [resources.value.ram.at(0), resources.value.ram.at(-1)]
}

watch(() => resources.value.cpu, (value) => {
  filters.cpu = [value.at(0), value.at(-1)]
})

watch(() => resources.value.ram, (value) => {
  filters.ram = [value.at(0), value.at(-1)]
})

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

function getProduct (size, plan = cloudStore.plan) {
  const isDynamic = cloudStore.plan.kind === 'DYNAMIC'
  const products = Object.values(plan.products)
  const product = products.find(({ title, period }) =>
    title === size && (
      getTarification(period) === props.mode || isDynamic
    )
  )

  return product?.resources
}

async function setProduct (value) {
  emits('update:product-size', value)

  await nextTick()
  const plan = (cloudStore.plan.kind === 'DYNAMIC' && cloudStore.plan.type === 'ione')
    ? props.plans.find(({ uuid }) => uuid === cloudStore.plan.meta.linkedPlan)
    : cloudStore.plan

  if (!plan) return
  const resources = getProduct(value, plan) ?? {}

  setOptions('cpu.size', resources.cpu ?? 0)
  setOptions('ram.size', (resources.ram ?? 0) / 1024)
  setOptions('disk.size', resources.disk ?? (plan.meta.minDisk ?? 20) * 1024)
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

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 0;
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
