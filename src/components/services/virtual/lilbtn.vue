<template>
  <div class="btn">
    <a-button block size="small" :loading="isLoading" @click.stop="loginToCpanel">
      {{ capitalize($t('enter')) }}
    </a-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { notification } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  service: { type: Object, required: true }
})

const i18n = useI18n()
const instancesStore = useInstancesStore()

const isLoading = ref(false)

async function loginToCpanel () {
  isLoading.value = true
  try {
    const url = await instancesStore.loginToCpanel(props.service.uuid ?? props.service.id)

    window.open(url)
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<script>
export default { name: 'LittleButton' }
</script>

<style scoped>
.btn{
  grid-column: 2 / 4;
  justify-self: end;
  width: fit-content;
}

.btn button{
  height: 100%;
}
</style>
