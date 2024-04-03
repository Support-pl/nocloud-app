<template>
  <template v-if="type === 'slider'">
    <a-slider
      style="margin-top: 20px"
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
      <a-col>
        <span style="display: inline-block; width: 70px">{{ slider.prefix }}</span>
      </a-col>
      <a-col
        v-if="resources[slider.key].length > 1"
        :sm="{ span: 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
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
  </template>

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
import { watch, nextTick, ref, computed, inject } from 'vue'

const props = defineProps({
  type: { type: String, default: 'grid' },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  getProduct: { type: Function, default: (item) => item }
})
const emits = defineEmits(['update:product'])
const [options, setOptions] = inject('useOptions')()

const sliders = [
  { key: 'cpu', prefix: 'CPU:', postfix: 'vCPU' },
  { key: 'ram', prefix: 'RAM:', postfix: 'Gb' }
]

const group = ref('')
const groups = computed(() =>
  props.products.reduce((result, product) => {
    const resources = props.getProduct(product)

    if (!result.includes(resources.group)) {
      result.push(resources.group)
    }

    return result
  }, [])
)

if (groups.value.length > 0) {
  group.value = groups.value[1] ?? groups.value[0]
}

watch(groups, (value) => {
  group.value = value[1] ?? value[0]
})

watch(group, setProduct)

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

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>