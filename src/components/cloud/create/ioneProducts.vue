<template>
  <div v-if="type === 'slider'">
    <a-slider
      :marks="{ ...groups }"
      :tip-formatter="null"
      :max="groups.length - 1"
      :min="0"
      :value="groups.indexOf(group)"
      @change="(i) => group = groups[i]"
    />

    <a-row
      v-for="slider of sliders"
      :key="slider.key"
      class="newCloud__prop"
      justify="space-between"
      align="middle"
    >
      <a-col v-if="slider.key === 'cpu' && isHighCPUExist" class="hcpu-block">
        <span style="display: inline-block">{{ slider.prefix }}</span>
        <a-badge>
          <template #count>
            <span>
              <a-tooltip :title="$t('highCPU')">
                <question-circle-icon style="color: #ff9140" />
              </a-tooltip>
            </span>
          </template>

          <a-switch
            checked-children="hCPU"
            un-checked-children="CPU"
            :checked="options.highCPU"
            @click="setOptions('highCPU', !options.highCPU)"
          />
        </a-badge>
      </a-col>

      <a-col v-else>
        <span style="display: inline-block; width: 75px">{{ slider.prefix }}</span>
      </a-col>

      <a-col
        v-if="resources[slider.key].length > 1"
        :sm="{ span: (slider.key === 'cpu') ? 16 : 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
        :style="(slider.key === 'cpu') ? 'margin-left: auto' : null"
      >
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources[slider.key] }"
          :tip-formatter="null"
          :max="resources[slider.key].length - 1"
          :min="0"
          :value="resources[slider.key].indexOf(options[slider.key].size)"
          @change="(i) => setOptions(`${slider.key}.size`, resources[slider.key][i])"
          @after-change="setProductByResources"
        />
      </a-col>
      <transition name="textchange" mode="out-in">
        <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
          {{ options[slider.key].size }} {{ slider.postfix }}
        </a-col>
      </transition>
    </a-row>
  </div>

  <div v-else class="order__grid">
    <div
      v-for="item of products"
      :key="item"
      class="order__grid-item"
      :class="{ 'order__grid-item--active': productSize === item }"
      @click="emits('update:product', item)"
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
</template>

<script setup>
import { defineAsyncComponent, watch, nextTick, ref, computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { usePlansStore } from '@/stores/plans.js'

const questionCircleIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/QuestionCircleOutlined')
)

const props = defineProps({
  type: { type: String, default: 'grid' },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  getProduct: { type: Function, default: (item) => item }
})
const emits = defineEmits(['update:product'])

const route = useRoute()
const plansStore = usePlansStore()
const [options, setOptions] = inject('useOptions')()

const sliders = computed(() => [
  { key: 'cpu', prefix: 'CPU:', postfix: (options.highCPU) ? 'hCPU' : 'vCPU' },
  { key: 'ram', prefix: 'RAM:', postfix: 'Gb' }
])

const group = ref('')
const groups = computed(() =>
  props.products.reduce((result, product) => {
    const resources = props.getProduct(product)

    if (!resources.group) return result
    if (!result.includes(resources.group)) {
      result.push(resources.group)
    }

    return result
  }, [])
)
const data = localStorage.getItem('data') ?? route.query.data
const { productSize: size } = JSON.parse(data ?? '{}')

if (groups.value.length > 1) {
  const { group: productGroup } = props.getProduct(size)

  group.value = productGroup ?? groups.value[1] ?? groups.value[0]
  if (size) nextTick(() => emits('update:product', size))
} else if (props.products.length > 0 && !size) {
  emits('update:product', props.products[1] ?? props.products[0])
}

watch(groups, (value) => {
  if (value.includes(group.value)) return
  group.value = value[1] ?? value[0] ?? group.value
})
watch(group, setProduct)

watch(() => props.products, (value) => {
  if (groups.value.length < 2 && value.length > 0) {
    emits('update:product', props.products[1] ?? props.products[0])
  } else if (size) {
    group.value = props.getProduct(size)?.group ?? group.value
    nextTick(() => emits('update:product', size))
  }
})

const resources = computed(() => {
  const cpu = []
  const ram = []

  props.products.forEach((product) => {
    const resources = props.getProduct(product)

    if (resources.group !== group.value) return
    if (!cpu.includes(resources.cpu)) {
      cpu.push(resources.cpu)
    }
    if (!ram.includes(resources.ram / 1024)) {
      ram.push(resources.ram / 1024)
    }
  })

  cpu.sort((a, b) => a - b)
  ram.sort((a, b) => a - b)
  return { cpu, ram }
})

watch(() => options.cpu.size, async (size) => {
  await nextTick()
  const product = findProduct(group.value)

  if (product) return
  const { resources } = findProduct(group.value, size) ?? {}

  setOptions('ram.size', resources?.ram / 1024)
})

watch(() => options.ram.size, async (size) => {
  await nextTick()
  const product = findProduct(group.value)

  if (product) return
  const resources = findProduct(group.value, undefined, size) ?? {}

  setOptions('cpu.size', resources?.cpu)
})

const isHighCPUExist = computed(() =>
  plansStore.plans.find((plan) => plan.meta.highCPU)
)

function setProduct () {
  for (const product of props.products) {
    const resources = props.getProduct(product)

    if (resources.group === group.value) {
      emits('update:product', product)
      break
    }
  }
}

function setProductByResources () {
  const { title } = findProduct(group.value) ?? {}

  if (!title) return
  emits('update:product', title)
}

function findProduct (group, cpu = options.cpu.size, ram = options.ram.size) {
  for (const product of props.products) {
    const resources = props.getProduct(product)
    const isCpuEqual = resources.cpu === cpu
    const isRamEqual = resources.ram / 1024 === ram

    if (resources.group === group && isCpuEqual && isRamEqual) {
      return { ...resources, title: product }
    }
  }
}
</script>

<style scoped>
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
  box-shadow: inset 0 0 0 1px var(--border_color);
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
  color: var(--gloomy_font);
}

.hcpu-block {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 75px;
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
