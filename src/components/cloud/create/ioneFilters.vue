<template>
  <filters-view
    :filters="filters"
    :resources="resources"
    :prefixes="prefixes"
    @update:filter="updateFilter"
  />
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import filtersView from '@/components/ui/filters.vue'

const props = defineProps({
  plans: { type: Array, required: true },
  products: { type: Array, required: true }
})
const emits = defineEmits(['update:filter'])
const cloudStore = useCloudStore()

const filters = reactive({ cpu: [], ram: [] })
const prefixes = reactive({ cpu: 'cores', ram: 'Gb' })

const resources = computed(() => {
  const { highCPU, withAdministration } = cloudStore.provider?.vars ?? {}
  const cpu = []
  const ram = []

  if (props.products.length < 6) return { cpu, ram }
  props.plans.forEach(({ products }) => {
    Object.values(products).forEach(({ resources, title }) => {
      if (!props.products.includes(title)) return
      if (!cpu.includes(resources.cpu)) {
        cpu.push(resources.cpu)
      }
      if (!ram.includes(Math.round(resources.ram / 1024))) {
        ram.push(Math.round(resources.ram / 1024))
      }
    })
  })

  cpu.sort((a, b) => a - b)
  ram.sort((a, b) => a - b)

  return { cpu, ram, highCPU, withAdministration }
})

if (resources.value.cpu.length > 1) {
  updateFilter('cpu', [resources.value.cpu.at(0), resources.value.cpu.at(-1)])
}

if (resources.value.ram.length > 1) {
  updateFilter('ram', [resources.value.ram.at(0), resources.value.ram.at(-1)])
}

watch(() => resources.value.cpu, (value) => {
  updateFilter('cpu', [value.at(0), value.at(-1)])
})

watch(() => resources.value.ram, (value) => {
  updateFilter('ram', [value.at(0), value.at(-1)])
})

function updateFilter (key, value) {
  filters[key] = value
  emits('update:filter', key, value)
}
</script>

<script>
export default { name: 'IoneFilters' }
</script>
