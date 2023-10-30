<template>
  <div class="btn">
    <a-button
      block
      size="small"
      :disabled="service.data?.blocked"
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
import { computed, inject, onMounted, ref } from 'vue'
import { Modal, notification, Switch, Button } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  price: { type: Number, required: true },
  service: { type: Object, required: true },
  currency: { type: Object, required: true }
})

const i18n = useI18n()
const instancesStore = useInstancesStore()
const checkBalance = inject('checkBalance', () => {})

const autoRenew = ref(false)
const isLoading = ref(false)
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
          [key]: curr.price * props.service.resources.drive_size / 1024
        }
      } else if (curr.key === 'ram') {
        const key = i18n.t('ram')

        return {
          ...prev,
          [key]: curr.price * props.service.resources.ram / 1024
        }
      } else if (props.service.resources[curr.key]) {
        const key = i18n.t(curr.key.replace('_', ' '))

        return {
          ...prev,
          [key]: curr.price * props.service.resources[curr.key]
        }
      }
      return prev
    }, {})
  }
})

onMounted(() => {
  autoRenew.value = props.service.config.auto_renew
  isDisabled.value = props.service.data.blocked
})

function moduleEnter () {
  if (!checkBalance(props.price)) return

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

  Modal.confirm({
    title: i18n.t('Do you want to renew server?'),
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
          <span style="line-height: 1.7">{ i18n.t('Automatic renewal') }: </span>
          <Switch
            size="small"
            loading={ isLoading.value }
            checked={ autoRenew.value }
            onChange={ (value) => { autoRenew.value = value } }
          />
          { (props.service.config.auto_renew !== autoRenew.value) &&
            <Button
              size="small"
              type="primary"
              style="margin-left: 5px"
              loading={ isLoading.value }
              onClick={ onClick }
            >
              OK
            </Button>
          }
        </div>

        <div style="margin-top: 10px">
          <div>{ i18n.t('Manual renewal') }:</div>
          <span style="font-weight: 700">{ i18n.t('Tariff price') }: </span>
          { price } { props.currency.code }
          { addonsPrice.value && <div>
            <span style="font-weight: 700">{ i18n.t('Addons prices') }:</span>
            <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
              { Object.entries(addonsPrice.value).map(([key, value]) =>
                <li>{ key }: { value } { props.currency.code }</li>
              ) }
            </ul>
          </div> }

          <div>
            <span style="font-weight: 700">{ i18n.t('Total') }: </span>
            { props.price } { props.currency.code }
          </div>
        </div>
      </div>
    ),
    okText: i18n.t('Yes'),
    cancelText: i18n.t('Cancel'),
    okButtonProps: {
      props: { disabled: isDisabled.value }
    },
    onOk: async () => {
      const data = { uuid: props.service.orderid, action: 'manual_renew' }

      try {
        await instancesStore.invokeAction(data)

        isDisabled.value = true
        notification.success({ message: i18n.t('Done') })
      } catch (error) {
        notification.error({
          message: `Error: ${error?.response?.data?.message ?? 'Unknown'}.`
        })
      }
    },
    onCancel () {}
  })
}

async function onClick () {
  const service = instancesStore.services.find(({ uuid }) =>
    uuid === props.service.uuidService
  )
  const instance = service.instancesGroups
    .find(({ sp }) => sp === props.service.sp).instances
    .find(({ uuid }) => uuid === props.service.uuid)

  try {
    isLoading.value = true
    instance.config.auto_renew = autoRenew.value
    await instancesStore.updateService(service)

    Modal.destroyAll()
    notification.success({ message: i18n.t('Done') })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

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
