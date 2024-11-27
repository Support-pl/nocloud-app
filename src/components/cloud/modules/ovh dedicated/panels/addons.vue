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
  products: { type: Array, required: true }
})

const cloudStore = useCloudStore()
const addonsStore = useAddonsStore()
const [product] = inject('useProduct', () => [])()

const addons = computed(() => {
  const result = { 'Public network': {}, 'Private network': {} }

  const filtered = addonsStore.addons.filter(({ uuid }) =>
    cloudStore.plan.addons.includes(uuid) || product.value.addons?.includes(uuid)
  )
  console.log(filtered)

  filtered.forEach(({ uuid, title, periods, meta, system, group, public: enabled }) => {
    const addonGroups = ['bandwidth', 'traffic', 'vrack']
    const addonGroup = addonGroups.find((key) =>
      meta.key.toLowerCase().includes(key)
    )

    let addon = (system && addonGroup) ? addonGroup : group
    const isEqualGroup = group === cloudStore.plan.uuid
    const key = meta.id ?? ''

    const [duration, , addonKey] = key.split(' ') ?? []
    const isPublic = addonKey?.startsWith('bandwidth') || key.includes('traffic')

    if (isPublic) addon = 'Public network'
    else if (key.includes('vrack')) addon = 'Private network'

    if (!enabled || (!isEqualGroup && system)) return
    if (system && !addonGroup) return
    if (!result[addon]) result[addon] = {}

    const period = {
      price: { value: periods[product.value.period] },
      duration,
      pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
    }

    if (title === '') title = addonKey
    result[addon][uuid] = { periods: [period], title, multiple: !system }
  })

  return result
})
</script>

<script>
export default { name: 'OvhDedicatedAddonsPanel' }
</script>
