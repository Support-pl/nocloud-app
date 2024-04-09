<template>
  <div class="cloud__item-wrapper" @click="(e) => cloudClick(instance, e)">
    <div class="cloud__item">
      <div
        class="item__color"
        :title="instance.domainstatus"
        :style="{ 'background-color': statusColor }"
      />
      <div class="item__title">
        {{ instance.productname }}
      </div>
      <div class="item__status" style="text-align: right">
        {{ locationTitle }}
      </div>
      <div class="item__date" :style="{ background: dateColor }">
        {{ localDate }}
      </div>

      <div v-if="networking.length < 1 && instance.groupname === 'Self-Service VDS SSD HC'" class="item__status">
        IP: {{ $t("ip.none") }}
      </div>
      <div v-else-if="networking.length < 2" class="item__status">
        {{ instance.domain ?? instance.groupname }}
      </div>

      <a-collapse v-else v-model:activeKey="activeKey" expand-icon-position="right" :bordered="false">
        <a-collapse-panel key="1" :header="title">
          <div v-for="(item, index) in networking" :key="index">
            {{ item }}
          </div>
        </a-collapse-panel>
      </a-collapse>

      <a-tooltip
        v-if="getModuleProductBtn && `${price}`.replace('.').length > 3"
        placement="bottom"
        :title="`${price} ${currency.code}`"
      >
        <component :is="getModuleProductBtn" :service="instance" :price="price" :currency="currency" />
      </a-tooltip>

      <component
        :is="getModuleProductBtn"
        v-else-if="getModuleProductBtn"
        :service="instance"
        :price="price"
        :currency="currency"
      />
      <a-button
        v-else-if="instance.domainstatus.toLowerCase() === 'pending' && !isPayg"
        block
        size="small"
        style="
          grid-column: 2 / 4;
          justify-self: end;
          width: fit-content;
        "
        @click.stop="toInvoices"
      >
        {{ $t('pay from balance') }}: {{ price }} {{ currency.code }}
      </a-button>

      <div v-else-if="currency.code && price" class="item__cost">
        {{ currency.code === 'USD' ? `$${price}` : `${price} ${currency.code}` }}
      </div>
      <div v-else-if="price" class="item__cost">
        {{ `$${price}` }}
      </div>
    </div>

    <!-- <div class="cloud__label cloud__label__mainColor">
      {{ instance.billingPlan.kind === "STATIC" ? $t("PrePaid") : $t("PAYG") }}
    </div> -->
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSpStore } from '@/stores/sp.js'
import { useCurrency } from '@/hooks/utils'

import api from '@/api.js'
import config from '@/appconfig.js'

const props = defineProps({
  instance: { type: Object, required: true }
})

const i18n = useI18n()
const router = useRouter()

const providersStore = useSpStore()
const { currency } = useCurrency()

const activeKey = ref([])
const prices = ref({})

const statusColor = computed(() => {
  switch (props.instance.domainstatus) {
    case 'RUNNING':
    case 'Active':
      return 'var(--success)'
    // останавливающийся и запускающийся
    case 'BOOT':
    case 'BUILD':
    case 'BOOT_POWEROFF':
    case 'SHUTDOWN_POWEROFF':
      return 'var(--warn)'
    case 'LCM_INIT':
    case 'STOPPED':
    case 'SUSPENDED':
      return '#ff9140'
    case 'OPERATION':
    case 'PENDING':
    case 'Pending':
      return 'var(--main)'
    default:
      return 'var(--err)'
  }
})

const locationTitle = computed(() => {
  const sp = providersStore.servicesProviders.find(
    ({ uuid }) => uuid === props.instance.sp
  )
  if (sp?.type !== 'ovh') return sp?.locations[0]?.title

  const { configuration = {}, region } = props.instance.config
  const key = Object.keys(configuration).find(
    (el) => el.includes('datacenter')
  ) ?? 'region'

  if (key === 'region') configuration.region = region

  return sp.locations?.find(({ extra }) =>
    `${extra.region}`.toLowerCase() === configuration[key].toLowerCase()
  )?.title
})

const price = computed(() => {
  const amount = prices.value[props.instance.resources?.period] ??
    props.instance.recurringamount ?? props.instance.orderamount

  return +(+amount)?.toFixed(2) ?? 0
})

const isPayg = computed(() => {
  const { groupname, config, billingPlan, type } = props.instance ?? {}

  if (groupname === 'OpenAI') return true
  if (config?.duration === 'P1H') return true
  return type === 'ione' && billingPlan.kind === 'DYNAMIC'
})

const isExpired = computed(() => {
  const productDate = new Date(props.instance.date)
  const timestamp = productDate.getTime() - Date.now()
  const days = 7 * 24 * 3600 * 1000

  if (props.instance.groupname === 'SSL') return
  if (props.instance.date === 0) return
  return timestamp < days
})

const localDate = computed(() => {
  const productDate = new Date(props.instance.date ?? 0)

  if (props.instance.data?.blocked) return i18n.t('filterHeader.In Progress')
  if (isPayg.value) return i18n.t('PayG')
  if (productDate.getTime() === 0) return 'none'
  if (props.instance.date === '0000-00-00') return 'none'
  // if (props.instance.groupname === 'Domains') {
  //   const date = productDate.getTime();

  //   return i18n.tc('year', date);
  // }
  if (props.instance.groupname === 'SSL') {
    const date = productDate.getTime()

    return i18n.tc('month', date)
  }
  return new Intl.DateTimeFormat().format(productDate)
})

