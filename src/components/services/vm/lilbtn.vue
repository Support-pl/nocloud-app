<template>
  <div class="btn">
    <a-button
      block
      size="small"
      :disabled="service.data?.blocked"
      @click.stop="isVisible = !isVisible"
    >
      {{ capitalize($t('renew')) }}
      <span v-if="currency" style="margin-left: 4px">
        {{ (currency.code === 'USD') ? `$${slicedPrice}` : priceWithoutPrefix }}
      </span>
    </a-button>
  </div>
  <renewal-modal v-bind="renewalProps" v-model:visible="isVisible" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import renewalModal from '@/components/ui/renewalModal.vue'

const props = defineProps({
  price: { type: Number, required: true },
  service: { type: Object, required: true },
  currency: { type: Object, required: true }
})

const i18n = useI18n()
const isVisible = ref(false)

const slicedPrice = computed(() => {
  if (`${props.price}`.replace('.').length > 3) {
    return (`${props.price}`[2] === '.')
      ? `${props.price.toString().slice(0, 4)}...`
      : `${props.price.toString().slice(0, 3)}...`
  } else {
    return props.price
  }
})

const priceWithoutPrefix = computed(() => {
  const code = (`${props.price}`.replace('.').length > 3) ? '' : props.currency.code

  return `${slicedPrice.value} ${code}`
})

const addonsPrice = computed(() => {
  if (props.service.billingPlan.type.includes('ovh')) {
    return props.service.config.addons?.reduce((res, addon) => {
      const { billingPlan, config } = props.service
      const addonKey = (billingPlan.type.includes('dedicated'))
        ? `${config.duration} ${config.planCode} ${addon}`
        : `${config.duration} ${addon}`

      const { price } = props.service.billingPlan.resources
        .find(({ key }) => key === addonKey) ?? { price: 0 }
      let key = ''

      if (addon.includes('ram')) key = i18n.t('ram')
      if (addon.includes('raid')) key = i18n.t('Drive')
      if (addon.includes('additional')) key = i18n.t('adds drive')
      if (addon.includes('snapshot')) key = i18n.t('Snapshot')
      if (addon.includes('backup')) key = i18n.t('Backup')
      if (addon.includes('windows')) key = i18n.t('Windows')

      return { ...res, [key]: +price }
    }, {})
  } else {
    return props.service.billingPlan.resources.reduce((prev, curr) => {
      if (curr.key === `drive_${props.service.resources.drive_type.toLowerCase()}`) {
        const key = i18n.t('Drive')

        return {
          ...prev,
          [key]: +(curr.price * props.service.resources.drive_size / 1024).toFixed(2)
        }
      } else if (curr.key === 'ram') {
        const key = i18n.t('ram')

        return {
          ...prev,
          [key]: +(curr.price * props.service.resources.ram / 1024).toFixed(2)
        }
      } else if (props.service.resources[curr.key]) {
        const key = i18n.t(curr.key.replace('_', ' '))

        return {
          ...prev,
          [key]: +(curr.price * props.service.resources[curr.key]).toFixed(2)
        }
      }
      return prev
    }, {})
  }
})

const renewalProps = computed(() => {
  const key = (!props.service.product)
    ? `${props.service.config.duration} ${props.service.config.planCode}`
    : props.service.product
  const { period, price } = props.service.billingPlan.products[key]

  const currentPeriod = (props.service.data.expiration)
    ? props.service.data.expiration
    : toDate(null, props.service.data.next_payment_date)

  const newPeriod = (props.service.data.expiration)
    ? toDate(props.service.data.expiration, +period)
    : toDate(null, props.service.data.next_payment_date + +period)

  return {
    service: props.service,
    currentPeriod,
    newPeriod,
    price,
    addonsPrice: addonsPrice.value,
    currentAutoRenew: props.service.config.auto_renew,
    blocked: props.service.data.blocked
  }
})

function toDate (string, timestamp) {
  if (timestamp < 1) return '-'

  const dateFromString = (string) ? new Date(string).getTime() : 0
  const date = new Date(timestamp * 1000 + dateFromString)
  const time = date.toTimeString().split(' ')[0]

  const year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  if (`${month}`.length < 2) month = `0${month}`
  if (`${day}`.length < 2) day = `0${day}`

  if (string) return `${year}-${month}-${day}`
  return `${day}.${month}.${year} ${time}`
}
</script>

<script>
export default { name: 'LittleButton' }
</script>

<style scoped>
.btn {
  grid-column: 2 / 4;
  justify-self: end;
  width: fit-content;
}

.btn button {
  height: 100%;
}
</style>
