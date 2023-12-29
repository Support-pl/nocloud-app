<template>
  <a-row style="margin-bottom: 15px" align="middle">
    <a-col v-if="products.length < 6 && products.length > 1" span="24">
      <a-slider
        style="margin-top: 10px"
        :marks="{ ...products }"
        :tip-formatter="null"
        :max="products.length - 1"
        :min="0"
        :value="products.indexOf(productSize)"
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

    <a-col span="24">
      <editor-container :value="description" />
    </a-col>
  </a-row>
</template>

<script setup>
import { inject, nextTick, watch, computed } from 'vue'
import { EditorContainer } from 'nocloud-ui'
import { useCloudStore } from '@/stores/cloud.js'
import { getPeriods } from '@/functions.js'

const props = defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true }
})
const emits = defineEmits(['update:periods', 'update:product-size'])

emits('update:periods', getPeriods(props.productSize, props.plans))
watch(() => props.productSize, (value) => {
  emits('update:periods', getPeriods(value, props.plans))
})

const cloudStore = useCloudStore()
const product = inject('product')
const [, setOptions] = inject('useOptions', () => [])()
const [, setPrice] = inject('usePriceOVH', () => [])()

if (props.products.length > 0) {
  setProduct(props.products[1] ?? props.products[0])
}
watch(() => props.products, (value) => {
  setProduct(value[1] ?? value[0])
})

watch(() => props.mode, () => {
  setProduct(props.productSize)
})

const description = computed(() =>
  product.value.meta?.description
)

async function setProduct (value) {
  emits('update:product-size', value)

  await nextTick()
  if (!product.value.key) return

  const { price, meta } = cloudStore.plan.products[product.value.key]
  let cycle = ''

  switch (props.mode) {
    case 'Annually':
      cycle = 'yearly'
      break
    case 'Biennially':
      cycle = '2-yearly'
      break
    case 'Hourly':
      cycle = 'hourly'
      break
    default:
      cycle = 'monthly'
  }

  setOptions('cpu.size', 0)
  setOptions('ram.size', 0)
  setOptions('disk.size', 0)

  setOptions('config', { configurations: {}, id: meta.keywebId, cycle })
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
