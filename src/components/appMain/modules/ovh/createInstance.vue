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
      <a-row type="flex" align="middle" :gutter="[10, 10]">
        <a-col :xs="4" :sm="3">{{ $t('Plan') | capitalize }}:</a-col>
        <a-col :xs="20" :sm="9">
          <a-select
            style="width: 100%"
            v-model="plan"
            :placeholder="$t('Plan') | capitalize"
            :options="plans"
            :loading="isFlavorsLoading"
            @change="setData"
          />
        </a-col>
        <!-- <a-col :xs="5" :sm="3">{{ $t('OS type') }}:</a-col>
        <a-col :xs="19" :sm="9">
          <a-select
            style="width: 100%"
            v-model="osType"
            :placeholder="$t('OS type')"
            :options="osTypes"
            :loading="isOSLoading"
            @change="getOS"
          />
        </a-col> -->
      </a-row>
      <a-row
        type="flex"
        justify="space-between"
        align="middle"
        class="newCloud__prop"
        style="margin-top: 15px"
      >
        <a-col>
          <span style="display: inline-block; width: 70px">CPU:</span>
        </a-col>
        <a-col class="changing__field" span="6" style="text-align: right">
          {{ options.cpu.size }} vCPU
        </a-col>
      </a-row>
      <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
        <a-col>
          <span style="display: inline-block; width: 70px">RAM:</span>
        </a-col>
        <transition name="textchange" mode="out-in">
          <a-col class="changing__field" span="6" style="text-align: right">
            {{ options.ram.size }} Gb
          </a-col>
        </transition>
      </a-row>
      <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
        <a-col>
          <span style="display: inline-block; width: 70px">{{ $t("Drive") }}:</span>
        </a-col>
        <a-col class="changing__field" span="6" style="text-align: right">
          {{ diskSize }}
        </a-col>
      </a-row>
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
              <div class="newCloud__template-name">{{ item.name }}</div>
            </template>
          </div>
        </div>
      </div>
      <a-alert
        v-else-if="!isOSLoading"
        show-icon
        type="warning"
        :message="$t('No OS. Choose another model')"
      />
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
      <a-alert
        show-icon
        type="warning"
        style="margin-top: 16px"
        v-if="images.find(({ name }) => name.toLowerCase().includes('windows'))"
        :message="$t('Windows is paid')"
      />
    </a-collapse-panel>

    <!-- Addons -->
    <a-collapse-panel
      key="addons"
      :disabled="!itemSP || isAddonsLoading || !plan"
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
              @change="(value) => setAddon(value, addon[value])"
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
    // flavor: '',
    // osType: '',
    cartId: '',
    itemId: '',
    plan: '',
    // osTypes: [
    //   { label: 'all', value: '' },
    //   { label: 'baremetal-linux', value: 'baremetal-linux '},
    //   { label: 'bsd', value: 'bsd' },
    //   { label: 'linux', value: 'linux' },
    //   { label: 'windows', value: 'windows' }
    // ],
    isFlavorsLoading: false,
    isAddonsLoading: false,
    isOSLoading: false,
    // allFlavors: [],
    // flavors: [],
    images: [],
    plans: [],
    addons: {},
    price: {}
  }),
  methods: {
    getOS() {
      const flavor = this.flavor;
      const region = this.region;
      const os = this.osType;

      if (!flavor) return;
      this.isOSLoading = true;
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'images',
        params: { flavor, region, os }
      })
        .then(({ meta }) => {
          this.images = meta.result;
        })
        .finally(() => {
          this.isOSLoading = false;
        });
    },
    setOS(item, index) {
      if (item.warning) return;
      this.options.os.id = +index;
      this.options.os.name = item.name;

      this.$emit('setData', { key: 'imageId', value: item.id, type: 'ovh' });
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'select_os_and_datacenter',
        params: {
          cartId: this.cartId,
          itemId: this.itemId,
          datacenter: this.region,
          os: item.name
        }
      });
    },
    osName(name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0];
    },
    getAddons(planCode) {
      this.isAddonsLoading = true;
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'get_options',
        params: { cartId: this.cartId, planCode }
      })
        .then(({ meta }) => {
          this.addons = meta;
        })
        .finally(() => {
          this.isAddonsLoading = false;
        });
    },
    setAddon(planCode, periods) {
      let mode = '';
      switch (this.tarification) {
        case 'Annually':
          mode = 'upfront12';
          break;
        case 'Biennially':
          mode = 'upfront24';
          break;
        default:
          mode = 'default';
          break;
      }
      const addon = periods.find(({ pricingMode }) => pricingMode === mode);

      this.price.addons += addon.price.Value;
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
        method: 'select_option',
        params: {
          itemId: this.itemId,
          cartId: this.cartId,
          duration: addon.duration,
          pricingMode: addon.pricingMode,
          planCode
        }
      })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$message.error(message);
          console.error(err);
        });
    },
    setData(value) {
      // const flavor = this.allFlavors.find((el) =>
      //   (el.region === this.region) && (el.name === value)
      // );
      // const drive = flavor?.type.split('.')[1];
      const resources = value.split('-');

      this.options.cpu.size = +resources.at(-3);
      this.options.ram.size = +resources.at(-2);
      this.options.disk.size = resources.at(-1) * 1024;
      this.options.drive = true;
      // this.$emit('setData', { key: 'flavorId', value: flavor.id, type: 'ovh' });
      let mode = '';
      switch (this.tarification) {
        case 'Annually':
          mode = 'upfront12';
          break;
        case 'Biennially':
          mode = 'upfront24';
          break;
        default:
          mode = 'default';
          break;
      }

      const { periods } = this.plans.find((el) => el.value === value);
      const tarifs = [];
      let plan = {};

      this.getAddons(value);
      periods.forEach((period) => {
        if (period.pricingMode === mode) plan = period;
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
        currency: plan.price.CurrencyCode,
        addons: 0
      };

      this.$emit('setData', { key: 'periods', value: tarifs });
      this.$emit('setData', { key: 'priceOVH', value: this.price });

      this.isOSLoading = true;
      this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
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

          this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
            method: 'get_os_and_datacenter',
            params: { cartId: this.cartId, itemId }
          })
            .then(({ meta: { os } }) => {
              os.sort();
              this.images = os.map((el) => ({ name: el, desc: el }));
            })
            .finally(() => {
              this.isOSLoading = false;
            });
        });
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
      })
    // this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
    //   method: 'flavors',
    //   params: { region: this.region }
    // })
    //   .then(({ meta: { result } }) => {
    //     this.allFlavors = result;
    //     result.forEach((el) => {
    //       if (this.flavors.find(({ value }) => value === el.name)) return;
    //       this.flavors.push({ value: el.name, label: el.name.toUpperCase() });
    //     });
    //   })
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
    tarification() { this.setData(this.plan) }
  }
}
</script>
