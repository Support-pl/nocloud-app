<template>
  <div class="Fcloud">
    <slot name="header" />
    <keyweb-actions :vm="VM" />

    <div class="Fcloud__info">
      <div class="Fcloud__info-header">
        <div class="Fcloud__info-title">
          {{ $t("Information") }}
        </div>
      </div>
      <div
        v-if="VM.state?.meta.networking"
        class="Fcloud__info-block block"
      >
        <div class="Fcloud__block-header">
          <flag-icon /> IP
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column" style="flex-direction: row">
            <div
              v-if="provider" class="block__value" style="font-size: 18px"
            >
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in VM.state?.meta.networking.public" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="provider" class="block__value" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in VM.state?.meta.networking.private" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <env-icon /> {{ $t("Location") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div
              v-if="provider"
              class="block__value"
              style="font-size: 18px"
            >
              {{ provider.locations[0].title }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <info-icon /> {{ capitalize($t("info")) }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              OS
            </div>
            <div class="block__value">
              {{ OSName || $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.product" class="block__column">
            <div class="block__title">
              {{ $t('Product') }}
            </div>
            <div class="block__value">
              {{ productName || $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.data.next_payment_date" class="block__column">
            <div class="block__title">
              {{ capitalize($t("userService.next payment date")) }}
            </div>
            <div class="block__value">
              {{ new Intl.DateTimeFormat().format(VM.data.next_payment_date * 1000) }}
              <sync-icon v-if="false" title="Renew" @click="sendRenew" />
            </div>
          </div>

          <div class="block__column">
            <div class="block__title">
              {{ capitalize($t('userService.auto renew')) }}
            </div>
            <div class="block__value">
              {{ VM.config.auto_renew ? $t('enabled') : $t('disabled') }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <card-icon /> {{ capitalize($t("prices")) }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <template v-if="tariffPrice">
            <div class="block__column block__column_table">
              <div class="block__title">
                {{ capitalize($t('tariff')) }}
              </div>
            </div>
            <div class="block__column block__column_table block__column_price">
              <div class="block__title">
                {{ productName || $t('No Data') }}:
              </div>
              <div class="block__value">
                {{ +tariffPrice.toFixed(2) }} {{ currency.code }}
              </div>
            </div>
          </template>

          <div class="block__column block__column_table">
            <div class="block__title">
              {{ $t('Addons') }}
            </div>
          </div>
          <div
            v-for="(price, addon) in addonsPrice"
            :key="addon"
            class="block__column block__column_table block__column_price"
          >
            <div class="block__title">
              {{ addon }}:
            </div>
            <div class="block__value">
              {{ +price.toFixed(2) }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table block__column_total">
            <div class="block__title">
              {{ $t('Total') }}:
            </div>
            <div class="block__value">
              {{ +fullPrice.toFixed(2) }} {{ currency.code }}
            </div>
          </div>
        </div>
      </div>

      <a-row v-if="VM.state" :gutter="[15, 15]" style="margin-top: 20px">
        <a-col :span="24" :md="12">
          <a-button
            block
            type="primary"
            shape="round"
            size="large"
            :loading="isVNCLoading"
            :disabled="!(VM.state.state === 'RUNNING') || VM.data.lock"
            @click="openVNC"
          >
            VNC
          </a-button>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="jsx">
import { computed, defineAsyncComponent, ref, onMounted } from 'vue'
import { Button, Modal, Switch } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useSpStore } from '@/stores/sp.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePlansStore } from '@/stores/plans.js'
import { useInstancesStore } from '@/stores/instances.js'

import { useCurrency, useNotification } from '@/hooks/utils'
import { toDate } from '@/functions.js'
import api from '@/api.js'

import keywebActions from '@/components/cloud/modules/keyweb/actions.vue'

const props = defineProps({
  VM: { type: Object, required: true }
})

const flagIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/FlagFilled')
)
const envIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/EnvironmentOutlined')
)
const infoIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/InfoCircleOutlined')
)

const syncIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SyncOutlined')
)
const cardIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CreditCardOutlined')
)

const route = useRoute()
const i18n = useI18n()

const spStore = useSpStore()
const authStore = useAuthStore()
const plansStore = usePlansStore()
const instancesStore = useInstancesStore()

const { currency } = useCurrency()
const { openNotification } = useNotification()

const isVNCLoading = ref(false)
const isLoading = ref(false)
const autoRenew = ref(false)

const provider = computed(() =>
  spStore.servicesProviders.find(({ uuid }) => uuid === props.VM.sp)
)

const plan = computed(() => {
  const { products, uuid } = props.VM.billingPlan

  if (products[props.VM.product]?.meta) {
    return props.VM.billingPlan
  }

  return plansStore.plans.find((plan) => plan.uuid === uuid)
})

const tariffPrice = computed(() =>
  plan.value.products[props.VM.product]?.price ?? 0
)

const addonsPrice = computed(() => {
  if (!plan.value) return {}
  const configs = props.VM.config.configurations

  return Object.values(configs).reduce((prev, curr) => {
    const productKey = `${curr}$${props.VM.product}`
    let key = i18n.t('os')

    if (curr.toLowerCase().includes('backup')) {
      key = i18n.t('backup')
    }
    return {
      ...prev,
      [key]: plan.value.resources.find(({ key }) => key === productKey)?.price ?? 0
    }
  }, {})
})

const fullPrice = computed(() =>
  tariffPrice.value + Object.values(addonsPrice.value)
    .reduce((sum, curr) => sum + curr, 0)
)

const OSName = computed(() => {
  const product = plan.value.products[props.VM.product]
  if (!product?.meta.os) return

  const configs = props.VM.config.configurations
  const image = product.meta.os.find((key) =>
    Object.values(configs).includes(key.split('$')[0])
  )
  const { meta: { type } } = plan.value.resources.find(
    ({ key }) => key === image
  ) ?? { meta: {} }
  const key = `${configs[type]}$${props.VM.product}`

  return plan.value.resources.find((resource) => resource.key === key)?.title
})

const productName = computed(() =>
  plan.value.products[props.VM.product]?.title ?? props.VM.product
)

function sendRenew () {
  const { period } = plan.value.products[props.VM.product]
  const currentPeriod = toDate(props.VM.data.next_payment_date)
  const newPeriod = toDate(props.VM.data.next_payment_date + +period)

  Modal.confirm({
    title: i18n.t('Do you want to renew server?'),
    content: () => (
      <div>
        <div style="font-weight: 700">{ `${props.VM.title}` }</div>
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
          { (props.VM.config.auto_renew !== autoRenew.value) &&
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
          { tariffPrice.value } { currency.value.code }
          <div>
            <span style="font-weight: 700">{ i18n.t('Addons prices') }:</span>
            <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
              { Object.entries(addonsPrice.value).map(([key, value]) =>
                <li>{ key }: { value } { currency.value.code }</li>
              ) }
            </ul>
          </div>

          <div>
            <span style="font-weight: 700">{ i18n.t('Total') }: </span>
            { fullPrice.value } { currency.value.code }
          </div>
        </div>
      </div>
    ),
    okText: i18n.t('Yes'),
    cancelText: i18n.t('Cancel'),
    okButtonProps: { disabled: (props.VM.data.blocked) },
    onOk: () => renewInstance(),
    onCancel () {}
  })
}

async function renewInstance () {
  const data = { uuid_instans: props.VM.uuid, run: 'invoice_instans_renew' }

  try {
    await api.get(authStore.baseURL, { params: data })

    openNotification('success', { message: i18n.t('Done') })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message: i18n.t(message) })
  }
}

async function onClick () {
  const service = instancesStore.services.find(
    ({ uuid }) => uuid === props.VM.uuidService
  )
  const instance = service.instancesGroups
    .find(({ sp }) => sp === props.VM.sp).instances
    .find(({ uuid }) => uuid === props.VM.uuid)

  try {
    isLoading.value = true
    instance.config.auto_renew = autoRenew.value
    await instancesStore.updateService(service)

    Modal.destroyAll()
    openNotification('success', { message: i18n.t('Done') })
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function openVNC () {
  try {
    isVNCLoading.value = true
    const response = await instancesStore.invokeAction({
      uuid: route.params.uuid, action: 'start_vnc'
    })

    location.replace(response.meta.url)
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  } finally {
    isVNCLoading.value = false
  }
  // router.push({ name: 'VNC', params: { uuid: route.params.uuid } })
}

onMounted(() => {
  autoRenew.value = props.VM.config.auto_renew
})

plansStore.fetch({ anonymously: false, sp_uuid: props.VM.sp })
</script>

<script lang="jsx">
export default { name: 'OpenInstanceKeyweb' }
</script>

<style scoped>
.block-content_table {
  position: relative;
  display: grid;
  padding: 10px 15px;
}

.block-content_table::before {
  content: '';
  position: absolute;
  bottom: 40px;
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
  background: var(--gray);
}

.block-content_table::after {
  content: "";
  position: absolute;
  top: 35px;
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
  background: var(--gray);
}

.block__column_table {
  flex-direction: row;
  justify-content: start;
  gap: 7px;
}

.block__column_price {
  grid-column: 2 / 3;
  justify-content: end;
  overflow: hidden;
}

.block__column_price .block__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.block__column_price .block__value {
  white-space: nowrap;
}

.block__column_total {
  grid-column: 1 / 3;
  justify-content: end;
  margin-top: 5px;
}

@media (max-width: 575px) {
  .block-content_table {
    justify-content: initial;
  }
}
</style>
