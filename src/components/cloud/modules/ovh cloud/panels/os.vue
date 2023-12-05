<template>
  <div v-if="images.length > 0" class="newCloud__option-field">
    <a-row>
      <a-col :xs="24" :sm="10">
        <a-form no-style autocomplete="off" layout="vertical">
          <a-form-item :label="`${capitalize($t('server name'))}:`">
            <a-input
              v-model:value="authData.vmName"
              :style="{
                boxShadow: `0 0 2px 2px var(${
                  (authData.vmName.length > 1) ? '--main' : '--err'
                })`
              }"
            />
            <div v-if="authData.vmName.length < 2" style="line-height: 1.5; color: var(--err)">
              {{ $t('ssl_product.field is required') }}
            </div>
          </a-form-item>

          <a-form-item v-if="!options.isSSHExist" :label="`${$t('SSH key')}:`">
            <div style="display: flex; align-items: center; gap: 10px">
              <a-select
                style="width: 100%"
                :options="authStore.userdata.data?.ssh_keys"
                :value="options.config.ssh"
                :style="{
                  boxShadow: `0 0 2px 2px var(${
                    (options.config.ssh?.length > 1) ? '--main' : '--err'
                  })`
                }"
                @update:value="setOptions('config.ssh', $event)"
              />

              <add-ssh>
                <template #actions="{ showModal }">
                  <plus-icon
                    style="color: var(--main); font-size: 20px; vertical-align: middle"
                    @click="showModal"
                  />
                </template>
              </add-ssh>
            </div>
            <div v-if="!(options.config.ssh?.length > 1)" style="line-height: 1.5; color: var(--err)">
              {{ $t('ssl_product.field is required') }}
            </div>
          </a-form-item>
        </a-form>
      </a-col>
    </a-row>

    <images-list
      v-if="provider"
      :images="images"
      :os-name="options.os.name"
      :os-price="osPrice"
      :set-o-s="setOS"
    />
  </div>

  <a-alert
    v-else-if="!isFlavorsLoading"
    show-icon
    type="warning"
    :message="$t('No OS. Choose another plan')"
  />
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { computed, defineAsyncComponent, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'

import imagesList from '@/components/cloud/create/images.vue'
import addSsh from '@/components/ui/addSSH.vue'

const plusIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/PlusOutlined')
)

const props = defineProps({
  images: { type: Array, required: true },
  tarification: { type: String, required: true }
})

const authStore = useAuthStore()
const { authData } = storeToRefs(useCloudStore())
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

const mode = computed(() => {
  switch (props.tarification) {
    case 'Annually':
      return 'upfront12'
    case 'Biennially':
      return 'upfront24'
    case 'Hourly':
      return 'hourly'
    default:
      return 'default'
  }
})

function setOS (item, index) {
  if (item.warning) return
  setOptions('os.id', +index)
  setOptions('os.name', item.name)

  if (item.prices) {
    setPrice('addons.os', osPrice(item.prices))
  } else if (price.value.addons.os !== 0) {
    setPrice('addons.os', 0)
  }

  setOptions('config.configuration.cloud_os', item.id)
}

function osPrice (prices) {
  const addon = prices.find(({ pricingMode }) => pricingMode === mode.value)

  return addon?.price.value ?? 0
}
</script>

<script>
export default { name: 'OvhCloudOsPanel' }
</script>
