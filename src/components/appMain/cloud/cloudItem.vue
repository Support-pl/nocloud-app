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

      <a-collapse v-else v-model="activeKey" expand-icon-position="right" :bordered="false">
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

<script>
import config from '@/appconfig.js'

export default {
  name: 'CloudItem',
  props: {
    instance: { type: Object, required: true }
  },
  data: () => ({ activeKey: [], prices: {} }),
  computed: {
    statusColor () {
      switch (this.instance.domainstatus) {
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
    },
    dateColor () {
      if (this.isExpired) return 'var(--err)'
      if (this.isPayg) return 'var(--main)'
      if (this.localDate === 'none') return 'var(--gray)'
      return null
    },
    user () {
      return this.$store.getters['nocloud/auth/billingData']
    },
    getSP () {
      return this.$store.getters['nocloud/sp/getSP']
    },
    isLogged () {
      return this.$store.getters['nocloud/auth/isLoggedIn']
    },
    isLoading () {
      return this.$store.getters['nocloud/vms/isLoading']
    },
    locationTitle () {
      const sp = this.getSP.find(({ uuid }) => uuid === this.instance.sp)
      if (sp?.type !== 'ovh') return sp?.locations[0]?.title

      const { configuration = {}, region } = this.instance.config
      const { locations } = sp
      const key = Object.keys(configuration).find(
        (el) => el.includes('datacenter')
      ) ?? 'region'

      if (key === 'region') configuration.region = region

      return locations?.find(({ extra }) =>
        extra.region.toLowerCase() === configuration[key].toLowerCase()
      )?.title
    },
    price () {
      const amount = this.prices[this.instance.resources?.period] ??
        this.instance.recurringamount ?? this.instance.orderamount

      return +(+amount)?.toFixed(2) ?? 0
    },
    localDate () {
      const productDate = new Date(this.instance.date ?? 0)

      if (this.instance.data?.blocked) return this.$t('filterHeader.In Progress')
      if (this.isPayg) return this.$t('PayG')
      if (productDate.getTime() === 0) return 'none'
      if (this.instance.date === '0000-00-00') return 'none'
      // if (this.wholeProduct.groupname === 'Domains') {
      //   const date = productDate.getTime();

      //   return this.$tc('year', date);
      // }
      if (this.instance.groupname === 'SSL') {
        const date = productDate.getTime()

        return this.$tc('month', date)
      }
      return new Intl.DateTimeFormat().format(productDate)
    },
    currency () {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency']

      return { code: this.user.currency_code ?? defaultCurrency }
    },

    isPayg () {
      if (this.instance.groupname === 'OpenAI') return true
      return this.instance.type === 'ione' && this.instance.billingPlan.kind === 'DYNAMIC'
    },
    isExpired () {
      const productDate = new Date(this.instance.date)
      const timestamp = productDate.getTime() - Date.now()
      const days = 7 * 24 * 3600 * 1000

      if (this.instance.groupname === 'SSL') return
      if (this.instance.date === 0) return
      return timestamp < days
    },
    networking () {
      const { networking } = this.instance?.state?.meta ?? {}

      if (!networking) return []
      const regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/

      const publicIPs = (this.instance.type === 'ovh')
        ? networking.public?.filter((el) => !regexp.test(el))
        : networking.public
      const privateIPs = (this.instance.type === 'ovh')
        ? networking.private?.filter((el) => !regexp.test(el))
        : networking.private

      return [...publicIPs ?? [], ...privateIPs ?? []]
    },
    title () {
      return (!this.activeKey.includes('1')) ? `IP: ${this.networking[0]}` : 'IP\'s:'
    },
    getModuleProductBtn () {
      const serviceType = config.getServiceType(this.instance.groupname)?.toLowerCase()
      const isActive = ['active', 'running'].includes(this.instance.domainstatus?.toLowerCase())
      const key = this.instance.product ?? this.instance.config?.product
      const { meta } = this.instance.billingPlan?.products[key] ?? {}

      const components = import.meta.glob('@/components/services/*/lilbtn.vue')
      const component = Object.keys(components).find((key) =>
        key.includes(`/${serviceType}/lilbtn.vue`)
      )

      if (meta?.renew === false) return
      if (serviceType === undefined) return
      if (this.instance.date === 0) return
      if (this.instance.server_on) return
      if (!isActive && ['virtual', 'iaas'].includes(serviceType)) return
      return () => components[component]()
    }
  },
  created () {
    if (this.instance.groupname !== 'Domains') return
    this.$api.servicesProviders.action({
      uuid: this.instance.sp,
      action: 'get_domain_price',
      params: { domain: this.domain }
    })
      .then(({ meta }) => { this.prices = meta.prices })
      .catch((err) => { console.error(err) })
  },
  methods: {
    cloudClick (service, { target }) {
      const { groupname, orderid, hostingid, server_on: isServer, id } = service

      if (target.hasAttribute('role') || target.hasAttribute('viewBox')) return
      if (id && isServer) {
        this.$router.push({ name: 'openCloud_new', params: { uuid: id } })
      } else if (hostingid) {
        this.$router.push({ name: 'service', params: { id: hostingid } })
      } else if (groupname === 'Self-Service VDS SSD HC') {
        this.$router.push({ name: 'openCloud_new', params: { uuid: orderid } })
      } else {
        this.$router.push({ name: 'service', params: { id: orderid } })
      }
    }
  }
}
</script>

<style>
.cloud__item-wrapper {
  position: relative;
  padding: 8px 15px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: #fff;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  overflow: hidden;
}
.cloud__item-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.55);
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
  background-color: #fff;
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
  color: rgba(0, 0, 0, 0.4);
}
.item__date {
  justify-self: end;
  width: fit-content;
  padding: 3px 15px;
  margin: -8px -15px 6px 0;
  border-radius: 0 0 0 20px;
  text-align: center;
  color: #fff;
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
  color: #fff;
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
