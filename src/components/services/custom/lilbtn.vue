<template>
  <div class="btn">
    <a-button block :disabled="service.data.blocked" @click.stop="moduleEnter">
      {{ $t('renew') | capitalize }}
      <template v-if="currency">
        {{ (currency.code === 'USD') ? `$${slicedPrice}` : priceWithoutPrefix }}
      </template>
    </a-button>
  </div>
</template>

<script setup lang="jsx">
import { computed, inject, set } from 'vue'
import { Modal, notification } from 'ant-design-vue'
import i18n from '@/i18n'

import { useAppStore } from '@/stores/app.js'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  price: { type: Number, required: true },
  service: { type: Object, required: true },
  currency: { type: Object, required: true }
})

const { toDate } = useAppStore()
const instancesStore = useInstancesStore()
const checkBalance = inject('checkBalance', () => {})

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

function moduleEnter () {
  if (!checkBalance(props.price)) return

  const key = props.service.product
  const { period } = props.service.billingPlan.products[key]

  const currentPeriod = toDate(props.service.data.next_payment_date)

  const newPeriod = toDate(props.service.data.next_payment_date + +period)

  Modal.confirm({
    title: i18n.t('Do you want to renew service?'),
    content: () => (
      <div>
        <div style="font-weight: 700">{ `${props.service.title}` }</div>
        <div>
          { `${i18n.t('from')} ` }
          <span style="font-style: italic">{ `${currentPeriod}` }</span>
        </div>
        <div>
          { `${i18n.t('to')} ` }
          <span style="font-style: italic">{ `${newPeriod}` }</span>
        </div>

        <div style="margin-top: 10px">
          <span style="font-weight: 700">{ i18n.t('Tariff price') }: </span>
          { props.price } { props.currency.code }
        </div>
      </div>
    ),
    okText: i18n.t('Yes'),
    cancelText: i18n.t('Cancel'),
    okButtonProps: {
      props: { disabled: (props.service.data.blocked) }
    },
    onOk: async () => {
      const data = { uuid: props.service.uuid, action: 'manual_renew' }

      return instancesStore.invokeAction(data)
        .then(() => {
          notification.success({ message: 'Done!' })
          set(props.service.data, 'blocked', true)
        })
        .catch((error) => {
          notification.error({
            message: `Error: ${error?.response?.data?.message ?? 'Unknown'}.`
          })
        })
    },
    onCancel () {}
  })
}
</script>

<script lang="jsx">
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
