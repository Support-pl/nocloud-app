<template>
  <template v-if="!isFlavorsLoading">
    <a-row v-for="(addon, key) in addons" :key="key" class="newCloud__prop">
      <a-col span="8" :xs="6">
        {{ capitalize($t(key)) }}:
      </a-col>
      <a-col span="16" :xs="18">
        <a-select
          default-value="-1"
          style="width: 100%"
          :value="addonName(addon)"
          @change="(value) => setAddon(value, addon[value], key)"
        >
          <a-select-option value="-1">
            {{ $t('none') }}
          </a-select-option>
          <a-select-option v-for="(item, id) in addon" :key="id">
            {{ item.title }} ({{ addonPrice(item) }})
          </a-select-option>
        </a-select>
      </a-col>
    </a-row>
  </template>
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { inject, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrency } from '@/hooks/utils'

const props = defineProps({
  addons: { type: Object, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})

const route = useRoute()
const { currency } = useCurrency()
const [options, setOptions] = inject('useOptions', () => [])()
const [price, setPrice] = inject('usePriceOVH', () => [])()

watch(() => props.addons, (value) => {
  const data = (localStorage.getItem('data'))
    ? JSON.parse(localStorage.getItem('data'))
    : JSON.parse(route.query.data ?? '{}')

  if (!data.ovhConfig) return
  if (data.ovhConfig.addons.length < 1) return

  options.config.addons.forEach((addon) => {
    const keys = Object.keys(value)
    const key = keys.find((el) => addon.includes(el))

    if (!value[key][addon]) return
    setAddon(addon, value[key][addon], key)
  })
})

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

function setAddon (code, addon, key) {
  const addonsPrices = JSON.parse(JSON.stringify(price.value.addons))
  const addonsCodes = JSON.parse(JSON.stringify(options.config.addons))

  if (code === '-1') {
    delete addonsPrices[key]
    addonsCodes.splice(addonsCodes.indexOf(code), 1)
  } else {
    const period = addon.periods.find(({ pricingMode }) => pricingMode === mode.value)

    addonsPrices[key] = period.price.value
    addonsCodes.push(code)
  }

  setPrice('addons', addonsPrices)
  setOptions('config.addons', addonsCodes)
}

function addonName (addons) {
  const keys = Object.keys(addons)

  return options.config.addons.find((el) => keys.includes(el)) ?? '-1'
}

function addonPrice ({ periods }) {
  const period = periods.find(({ pricingMode }) => pricingMode === mode.value) ??
    { price: { value: 0 } }
  const price = +(period.price.value * currency.value.rate).toFixed(2)

  return `${price} ${currency.value.code}`
}
</script>

<script>
export default { name: 'OvhAddons' }
</script>
