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
              :value="authData.username"
              :style="{
                boxShadow: (authData.username.length < 2) ? '0 0 2px 2px var(--err)' : null
              }"
              @update:value="authData.username = $event; setOptions('config.username', $event)"
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
              :value="authData.hostname"
              :style="{
                boxShadow: (authData.hostname.length < 2) ? '0 0 2px 2px var(--err)' : null
              }"
              @update:value="authData.hostname = $event; setOptions('config.hostname', $event)"
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
              :value="authData.password"
              class="password"
              @update:value="authData.password = $event; setOptions('config.password', $event)"
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
import { inject, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'

import { useCloudStore } from '@/stores/cloud.js'
import { useAddonsStore } from '@/stores/addons.js'

import imagesList from '@/components/ui/images.vue'

const props = defineProps({
  mode: { type: String, default: '' },
  productSize: { type: String, required: true },
  plans: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  isFlavorsLoading: { type: Boolean, default: false }
})

const cloudStore = useCloudStore()
const addonsStore = useAddonsStore()
const images = ref([])

const { authData } = storeToRefs(useCloudStore())
const [product] = inject('useProduct', () => [])()
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

watch(() => addonsStore.addons, setImages)
watch(() => props.productSize, setImages)
if (props.productSize) setImages()

async function setImages () {
  await nextTick()

  if (!product.value) return
  const filtered = addonsStore.addons.filter(({ uuid }) =>
    cloudStore.plan.addons.includes(uuid) || product.value.addons?.includes(uuid)
  )
  const list = []

  filtered.forEach((item) => {
    const { uuid, title, periods, meta, system, group, public: enabled } = item
    const isEqualGroup = group === cloudStore.plan.uuid
    const isIncluded = meta.type?.includes('OS')

    if (title.toLowerCase().includes('disabled')) return
    if (!system || !isIncluded) return
    if (!enabled || !isEqualGroup) return

    list.push({
      key: uuid,
      name: title,
      desc: title,
      type: meta.type,
      price: periods[product.value.period]
    })
  })

  images.value = list
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

  setOptions(`config.configurations.${item.type}`, item.key.split('$')[0])
}

function osPrice (item) {
  return item.price
}
</script>

<script>
export default { name: 'KeywebOsPanel' }
</script>
