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
    @changePlans="setPlans"
    @changePlan="(value) => plan = value"
  >
    <template #location>
      <slot name="location"></slot>
    </template>

    <template #plan>
      <a-row type="flex" justify="space-between" align="middle" v-if="resources.cpu.length > 0">
        <a-col>
          <span style="display: inline-block">{{ $t('cpu') }}: (cores)</span>
        </a-col>
        <a-col :span="20">
          <a-slider
            range
            style="margin-top: 10px"
            :marks="{ ...resources.cpu }"
            :tip-formatter="null"
            :default-value="[0, resources.cpu.length - 1]"
            :max="resources.cpu.length - 1"
            :min="0"
            @change="([i, j]) => filters.cpu = [resources.cpu[i], resources.cpu[j]]"
          />
        </a-col>
      </a-row>
      <a-row type="flex" justify="space-between" align="middle" v-if="resources.ram.length > 0">
        <a-col>
          <span style="display: inline-block">{{ $t('ram') }}: (Gb)</span>
        </a-col>
        <a-col :span="20">
          <a-slider
            range
            style="margin-top: 10px"
            :marks="{ ...resources.ram }"
            :tip-formatter="null"
            :default-value="[0, resources.ram.length - 1]"
            :max="resources.ram.length - 1"
            :min="0"
            @change="([i, j]) => filters.ram = [resources.ram[i], resources.ram[j]]"
          />
        </a-col>
      </a-row>
      <a-row type="flex" justify="space-between" align="middle" v-if="resources.disk.length > 0">
        <a-col>
          <span style="display: inline-block">{{ $t("Drive") }}: (Gb)</span>
        </a-col>
        <a-col :span="20">
          <a-slider
            range
            style="margin-top: 10px"
            :marks="{ ...resources.disk }"
            :tip-formatter="null"
            :default-value="[0, resources.disk.length - 1]"
            :max="resources.disk.length - 1"
            :min="0"
            @change="([i, j]) => filters.disk = [resources.disk[i], resources.disk[j]]"
          />
        </a-col>
      </a-row>

      <div class="order__grid" style="margin-top: 10px">
        
        <div
          class="order__grid-item"
          v-for="provider of filteredPlans"
          :key="provider.label"
          :class="{ 'order__grid-item--active': plan === provider.label }"
          @click="plan = provider.label"
        >
          <h1>{{ provider.label }}</h1>
          <div>
            {{ $t('cpu') }}: {{ provider.resources.cpu ?? '?' }}
          </div>
          <div>
            {{ $t('ram') }}: {{ provider.resources.ram / 1000 ?? '?' }} Gb
          </div>
          <div>
            {{ $t('Drive') }}: {{ provider.resources.drive_size / 1024 ?? '?' }} Gb
          </div>
        </div>
      </div>
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
    price: {},
    filters: { cpu: [], ram: [], disk: [] }
  }),
  methods: {
    setData(planKey, changeTarifs = true) {
      const { periods, value, resources } = this.plans.find((el) => el.value.includes(planKey)) ?? {};
      if (!value) return;

      const tarifs = [];
      let plan = periods[0];

      this.options.cpu.size = +resources.cpu;
      this.options.ram.size = +(resources.ram / 1024).toFixed(2);
      this.options.disk.size = resources.drive_size;
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
      this.$emit('setData', { key: 'planCode', value, type: 'ovh' });
      this.$emit('setData', { key: 'monthlyBilling', value: (plan.duration === 'P1M'), type: 'ovh' });
      this.$emit('setData', { key: 'duration', value: plan.duration, type: 'ovh' });
      this.$emit('setData', { key: 'pricingMode', value: plan.pricingMode, type: 'ovh' });
    },
    setPlans(value) {
      this.plans = value.sort((a, b) =>
        a.periods[0].price.value - b.periods[0].price.value
      );
    }
  },
  created() {
    this.$emit('setData', { key: 'cloud_datacenter', type: 'ovh', value: this.region.value });
  },
  computed: {
    filteredPlans() {
      const plans = [];

      this.plans.forEach(({ label, resources }) => {
        const byCpu = resources.cpu >= this.filters.cpu.at(0) &&
          resources.cpu <= this.filters.cpu.at(-1);

        const byRam = resources.ram / 1024 >= this.filters.ram.at(0) &&
          resources.ram / 1024 <= this.filters.ram.at(-1);

        const byDisk = resources.drive_size / 1024 >= this.filters.disk.at(0) &&
          resources.drive_size / 1024 <= this.filters.disk.at(-1);

        if (byCpu && byRam && byDisk) {
          plans.push({ label, resources });
        }
      });

      return plans;
    },
    resources() {
      const plans = this.plans.map(({ label }) => label);
      const cpu = [];
      const ram = [];
      const disk = [];

      this.plans.forEach(({ resources }) => {
        if (!cpu.includes(resources.cpu)) {
          cpu.push(resources.cpu);
        }
        if (!ram.includes(resources.ram / 1000)) {
          ram.push(resources.ram / 1000);
        }
        if (!disk.includes(resources.drive_size / 1024)) {
          disk.push(resources.drive_size / 1024);
        }
      });

      cpu.sort((a, b) => a - b);
      ram.sort((a, b) => a - b);
      disk.sort((a, b) => a - b);

      return { plans, cpu, ram, disk };
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
    tarification() {
      const plan = this.plans.find((el) => el.label === this.plan);

      this.setData(plan.value, false);
    },
    plan(value) {
      const plan = this.plans.find((el) => el.label === value);

      this.setData(plan?.value);
      this.$emit('setData', { key: 'productSize', value });

      setTimeout(() => {
        const period = (this.mode === 'default') ? 'P1M' : 'P1H';
        const products = Object.values(this.getPlan.products ?? {}).filter((product) =>
          product.title.includes(value) && product.resources.period === period
        );
        const { os } = products[0]?.meta ?? {};

        os?.sort((a, b) => a.name < b.name);
        this.images = os?.map(({ name, id }) => ({ name, desc: name, id })) ?? [];
      }, 100);
    },
    'resources.cpu'(value) {
      this.filters.cpu = [value.at(0), value.at(-1)];
    },
    'resources.ram'(value) {
      this.filters.ram = [value.at(0), value.at(-1)];
    },
    'resources.disk'(value) {
      this.filters.disk = [value.at(0), value.at(-1)];
    }
  }
}
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__grid-item {
	padding: 10px 20px;
	border-radius: 15px;
	cursor: pointer;
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
	transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__grid-item:hover {
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__grid-item h1 {
  margin-bottom: 5px;
  color: inherit;
}

.order__grid-item--active {
  background-color: var(--main);
  color: #fff;
}
</style>
