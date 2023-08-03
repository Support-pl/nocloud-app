<template>
  <ovh-creation-template
    ref="template"
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
    <template #location>
      <slot name="location"></slot>
    </template>

    <template #plan>
      <a-checkbox-group v-model="checkedTypes" :options="typesOptions" />
      <div class="order__grid">
        <div
          class="order__grid-item"
          v-for="provider of resources.plans"
          :key="provider"
          :class="{ 'order__grid-item--active': plan === provider }"
          @click="plan = provider"
        >
          <h1>{{ provider }}</h1>
          <div>
            {{ $t('cpu') }}:
            <a-icon type="loading" v-if="options.cpu.size === 'loading' && plan === provider" />
            <template v-else>{{ getCpu(provider) ?? '?' }}</template>
          </div>
          <div>
            {{ $t('ram') }}: {{ $t('from') }}
            {{ allResources[provider]?.ram[0] ?? '?' }} Gb
          </div>
          <div>
            {{ $t('Drive') }}: {{ $t('from') }}
            {{ allResources[provider]?.disk[0] ?? '?' }} Gb
          </div>
          <div style="margin-top: 5px">
            {{ $t('from') | capitalize }}
            <span :style="{
              fontSize: '18px',
              fontWeight: 700,
              color: (plan === provider) ? null : 'var(--main)'
            }">
              {{ +((allResources[provider]?.price[0] ?? 0) * currency.rate).toFixed(2) }}
              {{ currency.code }}
            </span>
          </div>
          <a-button
            ghost
            style="display: block; margin: 5px 0 0 auto"
            v-if="plan === provider"
            @click="$router.push({ query: { product: plan } })"
          >
            {{ $t('config') | capitalize }}
          </a-button>
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
    allAddons: {},
    addonsCodes: {},
    price: {},
    cpus: {},
    checkedTypes: []
  }),
  methods: {
    setData(resource, changeTarifs = true) {
      const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
      const { periods, value } = this.plans.find((el) => el.label.includes(this.plan)) ?? {};
      if (!value) return;

      const product = Object.entries(this.getPlan.products).find(([key]) => key.includes(value));
      const { meta: { addons } } = this.getPlan.products[`${duration} ${value}`] ?? product[1];
      let addonKey = addons?.find(({ id }) => id.includes(resource.value))?.id;
      let plan = periods[0];
      const tarifs = [];

      if (resource.key === 'ram') {
        this.options.ram.size = parseInt(addonKey?.split('-')[1] ?? 0);
      }
      if (resource.key === 'disk') {
        addonKey = addons?.find(({ id }) => {
          const isDisk = id.includes('raid');
          const [count, size] = id.split('-')[1].split('x');

          return isDisk && (count * parseInt(size)) === resource.value;
        })?.id;
        const [count, size] = addonKey?.split('-')[1].split('x') ?? ['0', '0'];

        this.options.disk.size = count * parseInt(size) * 1024;
        if (addonKey?.includes('hybrid')) this.options.drive = 'SSD + HDD';
        else if (size.includes('sa')) this.options.drive = false;
        else this.options.drive = 'SSD';
      }
      if (!addons || !addonKey) {
        this.options.cpu.size = 0;
        return;
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
      if (this.images.length === 1) this.$refs.template?.setOS(this.images[0], 0);
    },
    getCpu(plan) {
      const { value } = this.plans.find((el) => el.label.includes(plan)) ?? {};

      return this.cpus[value];
    }
  },
  created() {
    this.$emit('setData', {
      key: 'dedicated_datacenter', type: 'ovh',
      value: this.region.value.replace(/\d/g, '').toLowerCase()
    });
  },
  computed: {
    user() {
      return this.$store.getters["nocloud/auth/billingData"];
    },
    isLogged() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
    },
    currency() {
      const currencies = this.$store.getters['nocloud/auth/currencies'];
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      const code = this.$store.getters['nocloud/auth/unloginedCurrency'];
      const { rate } = currencies.find((el) =>
        el.to === code && el.from === defaultCurrency
      ) ?? {};

      const { rate: reverseRate } = currencies.find((el) =>
        el.from === code && el.to === defaultCurrency
      ) ?? { rate: 1 };

      if (!this.isLogged) return { rate: (rate) ? rate : 1 / reverseRate, code };
      return { rate: 1, code: this.user.currency_code ?? defaultCurrency };
    },
    resources() {
      const ram = new Set();
      const disk = new Set();

      if (!this.getPlan.products) return { plans: [], ram: [], disk: [] };
      const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
      const { value } = this.plans.find(({ label }) => label.includes(this.plan)) ?? {};
      const { meta: { addons } } = this.getPlan.products[`${duration} ${value}`] ??
        Object.values(this.getPlan.products)[0];

      addons?.forEach(({ id }) => {
        if (!this.getPlan.resources.find(({ key }) => key === `${duration} ${value} ${id}`)) return;
        if (id.includes('ram')) {
          ram.add(parseInt(id.split('-')[1]));
        }
        if (id.includes('raid')) {
          const [count, size] = id.split('-')[1].split('x');

          disk.add(count * parseInt(size));
        }
      });

      return {
        plans: this.plans.map(({ label }) => label).filter((label) => {
          if (this.checkedTypes.length < 1) return true;
          return this.checkedTypes.find((type) => label.includes(type));
        }),
        ram: Array.from(ram).sort((a, b) => a - b),
        disk: Array.from(disk).sort((a, b) => a - b)
      };
    },
    allResources() {
      if (!this.getPlan.products) return {};

      return this.plans.reduce((result, { value, label, periods }) => {
        const ram = new Set();
        const disk = new Set();

        const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
        const { meta: { addons } } = this.getPlan.products[`${duration} ${value}`] ??
          Object.values(this.getPlan.products)[0];

        addons?.forEach(({ id }) => {
          if (!this.getPlan.resources.find(({ key }) => key === `${duration} ${value} ${id}`)) return;
          if (id.includes('ram')) {
            ram.add(parseInt(id.split('-')[1]));
          }
          if (id.includes('raid')) {
            const [count, size] = id.split('-')[1].split('x');

            disk.add(count * parseInt(size));
          }
        });

        return {
          ...result,
          [label]: {
            price: periods.map(({ price }) => price.value).sort((a, b) => a - b),
            ram: Array.from(ram).sort((a, b) => a - b),
            disk: Array.from(disk).sort((a, b) => a - b)
          }
        };
      }, {});
    },
    typesOptions() {
      const types = [];

      this.plans.forEach(({ label }) => {
        const value = label.split('-')[0];

        if (types.find((type) => type.value.includes(value))) return;
        if (label.includes('STOR') || label.includes('SDS')) {
          return { value, label: 'Storage' };
        }

        switch (value) {
          case 'HGR':
            types.push({ value, label: 'High grade' });
            break;
          case 'HOST':
            types.push({ value, label: 'Hosting' });
            break;
          case 'MG':
            types.push({ value, label: 'Enterprise' });
            break;
          case 'FS':
            types.push({ value, label: 'Storage' });
            break;
          default:
            types.push({ value, label: this.$options.filters.capitalize(value) });
        }
      });

      return types;
    },
    addons() {
      const addons = { traffic: {}, vrack: {} };

      Object.keys(addons).forEach((addon) => {
        this.getPlan.resources?.forEach(({ price, key }) => {
          const { value } = this.plans.find((el) => el.label.includes(this.plan)) ?? {};

          const addonKey = key.split(' ').at(-1);
          const duration = key.split(' ').at(0);
          const period = {
            price: { value: price },
            duration,
            pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
          };

          const { title } = this.allAddons[value]?.find(
            ({ id }) => id.includes(addonKey)
          ) ?? {};
          const isEqualMode = period.pricingMode === this.mode;

          if (title?.includes(addon) && isEqualMode) {
            addons[addon][addonKey] = { periods: [period], title };
          }
        });
      });

      return addons;
    },
    region() {
      const { extra, title } = this.itemSP?.locations
        .find(({ id }) => id === this.locationId.includes(id)) ?? {};

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

      setTimeout(() => {
        const duration = (this.mode === 'upfront12') ? 'P1Y' : 'P1M';
        const { value } = this.plans.find(({ label }) => label.includes(this.plan)) ?? {};
        const { meta: { addons: allAddons } } = this.getPlan.products[`${duration} ${value}`] ??
          Object.values(this.getPlan.products)[0];
        const addons = [];

        allAddons.forEach(({ id }) => {
          const isRamExist = addons.find((addon) => addon.includes('ram'));
          const isDiskExist = addons.find((addon) => addon.includes('raid'));

          if (id.includes('ram') && !isRamExist) addons.push(id);
          if (id.includes('raid') && !isDiskExist) addons.push(id);
        });

        this.options.cpu.size = this.cpus[value] ?? 'loading';

        if (this.cpus[value]) return;
        this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
          method: 'checkout_baremetal',
          params: { ...this.options.config, addons }
        })
          .then(({ meta: { order: { details } } }) => {
            const cpu = details.find(({ description }) =>
              description.toLowerCase().includes('amd') ||
              description.toLowerCase().includes('intel')
            );

            this.cpus[value] = cpu?.description ?? this.$t('No Data');
            this.options.cpu.size = cpu?.description ?? this.$t('No Data');
          })
          .catch(() => {
            this.options.cpu.size = this.$t('No Data');
          });
      });
    }
  }
}
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
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
