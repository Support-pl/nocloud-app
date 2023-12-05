<template>
  <ovh-addons :addons="addons" :all-addons="allAddons" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import ovhAddons from '@/components/cloud/create/ovhAddons.vue'

const props = defineProps({
  tarification: { type: String, required: true },
  planKey: { type: String, required: true },
  plans: { type: Array, required: true }
})

const cloudStore = useCloudStore()

const mode = computed(() => {
  switch (props.tarification) {
    case 'Annually':
      return 'upfront12'
    case 'Biennially':
      return 'upfront24'
    case 'Hourly':
      return 'hourly'
    default:
      return 'default'
  }
})

const allAddons = ref({})
const addons = computed(() => {
  const addons = { backup: {}, snapshot: {}, disk: {} }

  Object.keys(addons).forEach((addon) => {
    cloudStore.plan.resources?.forEach(({ price, key, title }) => {
      const { value } = props.plans.find((el) => el.value === props.planKey) ?? {}

      const [duration, addonKey] = key.split(' ')
      const period = {
        price: { value: price },
        duration,
        pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
      }

      const isInclude = allAddons.value[value]?.includes(addonKey)
      const isEqualMode = period.pricingMode === mode.value

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
