<template>
  <div class="btn">
    <a-button block :loading="isLoading" @click.stop="logIntoCpanel">
      {{ $t('enter') | capitalize }}
    </a-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { notification } from 'ant-design-vue'
import i18n from '@/i18n.js'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  service: { type: Object, required: true }
})

const instancesStore = useInstancesStore()

const isLoading = ref(false)

async function logIntoCpanel () {
  try {
    isLoading.value = true
    const response = await instancesStore.invokeAction({
      uuid: props.service.id, action: 'session'
    })

    if (!response.result) throw response
    if (response.cpanelresult?.error) throw response

    window.open(response.data.url)
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
