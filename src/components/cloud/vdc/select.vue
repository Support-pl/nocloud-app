<template>
  <a-flex vertical gap="small">
    VDC Selector
    <a-select
      :value="value"
      allow-clear
      style="width: 100%"
      popup-class-name="select-dropdown"
      :field-names="{ label: 'selectorLabel', value: 'uuid', options: 'options' }"
      :options="options"
      @update:value="emits('update:value', $event)"
    >
      <template #option="item">
        <a-card
          size="small"
          class="card"
          :title="item.title"
          :bordered="false"
          :style="{ borderBottom: (options.at(-1).uuid !== item.uuid) ? '1px solid var(--border_color)' : null }"
        >
          <span class="vm">Virtual machines: {{ item.vm }}</span>

          <template #extra>
            <span class="location">{{ item.location }}</span>
          </template>
        </a-card>
      </template>
    </a-select>
  </a-flex>
</template>

<script setup>
defineProps({
  value: { type: String, required: true },
  options: { type: Array, required: true }
})
const emits = defineEmits(['update:value'])
</script>

<script>
export default { name: 'VDCSelect' }
</script>

<style scoped>
.card {
  border-radius: 0;
}

.card.ant-card :deep(.ant-card-head) {
  border: 0;
}

.card.ant-card :deep(.ant-card-head-title) {
  font-size: 16px;
}

.card.ant-card-small :deep(.ant-card-body) {
  padding: 6px 12px;
}

.vm {
  color: var(--gray);
}

.location {
  font-size: 16px;
  color: var(--gray);
}

:global(.select-dropdown.ant-select-dropdown) {
  padding: 0;
}

:global(.select-dropdown.ant-select-dropdown .ant-select-item-option) {
  padding: 0;
}
</style>
