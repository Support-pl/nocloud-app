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

          <a-form-item :label="`${$t('SSH key')}:`">
            <div style="display: flex; align-items: center; gap: 10px">
              <a-select
                style="width: 100%"
                :field-names="{ label: 'title', value: 'value', options: 'options' }"
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
      v-if="images.length > 0"
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
import { defineAsyncComponent, inject, ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'

import imagesList from '@/components/ui/images.vue'
import addSsh from '@/components/ui/addSSH.vue'

const plusIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/PlusOutlined')
)

const props = defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true }
})

watch(() => props.productSize, setImages)
onMounted(setImages)

const authStore = useAuthStore()
const { authData, locations, locationId, plan } = storeToRefs(useCloudStore())

const images = ref([])
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

const region = computed(() =>
  locations.value.find(({ id }) => locationId.value.includes(id))?.extra?.region
)

function setImages () {
  const period = (props.mode === 'default') ? 'P1M' : 'P1H'
  const product = Object.values(plan.value.products ?? {}).find((product) =>
    product.title === props.productSize &&
      product.resources.period === period &&
      product.meta.region === region.value
  )
  const { os } = product?.meta ?? {}

  os?.sort((a, b) => a.name < b.name)
  images.value = os?.map(({ name, id }) => ({ name, desc: name, id })) ?? []
}

function setOS (item, index) {
  if (item.warning) return
  setOptions('os.id', +index)
  setOptions('os.name', item.name)

  if (item.prices) {
    setPrice('addons.os', osPrice(item.prices))
  } else if (price.addons.os !== 0) {
    setPrice('addons.os', 0)
  }

  setOptions('config.configuration.cloud_os', item.id)
}

function osPrice (prices) {
  const addon = prices.find(({ pricingMode }) => pricingMode === props.mode)

  return addon?.price.value ?? 0
}
</script>

<script>
export default { name: 'OvhCloudOsPanel' }
</script>
