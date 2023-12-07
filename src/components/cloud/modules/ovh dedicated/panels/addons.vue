<template>
  <ovh-addons :addons="addons" :mode="mode" />
</template>

<script setup>
import { computed, inject } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import ovhAddons from '@/components/cloud/create/ovhAddons.vue'

const props = defineProps({
  mode: { type: String, required: true },
  productKey: { type: String, required: true },
  products: { type: Array, required: true }
})

const cloudStore = useCloudStore()
const [options] = inject('useOptions', () => [])()

const addons = computed(() => {
  const addons = { traffic: {}, vrack: {} }

  Object.keys(addons).forEach((addon) => {
    cloudStore.plan.resources?.forEach(({ price, key, title }) => {
      const { addons: addonsKeys } = props.products.find(
        (el) => el.value === options.config.planCode
      ) ?? {}

      const [duration, addonKey] = key.split(' ')
      const period = {
        price: { value: price },
        duration,
        pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
      }

      const isInclude = addonsKeys?.includes(addonKey)
      const isEqualMode = period.pricingMode === props.mode

      if (title === '') title = addonKey
      if (isInclude && key.includes(addon) && isEqualMode) {
        addons[addon][addonKey] = { periods: [period], title }
      }
    })
  })

  return addons
})
</script>

<script>
export default { name: 'OvhVpsAddonsPanel' }
</script>
