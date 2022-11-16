<template>
  <a-collapse
    accordion
    :activeKey="activeKey"
    :style="{ 'border-radius': '20px' }"
    @change="(value) => $emit('setData', { key: 'activeKey', value })"
  >
    <a-collapse-panel
      key="location"
      :header="`${$t('Location')}: ${(!itemSP) ? ' ' : ` (${itemSP.title})`}`"
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
              :marks="{ ...resources.plans }"
              :tip-formatter="null"
              :max="resources.plans.length - 1"
              :min="0"
              :value="resources.plans.indexOf(plan)"
              @change="(i) => plan = resources.plans[i]"
            />
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
      :disabled="!itemSP || isOSLoading || !plan"
      :header="`${$t('os')}: ${(options.os.name == '') ? ' ' : ` (${options.os.name})`}`"
    >
      <div class="newCloud__option-field" v-if="images.length > 0">
        <a-row>
          <a-col :xs="24" :sm="10">
            <a-input
              style="margin-bottom: 20px"
              :value="vmName"
              :placeholder="$t('VM name')"
              @change="({ target: { value } }) => $emit('setData', { key: 'vmName', value })"
            />
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
        v-else-if="!isOSLoading"
        show-icon
        type="warning"
        :message="$t('No OS. Choose another plan')"
      />
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
    </a-collapse-panel>

    <!-- Addons -->
    <a-collapse-panel
      key="addons"
      :disabled="!itemSP || isAddonsLoading || isOSLoading || !plan"
      :header="$t('Addons') + ':'"
      :style="{ 'border-radius': '0 0 20px 20px' }"
    >
      <template v-if="!isAddonsLoading">
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
              <a-select-option v-for="(_, id) in addon" :key="id">
                {{ id }}
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
export default {
  name: 'createInstance-ovh',
  props: {
    itemSP: { type: Object, default: null },
    options: { type: Object, required: true },
    activeKey: { type: String, required: true },
    tarification: { type: String, required: true },
    locationId: { type: String, required: true },
    vmName: { type: String, required: true }
  },
  data: () => ({
    cartId: '',
    itemId: '',
    plan: '',
    oldKey: '',

    isFlavorsLoading: false,
    isAddonsLoading: false,
    isOSLoading: false,

    images: [],
    plans: [],
    addons: {},
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
      } else if (this.prices.addons.os !== 0) {
        this.prices.addons.os = 0;
        this.$emit('setData', { key: 'priceOVH', value: this.price });
      }

      this.$emit('setData', { key: 'imageId', value: item.id, type: 'ovh' });
    },
    osName(name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0];
    },
    osPrice(prices) {
      const addon = prices.find(({ pricingMode }) => pricingMode === this.mode);

      return addon?.price.Value ?? 0;
    },
    getAddons(planCode) {
      this.isAddonsLoading = true;
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'get_options',
        params: { cartId: this.cartId, planCode }
      })
        .then(({ meta }) => {
          this.images.forEach(({ name }, i, arr) => {
            if (name.toLowerCase().includes('windows')) {
              const key = Object.keys(meta.os).find((name) => name.includes('windows'));

              arr[i].prices = meta.os[key];
            }
          });

          delete meta.os;
          this.addons = meta;
          this.oldKey = this.planKey;
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$message.error(message);
          console.error(err);
        })
        .finally(() => {
          this.isAddonsLoading = false;
        });
    },
    setAddon(planCode, periods, key) {
      if (planCode === '-1') {
        this.price.addons[key] = 0;
        this.$delete(this.addonsCodes, key);
      } else {
        const addon = periods.find(({ pricingMode }) => pricingMode === this.mode);

        this.price.addons[key] = addon.price.Value;
        this.$set(this.addonsCodes, key, planCode);
        this.setPlan(this.planKey);
      }

      this.$emit('setData', { key: 'priceOVH', value: this.price });
    },
    addonName(addons) {
      const codes = Object.values(this.addonsCodes);
      const keys = Object.keys(addons);

      return codes.find((el) => keys.includes(el)) ?? '-1';
    },
    setData(value) {
      const { periods } = this.plans.find((el) => el.value.includes(value));
      const resources = value.split('-');
      const tarifs = [];
      let plan = {};

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
            tarifs.push({ value: 'Monthly', label: 'ssl.Monthly' });
        }
      });
      this.price = {
        value: plan.price.Value,
        currency: 'NCU' || plan.price.CurrencyCode,
        addons: {}
      };

      this.$emit('setData', { key: 'periods', value: tarifs });
      this.$emit('setData', { key: 'priceOVH', value: this.price });
    },
    setPlan(planKey) {
      if (this.oldKey === planKey) return;
      const { periods, value } = this.plans.find((el) => el.value.includes(planKey));
      const plan = periods.find(({ pricingMode }) => pricingMode === this.mode);

      this.isOSLoading = true;
      if (this.itemId !== '') this.deletePlan();

      return this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'select_plan',
        params: {
          cartId: this.cartId,
          duration: plan.duration,
          pricingMode: plan.pricingMode,
          planCode: value
        }
      })
        .then(({ meta: { itemId } }) => {
          this.itemId = itemId;

          return this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
            method: 'get_os_and_datacenter',
            params: { cartId: this.cartId, itemId }
          });
        })
        .then(({ meta: { os } }) => {
          os.sort();
          this.images = os.map((el) => ({ name: el, desc: el }));
          this.getAddons(value);
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$message.error(message);
          console.error(err);
        })
        .finally(() => {
          this.isOSLoading = false;
        });
    },
    deletePlan() {
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'delete_plan',
        params: { cartId: this.cartId, itemId: this.itemId }
      })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$message.error(message);
          console.error(err);
        });
    },
    createVDS() {
      const { periods } = this.plans.find((el) => el.value.includes(this.planKey));
      const plan = periods.find(({ pricingMode }) => pricingMode === this.mode);

      this.setPlan(this.planKey).then(() => {
        return this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
          method: 'config_vds',
          params: {
            cartId: this.cartId,
            itemId: this.itemId,
            duration: plan.duration,
            pricingMode: plan.pricingMode,
            datacenter: this.region.replace(/\d/g, ''),
            addons: Object.values(this.addonsCodes),
            os: this.options.os.name
          }
        });
      })
      .catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err;

        this.$message.error(message);
        console.error(err);
      });
    },
    changeKey(obj, value) {
      const oldKey = Object.keys(obj)[0];
      const key = oldKey.split('-');

      key[key.length - 1] = `${value / 1024}g`;
      obj[key.join('-')] = obj[oldKey];
      delete obj[oldKey];
    }
  },
  created() {
    this.isFlavorsLoading = true;
    this.$emit('setData', { key: 'region', value: this.region, type: 'ovh' });
    this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
      method: 'create_cart'
    })
      .then(({ meta: { cartId } }) => {
        this.cartId = cartId;

        return this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
          method: 'get_plans',
          params: { cartId }
        });
      })
      .then(({ meta: { plans } }) => {
        this.plans = Object.entries(plans).map(
          ([value, periods]) => ({ label: value, value, periods })
        );

        this.plans.sort((a, b) => {
          const resA = a.value.split('-');
          const resB = b.value.split('-');

          const isCpuEqual = resB.at(-3) === resA.at(-3);
          const isRamEqual = resB.at(-2) === resA.at(-2);

          if (isCpuEqual && isRamEqual) return resA.at(-1) - resB.at(-1);
          if (isCpuEqual) return resA.at(-2) - resB.at(-2);
          return resA.at(-3) - resB.at(-3);
        });

        if (this.plan === '') {
          this.plan = this.resources.plans[1];
          this.setPlan(this.plans[1].value);
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
      const { extra } = this.itemSP?.locations.find(
        ({ id }) => id === location
      ) || {};

      if (!extra) return null;
      return extra.region;
    },
    resources() {
      const plans = new Set(this.plans.map(({ value }) => value.split('-')[1]));
      const ram = new Set();
      const disk = new Set();

      const filteredPlans = this.plans.filter(({ value }) =>
        value.includes(this.plan)
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
      const drive = { ...disk };
      drive.size /= 1024;

      const resources = [cpu, ram, drive].map(({ size }) => size);

      return `${this.plan}-${resources.join('-')}`;
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
    plan(plan) {
      const { value } = this.plans.find((el) => el.value.includes(plan));

      this.setData(value);
      if (plan === 'starter') this.setPlan(value);
    },
    'options.disk.size'(value) {
      if (this.addons.backup) this.changeKey(this.addons.backup, value);
      if (this.addons.snapshot) this.changeKey(this.addons.snapshot, value);
    }
  }
}
</script>
