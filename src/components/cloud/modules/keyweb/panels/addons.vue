<template>
  <a-row v-for="(addon, key) in addons" :key="key" class="newCloud__prop">
    <a-col span="8" :xs="6">
      {{ capitalize($t(key)) }}:
    </a-col>
    <a-col span="16" :xs="18">
      <a-select
        style="width: 100%"
        :value="getAddon(addon)"
        @update:value="setAddon($event, addon[$event], key)"
      >
        <a-select-option v-for="(item, id) in addon" :key="id">
          {{ item.title }} ({{ item.price }} {{ currency.code }})
        </a-select-option>
      </a-select>
    </a-col>
  </a-row>
</template>

<script setup>
import { computed, inject, nextTick, watch } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import { useCurrency } from '@/hooks/utils'
import { getTarification } from '@/functions.js'

const props = defineProps({
  mode: { type: String, required: true }
})

const cloudStore = useCloudStore()
const { currency } = useCurrency()
const product = inject('product')
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

const addons = computed(() => {
  const addons = { backup: {} }

  Object.keys(addons).forEach((addon) => {
    const { meta } = cloudStore.plan.products[product.value.key] ?? {}

    meta?.addons?.forEach((addonKey) => {
      const resource = cloudStore.plan.resources.find(({ key }) => addonKey === key) ?? {}
      const { title, price, meta: { type } } = resource

      const isEqualMode = getTarification(resource.period) === props.mode
      const isInclude = resource.key.toLowerCase().includes(addon)

      if (addonKey && isInclude && isEqualMode && resource.public) {
        addons[addon][resource.key] = { price, title, type }
      }
    })
  })

  return addons
})

watch(addons, setAddons)
setAddons(addons.value)

async function setAddons (value) {
  await nextTick()
  Object.entries(value).forEach(([key, value]) => {
    const [code, addon] = Object.entries(value)[0] ?? []

    if (!code) return
    setAddon(code, addon, key)
  })
}

async function setAddon (code, addon, key) {
  const addonsPrices = JSON.parse(JSON.stringify(price.addons))

  if (code === '-1') {
    delete addonsPrices[key]
  } else {
    addonsPrices[key] = addon.price
  }

  setPrice('addons', addonsPrices)
  setOptions(`config.configurations.${addon.type}`, code)
}

function getAddon (addons) {
  const keys = Object.values(options.config.configurations ?? {})

  return Object.keys(addons).find((key) => keys.includes(key))
}
</script>

<script>
export default { name: 'KeywebAddonsPanel' }
</script>
