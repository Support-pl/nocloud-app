<template>
  <a-dropdown :trigger="['click']">
    <a-button
      block
      type="primary"
      size="large"
      class="button"
      :disabled="disabled"
    >
      {{ capitalize($t('order IP address')) }}
    </a-button>

    <template #overlay>
      <a-menu style="max-height: 300px; overflow-y: scroll">
        <a-menu-item v-for="inst of instances" :key="inst.uuid" @click="selectInstance(inst)">
          {{ inst.title }}
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>

  <a-modal
    v-model:open="isModalVisible"
    width="600px"
    :title="$t('Network control')"
    :footer="null"
  >
    <network-control
      :item-service="service"
      :instance="instance"
      @close-modal="isModalVisible = false"
    />
  </a-modal>
</template>

<script setup>
import { ref } from 'vue'
import { useInstancesStore } from '@/stores/instances.js'

import networkControl from '@/components/cloud/options/networkControl.vue'

defineProps({
  instances: { type: Array, required: true },
  disabled: { type: Boolean, required: true }
})
const instancesStore = useInstancesStore()

const service = ref({})
const instance = ref({})
const isModalVisible = ref(false)

function selectInstance (value) {
  const item = instancesStore.services.find(
    ({ uuid }) => uuid === value.serviceUuid
  )

  instance.value = JSON.parse(JSON.stringify(value))
  service.value = JSON.parse(JSON.stringify(item))

  isModalVisible.value = true
}
</script>

<style scoped>
.button {
  height: auto;
  padding: 12px 15px;
}
</style>
