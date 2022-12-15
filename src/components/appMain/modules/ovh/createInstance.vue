<template>
  <a-collapse
    accordion
    :activeKey="activeKey"
    :style="{ 'border-radius': '20px' }"
    @change="(value) => $emit('setData', { key: 'activeKey', value })"
  >
    <a-collapse-panel
      key="location"
      :header="`${$t('Location')}: ${(!itemSP) ? ' ' : ` (${region.title})`}`"
    >
      <slot name="location" />
    </a-collapse-panel>

    <a-collapse-panel
      key="plan"
      :header="`${$t('Plan')}: ${planHeader}`"
      :disabled="!itemSP || isFlavorsLoading"
    >
      <template v-if="!isFlavorsLoading">
        <a-row type="flex" align="middle" style="margin-bottom: 15px">
          <a-col span="24">
            <a-slider
              style="margin-top: 10px"
              v-if="resources.plans.length < 6"
              :marks="{ ...resources.plans }"
              :tip-formatter="null"
              :max="resources.plans.length - 1"
              :min="0"
              :value="resources.plans.indexOf(plan)"
              @change="(i) => plan = resources.plans[i]"
            />
            
            <div v-else class="order__slider">
              <div
                class="order__slider-item"
                v-for="provider of resources.plans"
                :key="provider"
                :class="{ 'order__slider-item--active': plan === provider }"
                @click="() => plan = provider"
              >
                {{ provider }}
              </div>
            </div>
          </a-col>
        </a-row>
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">CPU:</span>
          </a-col>
          <a-col class="changing__field" span="3" style="text-align: right">
            {{ options.cpu.size }} vCPU
          </a-col>
        </a-row>
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">RAM:</span>
          </a-col>
          <a-col span="18">
            <a-slider
              style="margin-top: 10px"
              v-if="resources.ram.length > 1"
              :marks="{ ...resources.ram }"
              :tip-formatter="null"
              :max="resources.ram.length - 1"
              :min="0"
              :value="resources.ram.indexOf(options.ram.size)"
              @change="(i) => options.ram.size = resources.ram[i]"
              @afterChange="setData(planKey)"
            />
          </a-col>
          <transition name="textchange" mode="out-in">
            <a-col class="changing__field" span="3" style="text-align: right">
              {{ options.ram.size }} Gb
            </a-col>
          </transition>
        </a-row>
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">{{ $t("Drive") }}:</span>
          </a-col>
          <a-col span="18">
            <a-slider
              style="margin-top: 10px"
              v-if="resources.disk.length > 1"
              :marks="{ ...resources.disk }"
              :tip-formatter="null"
              :max="resources.disk.length - 1"
              :min="0"
              :value="resources.disk.indexOf(parseInt(diskSize))"
              @change="(i) => options.disk.size = resources.disk[i] * 1024"
              @afterChange="setData(planKey)"
            />
          </a-col>
          <a-col class="changing__field" span="3" style="text-align: right">
            {{ diskSize }}
          </a-col>
        </a-row>
      </template>
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
    </a-collapse-panel>

    <!-- OS -->
    <a-collapse-panel
      key="OS"
      :disabled="!itemSP || isFlavorsLoading || !plan"
      :header="`${$t('os')}: ${(options.os.name == '') ? ' ' : ` (${options.os.name})`}`"
    >
      <div class="newCloud__option-field" v-if="images.length > 0">
        <a-row style="margin-bottom: 20px">
          <a-col :xs="24" :sm="10">
            <a-input
              :value="vmName"
              :placeholder="$t('VM name')"
              @change="({ target: { value } }) => $emit('setData', { key: 'vmName', value })"
            />
            <password-meter
              style="height: 10px"
              :password="password"
              @score="(value) => $emit('score', value)"
            />

            <a-form-item style="margin-bottom: 0px" v-if="false">
              <a-input-password
                class="password"
                :value="password"
                :placeholder="$t('clientinfo.password')"
                @change="({ target: { value } }) => $emit('setData', { key: 'password', value })"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <div class="newCloud__template" v-if="this.itemSP">
          <div
            v-for="(item, index) in images"
            class="newCloud__template-item"
            :key="index"
            :class="{ active: options.os.name === item.name }"
            @click="setOS(item, index)"
          >
            <template v-if="item.warning">
              <div class="newCloud__template-image">
                <img src="/img/OS/default.png" :alt="item.desc" />
              </div>
              <div class="newCloud__template-name">{{ item.name }}</div>
            </template>
            <template v-else>
              <div class="newCloud__template-image">
                <img :src="`/img/OS/${osName(item.name)}.png`" :alt="item.desc" />
              </div>
              <div class="newCloud__template-name">
                {{ item.name }} <br>
                <template v-if="item.prices">
                  ({{ osPrice(item.prices) }} {{ price.currency }})
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
      <a-alert
        v-else-if="!isFlavorsLoading"
        show-icon
        type="warning"
        :message="$t('No OS. Choose another plan')"
      />
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
    </a-collapse-panel>

    <!-- Addons -->
    <a-collapse-panel
      key="addons"
      :disabled="!itemSP || isFlavorsLoading || !plan"
      :header="$t('Addons') + ':'"
      :style="{ 'border-radius': '0 0 20px 20px' }"
    >
      <template v-if="!isFlavorsLoading">
        <a-row class="newCloud__prop" v-for="(addon, key) in addons" :key="key">
          <a-col span="8" :xs="6">{{ $t(key) | capitalize }}:</a-col>
          <a-col span="16" :xs="18">
            <a-select
              default-value="-1"
              style="width: 100%"
              :value="addonName(addon)"
              @change="(value) => setAddon(value, addon[value], key)"
            >
              <a-select-option value="-1">{{ $t('none') }}</a-select-option>
              <a-select-option v-for="(a, id) in addon" :key="id">
                {{ a.productName }}
              </a-select-option>
            </a-select>
          </a-col>
        </a-row>
      </template>
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
    </a-collapse-panel>
  </a-collapse>
