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
import { inject, ref, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useCloudStore } from '@/stores/cloud.js'
import imagesList from '@/components/cloud/create/images.vue'

const props = defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true }
})

watch(() => props.productSize, setImages)
onMounted(setImages)

const { authData, plan } = storeToRefs(useCloudStore())

const images = ref([])
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

async function setImages () {
  await nextTick()
  const period = (props.mode === 'default') ? 'P1M' : 'P1Y'
  const product = plan.value.products[`${period} ${options.config.planCode}`]
  const { os } = product?.meta ?? {}

  os?.sort()
  images.value = os?.map((name) => ({ name, desc: name })) ?? []
}

watch(images, (value) => {
  if (value.length === 1) setOS(value[0], 0)
})

function setOS (item, index) {
  if (item.warning) return
  setOptions('os.id', +index)
  setOptions('os.name', item.name)

  if (item.prices) {
    setPrice('addons.os', osPrice(item.prices))
  } else if (price.addons.os !== 0) {
    setPrice('addons.os', 0)
  }

  setOptions('config.configuration.dedicated_os', item.name)
}

function osPrice (prices) {
  const addon = prices.find(({ pricingMode }) => pricingMode === props.mode)

  return addon?.price.value ?? 0
}
</script>

<script>
export default { name: 'OvhDedicatedOsPanel' }
</script>
