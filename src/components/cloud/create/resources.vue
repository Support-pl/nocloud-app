<template>
  <transition
    v-for="(item, key) in resources"
    :key="key"
    name="networkApear"
  >
    <a-row
      v-if="item.visible ?? true"
      justify="space-between"
      style="font-size: 1.2rem"
      :style="item.style"
    >
      <a-col>{{ capitalize(item.title) }}:</a-col>
      <a-col>{{ item.value }}</a-col>
    </a-row>
  </transition>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrency } from '@/hooks/utils'
import { useCloudStore } from '@/stores/cloud.js'

const props = defineProps({
  productSize: { type: String, required: true },
  tarification: { type: String, required: true }
})

const i18n = useI18n()
const { currency } = useCurrency()
const cloudStore = useCloudStore()

const product = inject('product', {})
const [options] = inject('useOptions', () => [])()
const [priceOVH] = inject('usePriceOVH', () => [])()

const locationTitle = computed(() => {
  if (cloudStore.provider?.type !== 'ovh') {
    return cloudStore.provider?.locations[0].title
  }

  const { configuration = {} } = options.config
  const key = Object.keys(configuration).find(
    (el) => el.includes('datacenter')
  )

  return cloudStore.provider.locations?.find(({ extra }) =>
    `${extra.region}`.toLowerCase() === `${configuration[key]}`.toLowerCase()
  )?.title
})

const diskSize = computed(() => {
  // const x = (cloudStore.plan.type === 'ovh cloud') ? 1000 : 1024
  const size = options.disk.size / 1024

  if (isNaN(size)) return options.disk.size
  if (size > 1024) return `${(size / 1024).toFixed(1)} Tb`
  if (size >= 1) return `${size.toFixed(1)} Gb`
  return `${options.disk.size.toFixed(1)} Mb`
})

const resources = computed(() => ({
  location: {
    title: i18n.t('location'),
    value: locationTitle.value,
    style: {
      paddingBottom: '5px',
      marginBottom: '10px',
      borderBottom: '1px solid #e8e8e8'
    }
  },
  tarif: { title: i18n.t('tariff'), value: props.productSize },
  cpu: {
    title: i18n.t('cpu'),
    value: `${options.cpu.size} ${(isNaN(+options.cpu.size)) ? '' : 'vCPU'}`,
    visible: options.cpu.size && options.cpu.size !== 'loading'
  },
  ram: {
    title: i18n.t('ram'),
    value: `${+(options.ram.size).toFixed(1)} Gb`,
    visible: options.ram.size
  },
  gpu: {
    title: i18n.t('gpu'),
    value: `${product.value.resources?.gpu_name} (x${product.value.resources?.gpu_count})`,
    visible: product.value.resources?.gpu_name ?? false
  },
  drive: {
    title: i18n.t('Drive'),
    value: `${options.disk.type} ${diskSize.value}`,
    visible: parseFloat(diskSize.value),
    style: { marginBottom: '5px' }
  },
  os: {
    title: i18n.t('os'),
    value: `${options.os.name} ${
      (priceOVH.addons.os)
        ? `(${priceOVH.addons.os} ${currency.value.code})`
        : ''
    }`,
    visible: options.os.name && !options.os.name.includes('none'),
    style: { fontSize: '1.1rem' }
  },
  public: {
    title: `${i18n.t('public')} IPv4${
      (props.tarification === 'Hourly') ? '*' : ''
    }`,
    value: options.network.public.count,
    visible: options.network.public.status && cloudStore.provider?.type !== 'ovh',
    style: { fontSize: '1.1rem' }
  },
  private: {
    title: `${i18n.t('private')} IPv4`,
    value: options.network.private.count,
    visible: options.network.private.status,
    style: { fontSize: '1.1rem' }
  }
}))
</script>

<script>
export default { name: 'CloudResources' }
</script>
