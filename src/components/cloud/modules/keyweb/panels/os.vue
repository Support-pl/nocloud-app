<template>
  <div v-if="images.length > 0" class="newCloud__option-field">
    <a-form no-style autocomplete="off" layout="vertical" style="margin-bottom: 10px">
      <a-row :gutter="15">
        <a-col :xs="24" :sm="12">
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
        </a-col>

        <a-col :xs="24" :sm="12">
          <a-form-item
            class="newCloud__form-item"
            :label="`${capitalize($t('clientinfo.username'))}:`"
          >
            <a-input
              v-model:value="authData.username"
              :style="{
                boxShadow: (authData.username.length < 2) ? '0 0 2px 2px var(--err)' : null
              }"
              @change="(value) => setOptions('config.username', value)"
            />

            <div v-if="authData.username.length < 2" style="line-height: 1.5; color: var(--err)">
              {{ $t('ssl_product.field is required') }}
            </div>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="12">
          <a-form-item
            class="newCloud__form-item"
            :label="`${capitalize($t('hostname'))}:`"
          >
            <a-input
              v-model:value="authData.hostname"
              :style="{
                boxShadow: (authData.hostname.length < 2) ? '0 0 2px 2px var(--err)' : null
              }"
              @change="(value) => setOptions('config.hostname', value)"
            />

            <div v-if="authData.hostname.length < 2" style="line-height: 1.5; color: var(--err)">
              {{ $t('ssl_product.field is required') }}
            </div>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="12">
          <a-form-item :label="`${capitalize($t('clientinfo.password'))}:`">
            <password-meter
              :style="{
                height: (authData.password.length > 0) ? '10px' : '0',
                marginTop: (authData.password.length < 1) ? '0' : '-8px'
              }"
              :password="authData.password"
              @score="(value) => authData.score = value.score"
            />

            <a-input-password
              v-model:value="authData.password"
              class="password"
              @change="(value) => setOptions('config.password', value)"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <images-list
      v-if="cloudStore.provider"
      :images="images"
      :os-name="options.os.name"
      :os-price="osPrice"
      :set-o-s="setOS"
    />
  </div>

  <a-alert
    v-else
    show-icon
    type="warning"
    :message="$t('No OS. Choose another plan')"
  />
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'

import { getTarification } from '@/functions.js'
import { useCloudStore } from '@/stores/cloud.js'
import imagesList from '@/components/cloud/create/images.vue'

const props = defineProps({
  mode: { type: String, default: '' },
  productKey: { type: String, required: true },
  productSize: { type: String, required: true }
})

const cloudStore = useCloudStore()
const images = ref([])

const { authData } = storeToRefs(useCloudStore())
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

watch(() => props.productSize, setImages)
if (props.productSize) setImages()

async function setImages () {
  const values = Object.values(cloudStore.plan.products ?? {})
  const product = values.find(({ title, period }) =>
    title === props.productSize && getTarification(period) === props.mode
  )

  if (!product) return
  const { os } = product.meta

  os.sort()
  images.value = os.map((el) => {
    const { title, price } = cloudStore.plan.resources.find(
      ({ key }) => key === el.key
    ) ?? {}

    return { ...el, name: title, desc: title, price }
  })
}

function setOS (item, index) {
  if (item.warning) return
  setOptions('os.id', +index)
  setOptions('os.name', item.name)

  if (item.price) {
    setPrice('addons.os', item.price)
  } else if (price.addons.os !== 0) {
    setPrice('addons.os', 0)
  }

  setOptions(`config.configurations.${item.key}`, item.name)
}

function osPrice (item) {
  return item.price
}
</script>

<script>
export default { name: 'KeywebOsPanel' }
</script>
