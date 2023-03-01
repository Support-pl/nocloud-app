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
import ovhCreationTemplate from '@/components//appMain/ovhCreationTemplate.vue';

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
    setAddons(plans) {
      const resources = this.getPlan.resources.map(({ key }) => key.split(' ')[1]);

      plans.forEach(({ planCode, addonFamilies }) => {
        this.allAddons[planCode] = addonFamilies.reduce(
          (res, { addons }) => [...res, ...addons], []
        );

        this.allAddons[planCode] = this.allAddons[planCode]
          .filter((el) => resources.includes(el));
      });
    },
    setData(planKey, changeTarifs = true) {
      const { periods, value } = this.plans.find((el) => el.value.includes(planKey)) ?? {};
      if (!value) return;

      const resources = value.split('-');
      const tarifs = [];
      let plan = periods[0];

      this.options.cpu.size = +resources.at(-3);
      this.options.ram.size = +resources.at(-2);
      this.options.disk.size = resources.at(-1) * 1024;
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
            tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' });
        }
      });
      this.price = { value: plan.price.value, addons: {} };

      if (changeTarifs) this.$emit('setData', { key: 'periods', value: tarifs });
      this.$emit('setData', { key: 'priceOVH', value: this.price });
      this.$emit('setData', { key: 'planCode', value, type: 'ovh' });
      this.$emit('setData', { key: 'duration', value: plan.duration, type: 'ovh' });
      this.$emit('setData', { key: 'pricingMode', value: plan.pricingMode, type: 'ovh' });
    }
  },
  created() {
    this.$emit('setData', {
      key: 'vps_datacenter', type: 'ovh',
      value: this.region.value.replace(/\d/g, '')
    });
  },
  computed: {
    resources() {
      const plans = new Set(this.plans.map(({ label }) => label.split(' ')[1]));
      const ram = new Set();
      const disk = new Set();

      const filteredPlans = this.plans.filter(({ label }) =>
        label.includes(this.plan)
      );

      filteredPlans.forEach(({ value }) => {
        const resources = value.split('-');

        ram.add(+resources.at(-2));
        disk.add(+resources.at(-1));
      });

      return {
        plans: Array.from(plans),
        ram: Array.from(ram).sort((a, b) => a - b),
        disk: Array.from(disk).sort((a, b) => a - b)
      };
    },
    addons() {
      const addons = { backup: {}, snapshot: {}, disk: {} };

      Object.keys(addons).forEach((addon) => {
        this.getPlan.resources?.forEach(({ price, key }) => {
          const { value } = this.plans.find((el) => el.value.includes(this.planKey)) || {};

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
        default:
          return 'default';
      }
    },
    planKey() {
      const { cpu, ram, disk } = this.options;
      const drive = { size: disk.size / 1024 };

      const resources = [cpu, ram, drive].map(({ size }) => size);
      const plan = this.plans.find(({ label }) =>
        label.includes(`${this.plan} ${resources.join('-')}`)
      );

      return plan?.value.slice(4);
    }
  },
  watch: {
    tarification() { this.setData(this.planKey, false) },
    plan(value) {
      const plan = this.plans.find(({ label }) => label.includes(value));

      this.setData(plan?.value);
      this.$emit('setData', { key: 'productSize', value });
      const products = Object.entries(this.getPlan.products ?? {}).filter(
        ([key]) => key.includes(this.planKey)
      );

      if (!products[0]) return;
      const { os } = products[0][1].meta;

      os.sort();
      this.images = os.map((el) => ({ name: el, desc: el }));
      this.images.forEach(({ name }, i, arr) => {
        if (name.toLowerCase().includes('windows')) {
          arr[i].prices = products.map(([key, { meta }]) => ({
            price: { value: meta.windows },
            duration: key.split(' ')[0],
            pricingMode: (key.split(' ')[0] === 'P1Y') ? 'upfront12' : 'default'
          }));
        }
      });
    },
    'options.ram.size'(size) {
      const plan = this.plans?.find(({ value }) => value.includes(this.planKey));

      if (plan) return;
      const regexp = new RegExp(`${this.plan} \\d{1,4}-${size}`, 'gm');
      const { value } = this.plans?.find((el) => regexp.test(el.label)) || {};

      this.options.disk.size = value?.split('-').at(-1) * 1024;
    },
    'options.disk.size'(size) {
      const plan = this.plans?.find(({ value }) => value.includes(this.planKey));

      if (plan) return;
      const regexp = new RegExp(`${this.plan} \\d{1,4}-\\d{1,4}-${size / 1024}`, 'gm');
      const { value } = this.plans?.find((el) => regexp.test(el.label)) || {};

      this.options.ram.size = value?.split('-').at(-2);
    }
  }
}
</script>
