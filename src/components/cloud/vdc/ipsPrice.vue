<template>
  <a-flex gap="middle">
    <h3 class="cloud__title">
      <span style="white-space: nowrap">
        IPv4 {{ $t('quantity') }}:
      </span>

      <span style="white-space: nowrap">
        {{ ipsQuantity }}
      </span>
    </h3>

    <a-flex align="center" gap="small">
      <dollar-icon style="font-size: 25px" />
      <h3 class="cloud__title">
        <span style="white-space: nowrap">
          {{ capitalize($t('usage')) }}:
        </span>

        <span style="white-space: nowrap">
          {{ price }} {{ currency.code }}/{{ $tc('month', 0) }}
        </span>
      </h3>
    </a-flex>
  </a-flex>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useInstancesStore } from '@/stores/instances.js'
import { useCurrency } from '@/hooks/utils'

const dollarIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/DollarCircleOutlined')
)

const props = defineProps({
  instances: { type: Array, required: true },
  selected: { type: String, required: true }
})

const instancesStore = useInstancesStore()
const { currency } = useCurrency()

const price = computed(() => {
  const result = []

  props.instances.forEach((inst) => {
    if (props.selected && props.selected !== inst.groupUuid) return

    const resources = inst.billingPlan.resources.filter(
      ({ key }) => key.includes('ips')
    )

    resources.forEach(({ price = 0, period = 2592000 }) => {
      const k = period / 2592000

      result.push(+(price / k).toFixed(2))
    })
  })

  return result.reduce((sum, num) => +sum + +num, 0)
})

const ipsQuantity = computed(() => {
  const result = []

  instancesStore.services.forEach((service) => {
    service.instancesGroups.forEach((group) => {
      group.instances.forEach((inst) => {
        if (group.type !== 'ione') return
        if (props.selected && props.selected !== group.uuid) return

        result.push(inst.resources.ips_public)
        result.push(inst.resources.ips_private)
      })
    })
  })

  return result.reduce((sum, num) => sum + num, 0)
})
</script>

<script>
export default { name: 'VDCIpsPrice' }
</script>

<style scoped>
.cloud__title {
  display: flex;
  flex-wrap: wrap;
  gap: 0 4px;
  margin: 0;
}
</style>
