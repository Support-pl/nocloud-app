<template>
  <div class="module">
    <a-row :gutter="[10, 10]">
      <a-col :md="12" :xs="24" :sm="12">
        <a-button
          size="large"
          type="primary"
          :disabled="service.status !== 'Active'"
          @click="moduleEnter"
        >
          {{ capitalize($t('enter')) }}
        </a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  service: { type: Object, required: true }
})

const router = useRouter()
const store = useInstancesStore()

function moduleEnter () {
  const { uuid } = store.getInstances.find((vm) =>
    vm.uuidService === props.service.uuid
  )

  router.push(`/cloud/${uuid}`)
}
</script>

<script>
export default { name: 'VmDraw' }
</script>
