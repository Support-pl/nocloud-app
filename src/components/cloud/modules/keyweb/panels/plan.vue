<template>
  <a-row style="margin-bottom: 15px" align="middle">
    <a-col v-if="products.length < 6 && products.length > 1" span="24">
      <a-slider
        style="margin-top: 10px"
        :marks="{ ...products }"
        :tip-formatter="null"
        :max="products.length - 1"
        :min="0"
        :value="products.indexOf(product)"
        @update:value="setProduct(products[$event])"
      />
    </a-col>

    <a-col v-else span="24">
      <div class="order__grid">
        <div
          v-for="item of products"
          :key="item"
          class="order__slider-item"
          :class="{ 'order__slider-item--active': productSize === item }"
          @click="setProduct(item)"
        >
          {{ item }}
        </div>
      </div>
    </a-col>
  </a-row>
</template>

<script setup>
import { inject, nextTick, watch } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import { getPeriods } from '@/functions.js'

const props = defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

emits('update:periods', getPeriods(props.plans))
watch(() => props.plans, (value) => {
  emits('update:periods', getPeriods(value))
})

const cloudStore = useCloudStore()
const product = inject('product')
const [, setOptions] = inject('useOptions', () => [])()
const [, setPrice] = inject('usePriceOVH', () => [])()

watch(() => props.products, (value) => {
  setProduct(value[1] ?? value[0])
})
watch(() => props.mode, async (value) => {
  await nextTick()
  let result = ''

  switch (value) {
    case 'Annually':
      result = 'yearly'
      break
    case 'Biennially':
      result = '2-yearly'
      break
    case 'Hourly':
      result = 'hourly'
      break
    default:
      result = 'monthly'
  }
  setOptions('config.cycle', result)
})

async function setProduct (value) {
  emits('update:product-size', value)

  await nextTick()
  const { price, meta } = cloudStore.plan.products[product.value.key]

  setOptions('cpu.size', 0)
  setOptions('ram.size', 0)
  setOptions('disk.size', 0)

  setOptions('config', {
    configurations: {},
    cycle: 'monthly',
    id: meta.keywebId
  })
  setPrice('value', price)
}
</script>

<script>
export default { name: 'KeywebPlanPanel' }
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
