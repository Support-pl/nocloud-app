<template>
  <div class="cloud__item-wrapper" @click="(e) => cloudClick(instance, e)">
    <div class="cloud__item">
      <div
        class="item__color"
        :title="instance.domainstatus"
        :style="{ 'background-color': statusColor }"
      />
      <div class="item__title">{{ instance.productname }}</div>
      <div class="item__status" style="text-align: right">{{ locationTitle }}</div>
      <div class="item__date" :style="{ background: dateColor }">
        {{ localDate }}
      </div>

      <div class="item__status" v-if="networking.length < 1">
        IP: {{ $t("ip.none") }}
      </div>
      <div class="item__status" v-else-if="networking.length < 2">
        {{ instance.domain }}
      </div>

      <a-collapse v-else v-model="activeKey" expandIconPosition="right" :bordered="false">
        <a-collapse-panel key="1" :header="title">
          <div v-for="(item, index) in networking" :key="index">
            {{ item }}
          </div>
        </a-collapse-panel>
      </a-collapse>

      <a-tooltip
        placement="bottom"
        v-if="getModuleProductBtn && `${price}`.replace('.').length > 3"
        :title="`${price} ${currency.code}`"
      >
        <component :is="getModuleProductBtn" :service="instance" :price="price" :currency="currency" />
      </a-tooltip>

      <component
        v-else-if="getModuleProductBtn"
        :is="getModuleProductBtn"
        :service="instance"
        :price="price"
        :currency="currency"
      />

      <div class="item__cost" v-else-if="currency.code && price">
        {{ currency.code === 'USD' ? `$${price}` : `${price} ${currency.code}` }}
      </div>
      <div class="item__cost" v-else-if="price">{{ `$${price}` }}</div>
    </div>

    <!-- <div class="cloud__label cloud__label__mainColor">
      {{ instance.billingPlan.kind === "STATIC" ? $t("PrePaid") : $t("PAYG") }}
    </div> -->
  </div>
</template>

<script>
export default {
  name: "cloudItem",
  props: {
    instance: { type: Object, required: true }
  },
  data: () => ({ activeKey: [], prices: {} }),
  computed: {
    statusColor() {
      switch (this.instance.domainstatus) {
        case "RUNNING":
          return "#0fd058";
        // останавливающийся и запускающийся
        case "BOOT_POWEROFF":
        case "SHUTDOWN_POWEROFF":
          return "#919191";
        case "LCM_INIT":
        case "STOPPED":
        case "SUSPENDED":
        case "Pending":
          return "#f9f038";
        default:
          return "rgb(145, 145, 145)";
      }
    },
    dateColor() {
      if (this.isExpired) return "var(--err)";
      if (this.isPayg) return "var(--main)";
      if (this.localDate === "none") return "var(--gray)";
      return null;
    },
    user() {
      return this.$store.getters["nocloud/auth/billingData"];
    },
    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    isLoading() {
      return this.$store.getters["nocloud/vms/isLoading"];
    },
    locationTitle() {
      const sp = this.getSP.find(({ uuid }) => uuid === this.instance.sp);
      if (sp?.type !== 'ovh') return sp?.locations[0]?.title;

      const { configuration } = this.instance.config;
      const { locations } = sp;
      const key = Object.keys(configuration).find(
        (el) => el.includes('datacenter')
      );

      return locations?.find(({ extra }) =>
        extra.region.toLowerCase() === configuration[key].toLowerCase()
      )?.title;
    },
    price() {
      const amount = this.prices[this.instance.resources?.period] ??
        this.instance.orderamount;

      return +(+amount)?.toFixed(2) ?? 0;
    },
		localDate() {
      const productDate = new Date(this.instance.date ?? 0);

      if (this.isPayg) return this.$t('PayG');
      if (productDate.getTime() === 0) return 'none';
      // if (this.wholeProduct.groupname === 'Domains') {
      //   const date = productDate.getTime();

      //   return this.$tc('year', date);
      // }
      if (this.instance.groupname === 'SSL') {
        const date = productDate.getTime();

        return this.$tc('month', date);
      }
			return new Intl.DateTimeFormat().format(productDate);
		},
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      return { code: this.user.currency_code ?? defaultCurrency };
    },

    isPayg() {
      return this.instance.type === 'ione' && this.instance.billingPlan.kind === 'DYNAMIC';
    },
    isExpired() {
      const productDate = new Date(this.instance.date);
      const timestamp = productDate.getTime() - Date.now();
      const days = 7 * 24 * 3600 * 1000;

      if (this.instance.groupname === 'SSL') return;
      if (this.instance.date === 0) return;
      return timestamp < days;
    },
    networking() {
      const { networking } = this.instance?.state?.meta ?? {};

      if (!networking) return [];
      const regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

      const publicIPs = (this.instance.type === 'ovh')
        ? networking.public?.filter((el) => !regexp.test(el))
        : networking.public;
      const privateIPs = (this.instance.type === 'ovh')
        ? networking.private?.filter((el) => !regexp.test(el))
        : networking.private;

      return [...publicIPs ?? [], ...privateIPs ?? []];
    },
    title() {
      return (!this.activeKey.includes('1')) ? `IP: ${this.networking[0]}` : 'IP\'s:';
    },
		getModuleProductBtn() {
			const serviceType = this.$config.getServiceType(this.instance.groupname)?.toLowerCase();
      const isActive = ['active', 'running'].includes(this.instance.domainstatus.toLowerCase());

			if (serviceType === undefined) return;
      if (this.instance.date === 0) return;
      if (!isActive && ['virtual', 'iaas'].includes(serviceType)) return;
			return () => import(`@/components/services/${serviceType}/lilbtn.vue`);
		}
  },
  methods: {
    cloudClick({ groupname, orderid, hostingid }, { target }) {
      if (target.hasAttribute('role') || target.hasAttribute('viewBox')) return;
      if (['Domains', 'SSL'].includes(groupname)) {
        this.$router.push({ name: 'service', params: { id: orderid } });
      } else if (groupname === 'Self-Service VDS SSD HC') {
        this.$router.push({ name: 'openCloud_new', params: { uuid: orderid } });
      } else {
        this.$router.push({ name: 'service', params: { id: hostingid } });
      }
    },
  },
  created() {
    if (this.$store.getters['nocloud/auth/currencies'].length < 1) {
      this.$store.dispatch('nocloud/auth/fetchCurrencies');
    }

    if (this.instance.groupname !== 'Domains') return;
    this.$api.servicesProviders.action({
      uuid: this.instance.sp,
      action: 'get_domain_price',
      params: { domain: this.domain },
    })
      .then(({ meta }) => this.prices = meta.prices)
      .catch((err) => console.error(err));
  },
};
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
