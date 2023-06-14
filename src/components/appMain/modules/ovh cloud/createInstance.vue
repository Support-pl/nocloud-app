<template>
  <ovh-creation-template
    :activeKey="activeKey"
    :itemSP="itemSP"
    :getPlan="getPlan"
    :options="options"
    :tarification="tarification"
    :vmName="vmName"
    :password="password"
    :locationId="locationId"
    :resources="resources"
    :addons="addons"
    :setData="setData"
    :plan="plan"
    :images="images"
    :plans="plans"
    :allAddons="allAddons"
    :addonsCodes="addonsCodes"
    :price="price"
    @setData="(value) => $emit('setData', value)"
    @changePlans="(value) => plans = value"
    @changePlan="(value) => plan = value"
    @changeType="(value) => $emit('setData', { key: 'type', value })"
  >
    <template v-slot:location>
      <slot name="location"></slot>
    </template>
  </ovh-creation-template>
</template>

<script>
import ovhCreationTemplate from '@/components/appMain/ovhCreationTemplate.vue';

export default {
  name: 'createInstance-ovh',
  components: { ovhCreationTemplate },
  props: {
    getPlan: { type: Object, default: {} },
    itemSP: { type: Object, default: null },
    options: { type: Object, required: true },
    activeKey: { type: String, required: true },
    tarification: { type: String, required: true },
    locationId: { type: String, required: true },
    vmName: { type: String, required: true },
    password: { type: String, required: true }
  },
  data: () => ({
    plan: '',
    images: [],
    plans: [],
    addons: {},
    allAddons: {},
    addonsCodes: {},
    price: {}
  }),
  methods: {
    setData(planKey, changeTarifs = true) {
      const { periods, value, resources } = this.plans.find((el) => el.value.includes(planKey)) ?? {};
      if (!value) return;

      const tarifs = [];
      let plan = periods[0];

      this.options.cpu.size = +resources.vcpus;
      this.options.ram.size = +(resources.ram / 1024).toFixed(2);
      this.options.disk.size = resources.disk * 1024;
      this.options.drive = true;

      periods.forEach((period) => {
        if (period.pricingMode === this.mode) plan = period;
        switch (period.pricingMode) {
          case 'upfront12':
            tarifs.push({ value: 'Annually', label: 'annually' });
            break;
          case 'upfront24':
            tarifs.push({ value: 'Biennially', label: 'biennially' });
            break;
          case 'default':
          case 'monthly':
            tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' });
            break;
          case 'hourly':
            tarifs.push({ value: 'Hourly', label: 'ssl_product.Hourly' });
        }
      });
      this.price = { value: plan.price.value, addons: {} };
      this.addonsCodes = {};

      if (changeTarifs) this.$emit('setData', { key: 'periods', value: tarifs });
      this.$emit('setData', { key: 'priceOVH', value: this.price });
      this.$emit('setData', { key: 'flavorId', value, type: 'ovh' });
      this.$emit('setData', { key: 'monthlyBilling', value: (plan.duration === 'P1M'), type: 'ovh' });
    }
  },
  created() {
    this.$emit('setData', { key: 'region', type: 'ovh', value: this.region.value });

    this.$emit('setData', { key: 'cloud_datacenter', type: 'ovh', value: this.region.value });
  },
  computed: {
    resources() {
      const plans = new Set(this.plans.map(({ label }) =>
        label.split(' ')[1].replace(`-${this.region.value}`, '')
      ));

      return { plans: Array.from(plans), ram: [], disk: [] };
    },
    region() {
      const location = this.locationId.split(' ').at(-1);
      const { extra, title } = this.itemSP?.locations.find(
        ({ id }) => id === location
      ) || {};

      if (!extra) return null;
      return { value: extra.region, title };
    },
    mode() {
      switch (this.tarification) {
        case 'Annually':
          return 'upfront12';
        case 'Biennially':
          return 'upfront24';
        case 'Hourly':
          return 'hourly';
        default:
          return 'default';
      }
    },
  },
  watch: {
    tarification() { this.setData(this.plan, false) },
    plan(value) {
      const plan = this.plans.find((el) => el.value.includes(value));
      const products = Object.entries(this.getPlan.products ?? {}).filter(
        ([key]) => key.includes(value)
      );
      const { os } = products[0][1].meta;

      this.setData(plan?.value);
      this.$emit('setData', { key: 'productSize', value });

      os?.sort((a, b) => a.name < b.name);
      this.images = os?.map(({ name, id }) => ({ name, desc: name, id })) ?? [];
    }
  }
}
</script>