const dateColor = computed(() => {
  if (isPayg.value) return 'var(--main)'
  if (isExpired.value) return 'var(--err)'
  if (localDate.value === 'none') return 'var(--gray)'
  return null
})

const networking = computed(() => {
  const { networking } = props.instance?.state?.meta ?? {}

  if (!networking) return []
  const regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/

  const publicIPs = (props.instance.type === 'ovh')
    ? networking.public?.filter((el) => !regexp.test(el))
    : networking.public
  const privateIPs = (props.instance.type === 'ovh')
    ? networking.private?.filter((el) => !regexp.test(el))
    : networking.private

  return [...publicIPs ?? [], ...privateIPs ?? []]
})

const title = computed(() =>
  (!activeKey.value.includes('1')) ? `IP: ${networking.value[0]}` : 'IP\'s:'
)

const getModuleProductBtn = computed(() => {
  const { groupname: group, domainstatus: status } = props.instance
  const serviceType = config.getServiceType(group)?.toLowerCase()
  const isActive = ['active', 'running'].includes(status?.toLowerCase())

  const { type, products = {} } = props.instance.billingPlan ?? {}
  const { meta } = products[props.instance.product] ?? {}

  const components = import.meta.glob('@/components/services/*/lilbtn.vue')
  const component = Object.keys(components).find((key) =>
    key.includes(`/${serviceType}/lilbtn.vue`)
  )

  if (['keyweb', 'ovh cloud'].includes(type)) return
  if (meta?.renew === false) return
  if (props.instance.date === 0) return
  if (props.instance.server_on) return
  if (!(isActive && components[component])) return
  return defineAsyncComponent(() => components[component]())
})

function cloudClick (service, { target }) {
  const { groupname, orderid, hostingid, server_on: isServer, id, config } = service

  if (target.hasAttribute('role') || target.hasAttribute('viewBox')) return
  if (config?.is_vdc) {
    router.push({ name: 'openVDC', params: { uuid: orderid } })
  } else if (id && isServer) {
    router.push({ name: 'openCloud', params: { uuid: id } })
  } else if (hostingid) {
    router.push({ name: 'service', params: { id: hostingid } })
  } else if (groupname === 'Self-Service VDS SSD HC') {
    router.push({ name: 'openCloud', params: { uuid: orderid } })
  } else {
    router.push({ name: 'service', params: { id: orderid } })
  }
}

function toInvoices () {
  localStorage.setItem('order', 'Invoice')
  router.push({ name: 'billing' })
}

async function fetch () {
  if (props.instance.groupname !== 'Domains') return
  try {
    const { meta } = await api.servicesProviders.action({
      uuid: props.instance.sp,
      action: 'get_domain_price',
      params: { domain: props.instance.domain }
    })

    prices.value = meta.prices
  } catch (error) {
    console.error(error)
  }
}

fetch()
</script>

<script>
export default { name: 'CloudItem' }
</script>

<style>
.cloud__item-wrapper {
  position: relative;
  padding: 8px 15px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  cursor: pointer;
  overflow: hidden;
  transition: 0.2s;
}
.cloud__item-wrapper:hover {
  filter: brightness(0.9);
}
.cloud__item {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 95px;
  align-items: start;
  gap: 7px 10px;
  font-size: 16px;
}
.item__color {
  width: 18px;
  height: 18px;
  background-color: var(--bright_font);
  position: absolute;
  border-radius: 50%;
  left: -28px;
  top: 5px;
}
.item__title {
  margin-top: 2px;
  padding-right: 10px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item__status,
.item__date {
  color: var(--gray);
}
.item__date {
  justify-self: end;
  width: fit-content;
  padding: 3px 15px;
  margin: -8px -15px 6px 0;
  border-radius: 0 0 0 20px;
  text-align: center;
  color: var(--gloomy_font);
  background: var(--success);
}
.item__cost {
  grid-column: 3 / 4;
  margin-left: 15px;
  text-align: right;
  white-space: nowrap;
}
.cloud__label {
  position: absolute;
  right: 0;
  bottom: 0;
  background: var(--main);
  color: var(--gloomy_font);
  padding: 3px 15px;
  border-radius: 20px 0px 0px 0px;
  transition-property: padding, border-radius;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.cloud__item-wrapper:hover .cloud__label {
  padding: 7px 20px;
  border-radius: 22px 0px 0px 0px;
}
.cloud__item-wrapper .ant-collapse {
  width: fit-content;
  background: transparent;
}
.cloud__item-wrapper .ant-collapse-item {
  border: none !important;
  border-radius: 0 !important;
}
.cloud__item-wrapper .ant-collapse-header {
  padding: 1px 20px 1px 0 !important;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4) !important;
}
.cloud__item-wrapper .ant-collapse-content-box {
  padding: 5px !important;
  color: rgba(0, 0, 0, 0.4) !important;
}
.cloud__item-wrapper .ant-collapse-arrow {
  top: 11px !important;
  right: 5px !important;
}
</style>
