<template>
  <div v-if="filteredPlans.length > 0" class="newCloud__calculate order__field">
    <editor-container
      v-if="locationDescription && activeKey === 'location'"
      :value="locationDescription"
    />

    <template v-else>
      <!-- Location Tarif CPU RAM GPU Drive os network -->
      <cloud-resources
        :product-size="productSize"
        :tarification="tarification"
      />

      <!-- addons -->
      <transition-group name="networkApear">
        <a-row
          v-for="(addon, key) in addons"
          :key="addon"
          justify="space-between"
          style="font-size: 1.1rem"
        >
          <a-col> {{ capitalize($t(key)) }}{{ getAddonsValue(key) }}: </a-col>
          <a-col> {{ +(addon * currency.rate).toFixed(2) }} {{ currency.code }} </a-col>
        </a-row>
      </transition-group>

      <selects-to-create
        v-model:plan="cloudStore.planId"
        v-model:service="cloudStore.serviceId"
        v-model:namespace="cloudStore.namespaceId"
        :plans-list="filteredPlans"
        :is-plans-visible="false"
      />
    </template>

    <transition name="networkApear">
      <a-row
        v-if="installationFee"
        justify="space-between"
        style="
          font-size: 1.2rem;
          padding-top: 5px;
          margin-top: 10px;
          border-top: 1px solid #e8e8e8;
        "
      >
        <a-col> {{ capitalize($t('installation')) }}: </a-col>
        <a-col style="margin-left: auto">
          {{ +(installationFee * currency.rate).toFixed(2) }} {{ currency.code }}
        </a-col>
      </a-row>
    </transition>

    <transition name="networkApear">
      <a-row
        justify="space-between"
        style="font-size: 1.2rem; gap: 5px"
        :style="(!installationFee) ? {
          paddingTop: '5px',
          marginTop: '10px',
          borderTop: '1px solid #e8e8e8'
        } : null"
      >
        <a-col> {{ capitalize($t('recurring payment')) }}: </a-col>
        <a-col style="margin-left: auto">
          {{ +(productFullPrice - (installationFee ?? 0)).toFixed(2) }} {{ currency.code }}
        </a-col>
      </a-row>
    </transition>

    <a-divider
      orientation="left"
      style="margin-bottom: 0; margin-top: 5px"
    >
      {{ $t("Total") }}:
    </a-divider>
    <a-row justify="center" style="margin-top: 15px">
      <a-col>
        <a-radio-group
          default-value="Monthly"
          :value="tarification"
          :style="{ display: 'grid', textAlign: 'center', gridTemplateColumns: periodColumns }"
          @update:value="emits('update:tarification', $event)"
        >
          <a-radio-button
            v-for="period of periods"
            :key="period.value"
            :value="period.value"
          >
            {{ capitalize($t(period.label || period.value)) }}
          </a-radio-button>
        </a-radio-group>
      </a-col>
    </a-row>

    <a-row
      ref="sumOrder"
      justify="center"
      :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
    >
      <a-col v-if="activeKey === 'location' && tarification" style="margin-right: 4px">
        {{ capitalize($t('from')) }}:
      </a-col>
      <transition name="textchange" mode="out-in">
        <a-col>
          {{ +(productFullPrice).toFixed(2) }} {{ currency.code }}
        </a-col>
      </transition>
    </a-row>

    <cloud-create-button
      :tarification="tarification"
      :create-order="createOrder"
      :panels="panels"
    />
  </div>
</template>

<script setup>
import { computed, inject, toRefs, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditorContainer } from 'nocloud-ui'

import { useCloudStore } from '@/stores/cloud.js'
import { useCurrency } from '@/hooks/utils'
import useCloudPrices from '@/hooks/cloud/prices.js'

import selectsToCreate from '@/components/ui/selectsToCreate.vue'
import cloudResources from '@/components/cloud/create/resources.vue'
import cloudCreateButton from '@/components/cloud/create/button.vue'

const props = defineProps({
  productSize: { type: String, required: true },
  tarification: { type: String, required: true },
  filteredPlans: { type: Array, required: true },
  periods: { type: Object, required: true },
  panels: { type: Array, required: true }
})
const emits = defineEmits(['update:tarification'])

const i18n = useI18n()
const { currency } = useCurrency()
const cloudStore = useCloudStore()

const product = inject('product', {})
const [options] = inject('useOptions', () => [])()
const [priceOVH] = inject('usePriceOVH', () => [])()

const sumOrder = ref()
const checkBalance = inject('checkBalance', () => {})

const addons = computed(() => {
  const addons = { ...priceOVH.addons }

  if (cloudStore.plan.type?.includes('dedicated')) {
    delete addons.disk
  }

  delete addons.os
  delete addons.ram
  return addons
})

const locationDescription = computed(() => {
  const { showcase: id } = cloudStore.locations.find(
    (el) => el.id === cloudStore.locationId
  ) ?? {}
  const showcase = cloudStore.showcases.find(({ uuid }) => uuid === id)

  if (!showcase?.promo) return
  return showcase?.promo[i18n.locale.value]?.service.description
})

const periodColumns = computed(() => {
  const { length } = Object.keys(props.periods)

  if (length === 4) return 'repeat(2, 1fr)'
  return `repeat(${(length < 3) ? length : 3}, 1fr)`
})

const [activeKey] = inject('useActiveKey', () => [])()
const { tarification, productSize } = toRefs(props)
const { productFullPrice, installationFee } = useCloudPrices(product, tarification, activeKey, options, priceOVH)

function getAddonsValue (key) {
  const addon = options.config.addons?.find((el) => el.includes(key))
  const value = parseFloat(addon?.split('-')?.at(-1))

  return isFinite(value) ? ` (${value} Gb)` : ''
}

async function createOrder () {
  const sum = sumOrder.value.$el.firstElementChild.innerText

  if (!checkBalance(sum)) return
  await cloudStore.createOrder(options, product)
}
</script>

<script>
export default { name: 'CalculatorBlock' }
</script>
