<template>
  <div class="btn">
    <a-button
      block
      size="small"
      :disabled="service.data.blocked"
      @click.stop="moduleEnter"
    >
      {{ capitalize($t('renew')) }}
      <span v-if="currency" style="margin-left: 4px">
        {{ (currency.code === 'USD') ? `$${slicedPrice}` : priceWithoutPrefix }}
      </span>
    </a-button>
  </div>
</template>

<script setup lang="jsx">
import { computed, ref } from 'vue'
import { Modal, notification } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/stores/auth.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'
import { createRenewInvoice, toDate } from '@/functions.js'

const props = defineProps({
  price: { type: Number, required: true },
  service: { type: Object, required: true },
  currency: { type: Object, required: true }
})

const i18n = useI18n()
const authStore = useAuthStore()
const namespacesStore = useNamespasesStore()
const instancesStore = useInstancesStore()

const isDisabled = ref(false)
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
    okButtonProps: { disabled: isDisabled.value },
    onOk: async () => {
      if (namespacesStore.namespaces.length < 1) {
        await namespacesStore.fetch()
      }

      const { access: { namespace } } = instancesStore.services.find(
        ({ uuid }) => uuid === props.service.uuidService
      )
      const { access } = namespacesStore.namespaces.find(
        ({ uuid }) => uuid === namespace
      )
      const account = access.namespace ?? namespace

      return createRenewInvoice(props.service, props.service.uuidService, account, authStore.baseURL)
        .then(() => {
          notification.success({ message: 'Done!' })
          isDisabled.value = true
        })
        .catch((error) => {
          notification.error({
            message: `Error: ${error?.response?.data?.message ?? 'Unknown'}.`
          })
        })
        .finally(Modal.destroyAll)
    },
    onCancel () {}
  })
}

isDisabled.value = props.service.data.blocked
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
