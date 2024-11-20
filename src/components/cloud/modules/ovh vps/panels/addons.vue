<template>
  <ovh-addons :addons="addons" :mode="mode" />
</template>

<script setup>
import { computed, inject } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import { useAddonsStore } from '@/stores/addons.js'

import ovhAddons from '@/components/cloud/create/ovhAddons.vue'

defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true },
  products: { type: Array, required: true }
})

const cloudStore = useCloudStore()
const addonsStore = useAddonsStore()
const [product] = inject('useProduct', () => [])()

const addons = computed(() => {
  const result = { backup: {}, snapshot: {}, disk: {} }

  const filtered = addonsStore.addons.filter(({ uuid }) =>
    cloudStore.plan.addons.includes(uuid) || product.value.addons?.includes(uuid)
  )

  filtered.forEach(({ uuid, title, periods, meta, system, group, public: enabled }) => {
    const addonGroups = ['backup', 'snapshot', 'disk']
    const addonGroup = addonGroups.find((key) =>
      meta.key.toLowerCase().includes(key)
    )
    const isEqualGroup = group === cloudStore.plan.uuid
    const key = (system && addonGroup) ? addonGroup : group

    if (!enabled || (!isEqualGroup && system)) return
    if (system && !addonGroup) return
    if (!result[key]) result[key] = {}

    const [duration] = meta.key.split(' ') ?? []
    const period = {
      price: { value: periods[product.value.period] },
      duration,
      pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
    }

    result[key][uuid] = { title, periods: [period], multiple: !system }
  })

  return result
})
</script>

<script>
export default { name: 'OvhVpsAddonsPanel' }
</script>
