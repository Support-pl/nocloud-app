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
    allAddons: {},
    addonsCodes: {},
    price: {}
  }),
  methods: {
    setData(resource, changeTarifs = true) {
      const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
      const { periods, value } = this.plans.find((el) => el.label.includes(this.plan)) ?? {};
      if (!value) return;

      const product = Object.entries(this.getPlan.products).find(([key]) => key.includes(value));
      const { meta: { addons } } = this.getPlan.products[`${duration} ${value}`] ?? product[1];
      const tarifs = [];
      if (!addons) {
        this.options.cpu.size = 0;
        this.options.ram.size = 0;
        this.options.disk.size = 0;
        return;
      }

      let addonKey = addons.find((addon) => addon.includes(resource.value));
      let plan = periods[0];

      this.options.cpu.size = 1;
      if (resource.key === 'ram') {
        this.options.ram.size = parseInt(addonKey.split('-')[1]);
      }
      if (resource.key === 'disk') {
        addonKey = addons.find((addon) => {
          const isDisk = addon.includes('raid');
          const [count, size] = addon.split('-')[1].split('x');

          return isDisk && (count * parseInt(size)) === resource.value;
        });
        const [count, size] = addonKey.split('-')[1].split('x');

        this.options.disk.size = count * parseInt(size) * 1024;
        if (addonKey.includes('hybrid')) this.options.drive = 'SSD + HDD';
        else if (size.includes('sa')) this.options.drive = false;
        else this.options.drive = 'SSD';
      }

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
            tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' });
        }
      });
      this.price = { value: plan.price.value, addons: { ...this.price.addons } };
      this.price.addons[resource.key] = this.getPlan.resources
        .find((el) => el.key.includes(addonKey))?.price ?? 0;
      this.$set(this.addonsCodes, resource.key, addonKey);

      if (changeTarifs) this.$emit('setData', { key: 'periods', value: tarifs });
      this.$emit('setData', { key: 'priceOVH', value: this.price });
      this.$emit('setData', { key: 'planCode', value, type: 'ovh' });
      this.$emit('setData', { key: 'duration', value: plan.duration, type: 'ovh' });
      this.$emit('setData', { key: 'pricingMode', value: plan.pricingMode, type: 'ovh' });
    },
    setResources(value, changeTarifs = true) {
      const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
      const product = this.getPlan.products[`${duration} ${this.plan}`];
      const { meta: { os } } = product ?? Object.values(this.getPlan.products)[0] ?? { meta: { os: [] } };

      this.setData({ key: 'ram', value: this.resources.ram[0] }, changeTarifs);
      this.setData({ key: 'disk', value: this.resources.disk[0] }, false);
      if (value) this.$emit('setData', { key: 'productSize', value });

      os.sort();
      this.images = os.map((el) => ({ name: el, desc: el }));
    }
  },
  created() {
    this.$emit('setData', {
      key: 'baremetal_datacenter', type: 'ovh',
      value: this.region.value.replace(/\d/g, '').toLowerCase()
    });
  },
  computed: {
    resources() {
      const ram = new Set();
      const disk = new Set();

      if (!this.getPlan.products) return { plans: [], ram: [], disk: [] };
      const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
      const { value } = this.plans.find(({ label }) => label.includes(this.plan)) ?? {};
      const { meta: { addons } } = this.getPlan.products[`${duration} ${value}`] ??
        Object.values(this.getPlan.products)[0];

      addons?.forEach((addon) => {
        if (!this.getPlan.resources.find(({ key }) => key === `${duration} ${addon}`)) return;
        if (addon.includes('ram')) {
          ram.add(parseInt(addon.split('-')[1]));
        }
        if (addon.includes('raid')) {
          const [count, size] = addon.split('-')[1].split('x');

          disk.add(count * parseInt(size));
        }
      });

      return {
        plans: this.plans.map(({ label }) => label),
        ram: Array.from(ram).sort((a, b) => a - b),
        disk: Array.from(disk).sort((a, b) => a - b)
      };
    },
    addons() {
      const addons = { traffic: {}, vrack: {}, disk: {} };

      Object.keys(addons).forEach((addon) => {
        this.getPlan.resources?.forEach(({ price, key }) => {
          const { value } = this.plans.find((el) => el.label.includes(this.plan)) ?? {};

          const addonKey = key.split(' ')[1];
          const duration = key.split(' ')[0];
          const period = {
            price: { value: price },
            duration,
            pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
          };

          const isInclude = this.allAddons[value]?.includes(addonKey);
          const isEqualMode = period.pricingMode === this.mode;

          if (isInclude && key.includes(addon) && isEqualMode) {
            addons[addon][addonKey] = { periods: [period], title: addonKey };
          }
        });
      });

      return addons;
    },
    region() {
      const location = this.locationId.split(' ').at(-1);
      const { extra, title } = this.itemSP?.locations
        .find(({ id }) => id === location) ?? {};

      if (!extra) return null;
      return { value: extra.region, title };
    },
    mode() {
      switch (this.tarification) {
        case 'Annually':
          return 'upfront12';
        case 'Biennially':
          return 'upfront24';
        default:
          return 'default';
      }
    }
  },
  watch: {
    tarification() {
      this.price.addons = {};
      this.setResources(null, false);
    },
    plan(value) {
      this.price.addons = {};
      this.setResources(value);
    }
  }
}
</script>
