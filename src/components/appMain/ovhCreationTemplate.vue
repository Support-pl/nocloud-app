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
          <a-col span="24" v-if="types.length > 1">
            <a-radio-group v-model="type" @change="$emit('changeType', type)">
              <a-radio-button v-for="value of types" :key="value" :value="value">
                {{ value }}
              </a-radio-button>
            </a-radio-group>
          </a-col>
          <a-col span="24">
            <a-slider
              style="margin-top: 10px"
              v-if="resources.plans.length < 6 && resources.plans.length > 1"
              :marks="{ ...resources.plans }"
              :tip-formatter="null"
              :max="resources.plans.length - 1"
              :min="0"
              :value="resources.plans.indexOf(plan)"
              @change="(i) => $emit('changePlan', resources.plans[i])"
            />

            <div v-else class="order__slider">
              <div
                class="order__slider-item"
                v-for="provider of resources.plans"
                :key="provider"
                :class="{ 'order__slider-item--active': plan === provider }"
                @click="() => $emit('changePlan', provider)"
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
              @afterChange="setResource({ key: 'ram', value: options.ram.size })"
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
              @afterChange="setResource({ key: 'disk', value: options.disk.size / 1024 })"
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
              :style="{ boxShadow: `0 0 2px 2px var(${(vmName.length > 1) ? '--main' : '--err'})` }"
              @change="({ target: { value } }) => $emit('setData', { key: 'vmName', value })"
            />
            <div style="color: var(--err); margin-top: 5px" v-if="vmName.length < 2">
              {{ $t('ssl_product.field is required') }}
            </div>
            <password-meter
              style="height: 10px"
              v-if="false"
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
                  ({{ osPrice(item.prices) }} {{ currency }})
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
                {{ a.title }} ({{ addonPrice(a) }})
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
  name: 'ovh-creation-template',
  components: { passwordMeter },
  props: {
    getPlan: { type: Object, default: {} },
    itemSP: { type: Object, default: null },
    options: { type: Object, required: true },
    activeKey: { type: String, required: true },
    tarification: { type: String, required: true },
    locationId: { type: String, required: true },
    vmName: { type: String, required: true },
    password: { type: String, required: true },

    resources: { type: Object, required: true },
    addons: { type: Object, required: true },
    setData: { type: Function, required: true },

    plan: { type: String, required: true, default: '' },
    images: { type: Array, required: true },
    plans: { type: Array, required: true },
    allAddons: { type: Object, required: true },
    addonsCodes: { type: Object, required: true },
    price: { type: Object, required: true }
  },
  data: () => ({ isFlavorsLoading: false, type: '' }),
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

      this.$emit('setData', {
        key: `${(this.getPlan.type.includes('dedicated')) ? 'baremetal' : 'vps'}_os`,
        value: item.name, type: 'ovh'
      });
    },
    osName(name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0];
    },
    osPrice(prices) {
      const addon = prices.find(({ pricingMode }) => pricingMode === this.mode);

      return addon?.price.value ?? 0;
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
      const addons = Object.values(this.addonsCodes);

      this.$emit('setData', { key: 'priceOVH', value: this.price });
      this.$emit('setData', { key: 'addons', value: addons, type: 'ovh' });
    },
    addonName(addons) {
      const codes = Object.values(this.addonsCodes);
      const keys = Object.keys(addons);

      return codes.find((el) => keys.includes(el)) ?? '-1';
    },
    addonPrice({ periods }) {
      const period = periods.find(({ pricingMode }) => pricingMode === this.mode);

      return `${period.price.value} ${this.currency}`;
    },
    setResource(value) {
      if (this.getPlan.type.includes('vps')) {
        this.setData(this.planKey);
      } else {
        this.setData(value, false);
      }
    },
    changePlans() {
      const plans = [];
      const products = Object.keys(this.getPlan.products ?? {});

      products.forEach((key) => {
        const { title, price, meta } = this.getPlan.products[key];
        const label = title;
        const value = key.split(' ')[1];

        const i = plans.findIndex((plan) => plan.value === value);
        const period = {
          price: { value: price },
          duration: key.split(' ')[0],
          pricingMode: (key.split(' ')[0] === 'P1M') ? 'default' : 'upfront12'
        };

        this.$set(this.allAddons, value, meta.addons);

        const config = this.options.config.configuration
        const datacenter = Object.keys(config).find((key) => key.includes('datacenter'));

        if (!meta.datacenter.includes(config[datacenter])) return;
        if (i === -1) plans.push({ value, label, periods: [period] });
        else plans[i].periods.push(period);
      });

      plans.sort((a, b) => {
        const resA = a.value.split('-');
        const resB = b.value.split('-');

        const isCpuEqual = resB.at(-3) === resA.at(-3);
        const isRamEqual = resB.at(-2) === resA.at(-2);

        if (isCpuEqual && isRamEqual) return resA.at(-1) - resB.at(-1);
        if (isCpuEqual) return resA.at(-2) - resB.at(-2);
        return resA.at(-3) - resB.at(-3);
      });
      this.$emit('changePlans', plans);

      if (this.$route.query.data) {
        const data = JSON.parse(this.$route.query.data);

        this.$emit('changePlan', data.productSize);
      } else if (this.plan === '') {
        setTimeout(() => { this.$emit('changePlan', this.resources.plans[0]) });
      }
    }
  },
  created() { this.type = this.getPlan.type?.split(' ')[1] ?? this.types[0] ?? 'vps' },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    currency() {
      return this.$store.getters['nocloud/auth/billingData'].currency_code ?? 'USD';
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
    },
    types() {
      const plans = this.$store.getters['nocloud/plans/getPlans'].map((el) => el.type);

      return ['vps', 'dedicated'].filter((el) => plans.includes(`ovh ${el}`));
    }
  },
  watch: {
    getPlan() { this.changePlans() },
    type() { if (this.getPlan.type.includes('ovh')) this.changePlans() }
  }
}
</script>

<style scoped>
.order__slider{
	display: flex;
	overflow-x: auto;
  padding-bottom: 10px;
  padding-top: 15px;
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
	padding: 10px 20px;
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

<style>
.ant-slider-mark-text:first-of-type {
  width: auto !important;
  left: 0% !important;
  transform: translateX(-10px) !important;
}
</style>
