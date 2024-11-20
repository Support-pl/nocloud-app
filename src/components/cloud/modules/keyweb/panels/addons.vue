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
        <a-select-option v-if="!Object.values(addon).at(0)?.required" value="-1">
          {{ $t('ip.none') }}
        </a-select-option>

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
import { useAddonsStore } from '@/stores/addons.js'
import { useCurrency } from '@/hooks/utils'

defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true },
  plans: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  isFlavorsLoading: { type: Boolean, default: false }
})

const cloudStore = useCloudStore()
const addonsStore = useAddonsStore()
const { currency } = useCurrency()

const [product] = inject('useProduct', () => [])()
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

const addons = computed(() => {
  const result = { backup: {} }

  const filtered = addonsStore.addons.filter(({ uuid }) =>
    cloudStore.plan.addons.includes(uuid) || product.value.addons?.includes(uuid)
  )

  filtered.forEach(({ uuid, title, periods, meta, system, group, public: enabled }) => {
    const isInclude = meta.key.toLowerCase().includes('backup')
    const isEqualGroup = group === cloudStore.plan.uuid
    const key = (system && isInclude) ? 'backup' : group

    if (!enabled || (!isEqualGroup && system)) return
    if (system && !isInclude) return
    if (!result[key]) result[key] = {}

    result[key][uuid] = {
      title,
      required: system,
      type: meta.type ?? 'custom',
      price: periods[product.value.period]
    }
  })

  return result
})

watch(addons, setAddons)
setAddons(addons.value)

async function setAddons (value) {
  await nextTick()
  Object.entries(value).forEach(([key, value]) => {
    const [code, addon] = Object.entries(value)[0] ?? []

    if (!code || !addon.required) return
    setAddon(code, addon, key)
  })
}

async function setAddon (code, addon, key) {
  const addonsPrices = { ...price.addons }
  const addonsKeys = [...options.addons]
  const keys = Object.keys(addons.value[key])

  if (code === '-1') {
    addonsKeys.forEach((code, i) => {
      if (keys.includes(code)) {
        addonsKeys.splice(i, 1)

        addon = addons.value[key][code]
      }
    })

    delete addonsPrices[key]
  } else {
    addonsPrices[key] = addon.price
    addonsKeys.push(code)
  }

  setPrice('addons', addonsPrices)
  setOptions('addons', addonsKeys)

  if (addon.type === 'custom') return
  setOptions(`config.configurations.${addon.type}`, code.split('$')[0])
}

function getAddon (addons) {
  return Object.keys(addons).find((key) => options.addons.includes(key))
}
</script>

<script>
export default { name: 'KeywebAddonsPanel' }
</script>
