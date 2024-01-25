<template>
  <div v-if="images.length > 0 || !isLoading" class="newCloud__option-field">
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

          <a-form-item v-if="false" :label="`${$t('clientinfo.password')}:`">
            <password-meter
              :style="{
                height: (authData.password.length > 0) ? '10px' : '0',
                marginTop: (authData.password.length < 1) ? '0' : null
              }"
              :password="authData.password"
              @score="(value) => authData.score = value.score"
            />

            <a-input-password v-model:value="authData.password" class="password" />
          </a-form-item>
        </a-form>
      </a-col>
    </a-row>

    <images-list
      v-if="cloudStore.provider"
      :images="images"
      :os-name="options.os.name"
      :os-price="osPrice"
      :set-o-s="setOS"
    />
  </div>

  <a-alert
    v-else-if="!(isFlavorsLoading || isLoading)"
    show-icon
    type="warning"
    :message="$t('No OS. Choose another plan')"
  />
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'

import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'
import api from '@/api.js'
import imagesList from '@/components/cloud/create/images.vue'

const props = defineProps({
  mode: { type: String, required: true },
  productKey: { type: String, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})

const authStore = useAuthStore()
const cloudStore = useCloudStore()

const images = ref([])
const catalog = ref({})
const isLoading = ref(false)

const { authData } = storeToRefs(useCloudStore())
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

watch(() => props.productSize, setImages)
if (props.productSize) setImages()

async function setImages () {
  const planProducts = Object.entries(cloudStore.plan.products ?? {}).filter(
    ([key]) => key.includes(props.productKey)
  )

  if (!planProducts[0]) return
  const { os } = planProducts[0][1].meta

  os.sort()
  try {
    const filteredImages = await filterImages(os)

    changeOS(filteredImages, planProducts)
  } catch (error) {
    changeOS(os, planProducts)
  }
}

function changeOS (list, products) {
  images.value = list.map((el) => ({ name: el, desc: el }))
  images.value.forEach(({ name }, i, array) => {
    if (name.toLowerCase().includes('windows')) {
      array[i].prices = products.map(([key, { meta }]) => ({
        price: { value: meta.windows },
        duration: key.split(' ')[0],
        pricingMode: (key.split(' ')[0] === 'P1Y') ? 'upfront12' : 'default'
      }))
    }
  })
}

async function filterImages (images) {
  let response = null

  try {
    isLoading.value = true
    if (catalog.value.plans) {
      response = { meta: { catalog: catalog.value } }
    } else if (authStore.isLogged) {
      response = await api.servicesProviders.action(
        { action: 'get_plans', uuid: cloudStore.provider.uuid }
      )

      catalog.value = response.meta.catalog
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }

  const { configurations } = response.meta.catalog.plans.find(
    ({ planCode }) => planCode === props.productKey
  )
  const i = configurations.findIndex(({ name }) => name.includes('_os'))
  const os = configurations[i].values

  return images.filter((image) => os.includes(image))
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

  setOptions('config.configuration.vps_os', item.name)
}

function osPrice (prices) {
  const addon = prices.find(({ pricingMode }) => pricingMode === props.mode)

  return addon?.price.value ?? 0
}
</script>

<script>
export default { name: 'OvhVpsOsPanel' }
</script>
