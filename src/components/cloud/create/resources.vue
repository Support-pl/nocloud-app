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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrency } from '@/hooks/utils'

const props = defineProps({
  options: { type: Object, required: true },
  itemSP: { type: Object, required: true },
  product: { type: Object, required: true },
  productSize: { type: String, required: true },
  tarification: { type: String, required: true },
  diskSize: { type: String, required: true },
  priceOVH: { type: Object, required: true }
})

const i18n = useI18n()
const { currency } = useCurrency()

const resources = computed(() => {
  return {
    location: {
      title: i18n.t('location'),
      value: props.locationTitle,
      style: {
        paddingBottom: '5px',
        marginBottom: '10px',
        borderBottom: '1px solid #e8e8e8'
      }
    },
    tarif: { title: i18n.t('tariff'), value: props.productSize },
    cpu: {
      title: i18n.t('cpu'),
      value: `${props.options.cpu.size} ${(isNaN(+props.options.cpu.size)) ? '' : 'vCPU'}`,
      visible: props.options.cpu.size && props.options.cpu.size !== 'loading'
    },
    ram: {
      title: i18n.t('ram'),
      value: `${props.options.ram.size} Gb`,
      visible: props.options.ram.size
    },
    gpu: {
      title: i18n.t('gpu'),
      value: `${props.product.resources?.gpu_name} (x${props.product.resources?.gpu_count})`,
      visible: props.product.resources?.gpu_name ?? false
    },
    drive: {
      title: i18n.t('Drive'),
      value: `${props.options.drive ? 'SSD' : 'HDD'} ${props.diskSize}`,
      visible: parseFloat(props.diskSize),
      style: { marginBottom: '5px' }
    },
    os: {
      title: i18n.t('os'),
      value: `${props.options.os.name} ${
        (props.priceOVH.addons.os)
          ? `(${props.priceOVH.addons.os} ${currency.value.code})`
          : ''
      }`,
      visible: props.options.os.name,
      style: { fontSize: '1.1rem' }
    },
    public: {
      title: `${i18n.t('public')} IPv4${
        (props.tarification === 'Hourly') ? '*' : ''
      }`,
      value: props.options.network.public.count,
      visible: props.options.network.public.status && props.itemSP.type !== 'ovh',
      style: { fontSize: '1.1rem' }
    },
    private: {
      title: `${i18n.t('private')} IPv4`,
      value: props.options.network.private.count,
      visible: props.options.network.private.status,
      style: { fontSize: '1.1rem' }
    }
  }
})
</script>

<script>
export default { name: 'CloudResources' }
</script>
