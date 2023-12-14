<template>
  <div class="newCloud__template">
    <div
      v-for="(item, index) in images"
      :key="index"
      class="newCloud__template-item"
      :class="{ active: osName === item.name }"
      @click="setOS(item, index)"
    >
      <template v-if="item.warning">
        <div class="newCloud__template-image">
          <img src="/img/OS/default.png" :alt="item.desc">
        </div>
        <div class="newCloud__template-name">
          {{ item.name }}
        </div>
      </template>

      <template v-else-if="!item.name.includes('none')">
        <div class="newCloud__template-image">
          <img :src="`/img/OS/${getImageName(item.name)}.png`" :alt="item.desc" @error="onError">
        </div>

        <div class="newCloud__template-name">
          {{ item.name }} <br>
          <template v-if="item.prices || item.price">
            ({{ osPrice(item.prices ?? item) }} {{ currency.code }})
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { getImageName, onError } from '@/functions.js'
import { useCurrency } from '@/hooks/utils'

defineProps({
  images: { type: [Array, Object], required: true },
  osName: { type: String, required: true },
  setOS: { type: Function, required: true },
  osPrice: { type: Function, default: (prices) => prices[0] ?? 0 }
})

const { currency } = useCurrency()
</script>

<script>
export default { name: 'ImagesList' }
</script>
