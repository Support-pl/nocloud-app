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

<style scoped>
.newCloud__template {
  display: flex;
  flex-wrap: wrap;
  gap: 17px;
}

.newCloud__template-item {
  background-color: var(--bright_font);
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  transition: all 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  max-width: calc(50% - 9px);
}

.newCloud__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}

.newCloud__template-item.active {
  box-shadow: 5px 8px 12px rgba(0, 0, 0, 0.08), 0px 0px 13px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
  background-color: var(--main);
  color: var(--bright_font);
}

.newCloud__template-image {
  padding: 5px 0 5px 10px;
  overflow: hidden;
}

.newCloud__template-image img {
  object-fit: cover;
  max-width: 100%;
  max-height: 80px;
}

.newCloud__template-image img::before {
  width: 16px;
  display: inline-block;
  overflow: hidden;
  height: 15px;
}

.newCloud__template-image img::after {
  content: url('/img/OS/default.png');
  display: block;
  position: absolute;
  transform: translate(-36px, -59px) scale(0.21);
  background: var(--bright_font);
  border-radius: 50%;
  transition: 0.2s;
}

.newCloud__template-name {
  padding: 10px;
  word-break: break-word;
}

.newCloud__template-item.active .newCloud__template-image img {
  padding: 2px;
  background: var(--bright_font);
  border-radius: 50%;
  transition: 0.2s;
}

.newCloud__template-item.active .newCloud__template-image img::after {
  transform: translate(-37px, -61px) scale(0.18);
  padding: 2px;
}

@media (max-width: 575px) {
  .newCloud__template-item {
    grid-template-columns: 40px 1fr;
  }

  .newCloud__template-image {
    padding: 7px 0 7px 10px;
  }

  .newCloud__template-name ul {
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1;
  }

  .newCloud__template-name ul li {
    margin-left: 20px;
  }
}
</style>
