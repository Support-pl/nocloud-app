<template>
  <span
    style="display: inline-block"
    :style="{ gridColumn: (driveTypes.length < 2) ? '1 / 3' : null }"
  >
    {{ $t("Drive") }}:
  </span>

  <a-switch
    v-if="driveTypes.length > 1"
    checked-value="SSD"
    un-checked-value="HDD"
    checked-children="SSD"
    un-checked-children="HDD"
    :checked="options.disk.type"
    @update:checked="setOptions('disk.type', $event)"
  />

  <a-slider
    style="margin-top: 10px"
    :tip-formatter="null"
    :step="options.disk.step"
    :max="options.disk.max"
    :min="options.disk.min"
    :value="parseFloat(diskSize)"
    @update:value="setOptions('disk.size', $event * 1024)"
  />

  <div class="changing__field" style="text-align: right">
    <template v-if="isProductsExist">
      {{ diskSize }}
    </template>

    <template v-else>
      <a-input-number
        allow-clear
        :value="options.disk.size"
        :min="0"
        :max="512 * 1024"
        @update:value="setOptions('disk.size', $event)"
      /> Mb
    </template>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { usePlansStore } from '@/stores/plans.js'
import { useCloudStore } from '@/stores/cloud.js'

defineProps({
  isProductsExist: { type: Boolean, default: true }
})

const plansStore = usePlansStore()
const cloudStore = useCloudStore()
const [options, setOptions] = inject('useOptions', () => [])()

const plan = computed(() =>
  plansStore.plans.find(({ uuid }) => uuid === cloudStore.planId)
)

const diskSize = computed(() => {
  const size = (options.disk.size / 1024).toFixed(1)

  return (size >= 1) ? `${size} Gb` : `${options.disk.size} Mb`
})

const driveTypes = computed(() =>
  plan.value.resources.filter(({ key }) => key.includes('drive'))
)
</script>

<script>
export default { name: 'IoneDrive' }
</script>
