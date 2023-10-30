<template>
  <a-row :gutter="[10, 10]">
    <a-col :md="12" :xs="12" :sm="12">
      <div class="service-page__info">
        <div class="service-page__info-title">
          {{ capitalize($t('virtual_product.used space')) }}:
        </div>

        <div class="service-page__info-value">
          {{ serviceUsed.diskusage.count }} / {{ serviceUsed.diskusage.max }}
          ({{ (getPercent(serviceUsed.diskusage) || 0).toFixed(2) }}%)
        </div>
        <a-progress :percent="getPercent(serviceUsed.diskusage)" :show-info="false" />
      </div>
    </a-col>

    <a-col :md="12" :xs="12" :sm="12">
      <div class="service-page__info">
        <div class="service-page__info-title">
          {{ capitalize($t('virtual_product.bw')) }}:
        </div>

        <div class="service-page__info-value">
          {{ serviceUsed.bandwidthusage.count }} /
          {{ (serviceUsed.bandwidthusage.max !== 'unlimited')
            ? `${serviceUsed.bandwidthusage.max}MB (${getPercent(serviceUsed.bandwidthusage)}%)`
            : $t('virtual_product.unlimited') }}
        </div>
        <a-progress :percent="getPercent(serviceUsed.bandwidthusage)" :show-info="false" />
      </div>
    </a-col>
  </a-row>

  <a-row :gutter="[10, 10]">
    <a-col :md="12" :xs="24" :sm="12">
      <a-button size="large" type="primary" :loading="isLoginLoading" @click="logIntoCpanel">
        {{ capitalize($t('enter')) }}
      </a-button>
    </a-col>
  </a-row>
</template>

<script setup>
import { ref, computed } from 'vue'
import { notification } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  service: { type: Object, required: true }
})

const route = useRoute()
const i18n = useI18n()
const instancesStore = useInstancesStore()

const isLoginLoading = ref(false)

const serviceUsed = computed(() =>
  props.service.state?.meta?.account.reduce((result, value) => ({
    ...result, [value.id]: value
  }), {})
)

function getPercent (value) {
  let { count, max } = value

  switch (value.units) {
    case 'bytes':
      count *= 1e6
      break
    case 'KB':
      count *= 1024
      break
    case 'GB':
      count /= 1024
      break
    case 'TB':
      count /= Math.pow(1024, 2)
  }

  if (max.includes('bytes')) {
    max *= 1e6
  } else if (max.includes('KB')) {
    max *= 1024
  } else if (max.includes('GB')) {
    max /= 1024
  } else if (max.includes('TB')) {
    max /= Math.pow(1024, 2)
  }

  return parseFloat(count) / parseFloat(max) * 100
}

async function logIntoCpanel () {
  try {
    isLoginLoading.value = true
    const response = await instancesStore.invokeAction({
      uuid: route.params.id, action: 'session'
    })

    if (!response.result) throw new Error(response)
    window.open(response.meta.url)
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  } finally {
    isLoginLoading.value = false
  }
}
</script>

<script>
export default { name: 'VirtualDraw' }
</script>

<style>

.module__row-title {
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 5px;
}
</style>
