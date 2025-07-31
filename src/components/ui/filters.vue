<template>
  <template v-for="(resource, key) in resources" :key="key">
    <a-row
      v-if="Array.isArray(resource) && resource.length > 0"
      justify="space-between"
      align="middle"
    >
      <a-col v-if="type.includes('with-prefixes')">
        {{ $t(key) }}:
        <template v-if="prefixes[key]">
          ({{ prefixes[key] }})
        </template>
      </a-col>

      <a-col v-else>
        <span>{{ capitalize($t('filter')) }} {{ $t('by') }} {{ key }}:</span>
      </a-col>

      <a-col v-if="type.includes('slider')" :span="24" :md="(type === 'slider') ? 24 : 20">
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

      <a-col v-else style="display: flex; gap: 5px; align-items: center" :span="24">
        <a-select
          v-if="resource.some((value) => isNaN(value))"
          mode="multiple"
          style="width: 100%"
          :placeholder="$t('select')"
          :options="getOptions(resource)"
          :value="filters[key]"
          @update:value="emits('update:filter', key, $event)"
        />

        <a-input-number
          v-else-if="type.includes('block')"
          style="width: 100%"
          :placeholder="`${getMax(resource)}`"
          :min="getMin(resource)"
          :max="getMax(resource)"
          :step="getStep(resource)"
          :value="filters[key].at(0)"
          @update:value="emits('update:filter', key, [$event, $event])"
        />

        <template v-else>
          <a-input-number
            style="width: 100%"
            :placeholder="`${getMin(resource)}`"
            :min="getMin(resource)"
            :max="getMax(resource)"
            :step="getStep(resource)"
            :value="filters[key].at(0)"
            @update:value="emits('update:filter', key, [$event, filters[key].at(-1)])"
          />
          -
          <a-input-number
            style="width: 100%"
            :placeholder="`${getMax(resource)}`"
            :min="getMin(resource)"
            :max="getMax(resource)"
            :step="getStep(resource)"
            :value="filters[key].at(-1)"
            @update:value="emits('update:filter', key, [filters[key].at(0), $event])"
          />
        </template>
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
  type: { type: String, default: 'slider-with-prefixes' },
  filters: { type: Object, required: true },
  resources: { type: Object, required: true },
  prefixes: { type: Object, default: () => ({}) }
})
const emits = defineEmits(['update:filter'])

function getMin (resource) {
  return Math.min(...resource)
}

function getMax (resource) {
  return Math.max(...resource)
}

function getOptions (resource) {
  return resource.map((value) => ({ label: value, value }))
}

function getStep (resource) {
  const nums = resource.map((value) =>
    `${value}`.length - `${parseInt(value)}`.length - 1
  )
  const isFloat = resource.some((value) => !Number.isInteger(value))
  const simbolsAfterComma = nums.reduce((result, value) =>
    (value > result) ? value : result
  )
  const float = (isFloat) ? 1 / Math.pow(10, simbolsAfterComma) : 1

  return float
}
</script>

<script>
export default { name: 'FiltersView' }
</script>
