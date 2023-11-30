<template>
  <template v-if="plan?.uuid">
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

    <div v-if="getProducts.length > 5" class="newCloud__drive">
      <ione-drive :is-products-exist="isProductsExist" />
    </div>

    <a-slider
      v-if="getProducts.length > 1 && getProducts.length < 6"
      style="margin-top: 10px"
      :marks="{ ...getProducts }"
      :tip-formatter="null"
      :max="getProducts.length - 1"
      :min="0"
      :value="getProducts.indexOf(productSize)"
      @update:value="emits('setData', { key: 'productSize', value: getProducts[$event] })"
    />

    <div v-else class="order__grid">
      <div
        v-for="product of filteredProducts"
        :key="product"
        class="order__grid-item"
        :class="{ 'order__grid-item--active': productSize === product }"
        @click="emits('setData', { key: 'productSize', value: product })"
      >
        <h1>{{ product }}</h1>
        <div>
          {{ $t('cpu') }}: {{ getProduct(product)?.cpu ?? '?' }} vCPU
        </div>
        <div>
          {{ $t('ram') }}: {{ getProduct(product)?.ram / 1024 ?? '?' }} Gb
        </div>
      </div>
    </div>

    <a-row
      v-if="getProducts.length > 1 && getProducts.length < 6"
      class="newCloud__prop"
      justify="space-between"
      align="middle"
      :style="{ marginTop: (!getProducts.length < 2) ? null : '50px' }"
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
      v-if="getProducts.length < 6"
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

    <div v-if="getProducts.length < 6" class="newCloud__drive">
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
import { computed, inject, reactive, watch } from 'vue'
import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useCloudStore } from '@/stores/cloud.js'
import { getPeriods } from '@/functions.js'
import ioneDrive from '@/components/cloud/create/ioneDrive.vue'

const props = defineProps({
  plans: { type: Array, required: true },
  getProducts: { type: Array, required: true },
  productSize: { type: String, required: true }
})
const emits = defineEmits(['setData'])

const spStore = useSpStore()
const plansStore = usePlansStore()
const cloudStore = useCloudStore()

const [options, setOptions] = inject('useOptions')()

const filters = reactive({ cpu: [], ram: [] })
const prefixes = reactive({ cpu: 'cores', ram: 'Gb' })

emits('setData', { key: 'periods', value: getPeriods(props.plans) })
watch(() => props.plans, (value) => {
  emits('setData', { key: 'periods', value: getPeriods(value) })
})

const provider = computed(() => {
  const { sp } = cloudStore.locations.find(({ id }) =>
    id === cloudStore.locationId
  ) ?? {}

  return spStore.servicesProviders.find(({ uuid }) => uuid === sp) ?? null
})

const plan = computed(() =>
  plansStore.plans.find(({ uuid }) => uuid === cloudStore.planId)
)

const isProductsExist = computed(() =>
  props.getProducts.length > 0
)

const resources = computed(() => {
  const { highCPU, withAdministration } = provider.value?.vars ?? {}
  const cpu = []
  const ram = []

  if (props.getProducts.length < 6) return { cpu, ram }
  props.plans.forEach(({ products }) => {
    Object.values(products).forEach(({ resources, title }) => {
      if (!props.getProducts.includes(title)) return
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
      if (!props.getProducts.includes(title)) return
      const byCpu = resources.cpu >= filters.cpu.at(0) &&
        resources.cpu <= filters.cpu.at(-1)

      const byRam = Math.round(resources.ram / 1024) >= filters.ram.at(0) &&
        Math.round(resources.ram / 1024) <= filters.ram.at(-1)

      if (byCpu && byRam && !result.includes(title)) result.push(title)
    })
  })

  return result
})

function getProduct (product) {
  const products = Object.values(plan.value.products)

  return products.find(({ title }) => title === product)?.resources
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
