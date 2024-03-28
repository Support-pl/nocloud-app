<template>
  <template v-for="(resource, key) in resources" :key="key">
    <a-row
      v-if="Array.isArray(resource) && resource.length > 0"
      justify="space-between"
      align="middle"
    >
      <a-col>
        {{ $t(key) }}:
        <template v-if="prefixes[key]">
          ({{ prefixes[key] }})
        </template>
      </a-col>

      <a-col :span="24" :md="20">
        <a-slider
          range
          class="slider"
          style="margin-top: 10px"
          :marks="{ ...resource }"
          :tip-formatter="null"
          :default-value="[0, resource.length - 1]"
          :max="resource.length - 1"
          :min="0"
          @change="([i, j]) => emits('update:filter', key, [resource[i], resource[j]] )"
        />
      </a-col>
    </a-row>

    <div
      v-else-if="resource === true"
      style="display: inline-flex; gap: 10px; width: 50%; margin-top: 10px"
    >
      <span style="display: inline-block">{{ capitalize($t(key)) }}:</span>

      <a-switch
        size="small"
        :checked="filters[key]"
        @update:checked="emits('update:filter', key, $event )"
      />
    </div>
  </template>
</template>

<script setup>
defineProps({
  filters: { type: Object, required: true },
  resources: { type: Object, required: true },
  prefixes: { type: Object, default: () => ({}) }
})
const emits = defineEmits(['update:filter'])
</script>

<script>
export default { name: 'FiltersView' }
</script>
