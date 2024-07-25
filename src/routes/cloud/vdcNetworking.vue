<template>
  <div class="cloud-wrapper">
    <div class="cloud">
      <loading v-if="isLoading" />
      <a-row v-else :gutter="[20, 20]">
        <a-col :span="12">
          <vdc-select v-model:value="selected" :options="options" />
        </a-col>

        <a-col style="align-self: flex-end" :span="12">
          <vdc-ips-price :instances="instances" :selected="selected" />
        </a-col>

        <a-col :span="12">
          <a-button block type="text" size="large" class="button button--secondary">
            {{ capitalize($t('topology')) }}
            <template #icon>
              <apartment-icon style="font-size: 25px" :rotate="-90" />
            </template>
          </a-button>
        </a-col>

        <a-col :span="12">
          <vdc-order-ip-button :instances="instances" :disabled="options.length < 1" />
        </a-col>

        <a-col :span="24">
          <vdc-ips-table :instances="instances" :options="options" :selected="selected" />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useInstancesStore } from '@/stores/instances.js'

import useVdcOptions from '@/hooks/cloud/vdcOptions.js'
import { useNotification } from '@/hooks/utils'

import loading from '@/components/ui/loading.vue'
import vdcSelect from '@/components/cloud/vdc/select.vue'
import vdcIpsPrice from '@/components/cloud/vdc/ipsPrice.vue'
import vdcIpsTable from '@/components/cloud/vdc/ipsTable.vue'
import vdcOrderIpButton from '@/components/cloud/vdc/orderIpButton.vue'

const apartmentIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ApartmentOutlined')
)

const authStore = useAuthStore()
const instancesStore = useInstancesStore()
const { instances, options } = useVdcOptions()
const { openNotification } = useNotification()

const selected = ref('')
const isLoading = ref(false)

async function fetchInstances () {
  isLoading.value = true
  try {
    await instancesStore.fetch()
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

if (authStore.userdata.uuid) fetchInstances()
watch(() => authStore.userdata, fetchInstances)
</script>

<script>
export default { name: 'VDCNetworking' }
</script>

<style scoped>
.cloud-wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.cloud {
  position: relative;
  height: max-content;
  width: 768px;
  padding: 20px;
  margin: 15px auto;
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  background-color: var(--bright_font);
}

.button {
  height: auto;
  padding: 12px 15px;
}

.button--secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bright_bg);
  color: var(--main);
}

body.dark .button--secondary {
  color: var(--gloomy_font);
}

body.dark .button--secondary:hover {
  color: var(--main);
}
</style>