</template>

<script>
import passwordMeter from 'vue-simple-password-meter';

export default {
  name: 'createInstance-ovh',
  components: { passwordMeter },
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
    isFlavorsLoading: false,
    images: [],
    plans: [],
    meta: {},
    allAddons: {},
    addonsCodes: {},
    price: {}
  }),
  methods: {
    setOS(item, index) {
      if (item.warning) return;
      this.options.os.id = +index;
      this.options.os.name = item.name;

      if (item.prices) {
        this.price.addons.os = this.osPrice(item.prices);
        this.$emit('setData', { key: 'priceOVH', value: this.price });
      } else if (this.price.addons.os !== 0) {
        this.price.addons.os = 0;
        this.$emit('setData', { key: 'priceOVH', value: this.price });
      }

      this.$emit('setData', { key: 'os', value: item.name, type: 'ovh' });
    },
    osName(name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0];
    },
    osPrice(prices) {
      const addon = prices.find(({ pricingMode }) => pricingMode === this.mode);

      return addon?.price.value ?? 0;
    },
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
    setAddon(planCode, addon, key) {
      if (planCode === '-1') {
        delete this.price.addons[key];
        this.$delete(this.addonsCodes, key);
      } else {
        const period = addon.periods.find(({ pricingMode }) => pricingMode === this.mode);

        this.price.addons[key] = period.price.value;
        this.$set(this.addonsCodes, key, planCode);
      }

      this.$emit('setData', { key: 'priceOVH', value: this.price });
      this.$emit('setData', { key: 'addons', value: this.addonsCodes, type: 'ovh' });
    },
    addonName(addons) {
      const codes = Object.values(this.addonsCodes);
      const keys = Object.keys(addons);

      return codes.find((el) => keys.includes(el)) ?? '-1';
    },
    setData(planKey) {
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
      this.price = {
        value: plan.price.value,
        currency: 'NCU' || plan.price.currencyCode,
        addons: {}
      };

      this.$emit('setData', { key: 'periods', value: tarifs });
      this.$emit('setData', { key: 'priceOVH', value: this.price });
      this.$emit('setData', { key: 'planCode', value, type: 'ovh' });
      this.$emit('setData', { key: 'duration', value: plan.duration, type: 'ovh' });
      this.$emit('setData', { key: 'pricingMode', value: plan.pricingMode, type: 'ovh' });
    }
  },
  created() {
    this.$emit('setData', {
      key: 'datacenter', type: 'ovh',
      value: this.region.value.replace(/\d/g, '')
    });
    this.isFlavorsLoading = true;
    this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
      method: 'get_plans'
    })
      .then(({ meta }) => {
        const plans = [];
        const products = Object.keys(this.getPlan.products);

        meta.plans.forEach(({ prices, planCode }) => {
          const i = products.findIndex((key) => key.includes(planCode));

          if (i !== -1) {
            const { title, price } = this.getPlan.products[products[i]];

            plans.push({
              value: planCode, label: title,
              periods: prices.filter(({ pricingMode, duration }) => {
                const productDuration = products[i].split(' ')[0];
                const isMonthly = duration === productDuration && pricingMode === 'default';
                const isYearly = duration === productDuration && pricingMode === 'upfront12';

                return (isMonthly || isYearly);
              })
              .map((period) => ({ ...period, price: { ...period.price, value: price } }))
            });
          }
        });
        this.plans = plans;

        this.plans.sort((a, b) => {
          const resA = a.value.split('-');
          const resB = b.value.split('-');

          const isCpuEqual = resB.at(-3) === resA.at(-3);
          const isRamEqual = resB.at(-2) === resA.at(-2);

          if (isCpuEqual && isRamEqual) return resA.at(-1) - resB.at(-1);
          if (isCpuEqual) return resA.at(-2) - resB.at(-2);
          return resA.at(-3) - resB.at(-3);
        });

        this.setAddons(meta.catalog.plans);
        this.meta = meta;

        if (this.plan === '') {
          this.plan = this.resources.plans[0];
          this.setData(this.plans[0].value);
        }
      })
      .catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err;

        this.$message.error(message);
        console.error(err);
      })
      .finally(() => {
        this.isFlavorsLoading = false;
      });
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    region() {
      const location = this.locationId.split(' ').at(-1);
      const { extra, title } = this.itemSP?.locations.find(
        ({ id }) => id === location
      ) || {};

      if (!extra) return null;
      return { value: extra.region, title };
    },
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

      Object.keys(addons).forEach((key) => {
        this.meta[key].forEach(({ prices, planCode, productName }) => {
          const { value } = this.plans.find((el) => el.value.includes(this.planKey)) || {};
          const i = this.getPlan.resources.findIndex((res) =>
            res.key.includes(`${(this.mode === 'upfront12') ? 'P1Y' : 'P1M'} ${planCode}`)
          );
          const resourceDuration = this.getPlan.resources[i]?.key.split(' ')[0];

          const periods = prices.filter(({ pricingMode, duration }) =>
            duration === resourceDuration && pricingMode === this.mode
          ).map((period) => ({ ...period, price: {
            ...period.price, value: this.getPlan.resources[i]?.price
          }}));

          if (this.allAddons[value]?.includes(planCode) && periods.length > 0) {
            addons[key][planCode] = { periods, productName };
          }
        });
      });

      return addons;
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
    },
    planHeader() {
      if (this.itemSP) return this.plan && ` (${this.plan})`;
      else return ' ';
    },
    diskSize() {
      const size = (this.options.disk.size / 1024).toFixed(1);

      return (size >= 1) ? `${size} Gb` : `${this.options.disk.size} Mb`;
    }
  },
  watch: {
    tarification() { this.setData(this.planKey) },
    plan(value) {
      const plan = this.plans.find(({ label }) => label.includes(value));

      this.setData(plan.value);
      this.$emit('setData', { key: 'productSize', value });
      const { configurations } = this.meta.catalog.plans.find(
        ({ planCode }) => planCode.includes(this.planKey)
      );
      const os = configurations[1].values;

      os.sort();
      this.images = os.map((el) => ({ name: el, desc: el }));
      this.images.forEach(({ name }, i, arr) => {
        if (name.toLowerCase().includes('windows')) {
          const windows = this.meta.windows.find(
            ({ planCode }) => planCode.includes(this.planKey)
          );

          arr[i].prices = windows.prices.filter(({ pricingMode, duration }) => {
            const isMonthly = duration === 'P1M' && pricingMode === 'default';
            const isYearly = duration === 'P1Y' && pricingMode === 'upfront12';

            return (isMonthly || isYearly);
          });
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

<style scoped>
.order__slider{
	display: flex;
	overflow-x: auto;
  padding-bottom: 10px;
}

.order__slider-item:not(:last-child){
	margin-right: 10px;
}

.order__slider-item{
	flex-shrink: 0;
	/* border: 1px solid rgba(0, 0, 0, .15); */
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
	display: flex;
	justify-content: center;
	align-items: center;
	width: 150px;
	height: 70px;
	cursor: pointer;
	border-radius: 15px;
	font-size: 1.1rem;
	transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover{
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active{
	background-color: var(--main);
	color: #fff;
}
</style>
