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
        <a-col :xs="4" :sm="3">{{ $t('model') | capitalize }}:</a-col>
        <a-col :xs="20" :sm="9">
          <a-select
            style="width: 100%"
            v-model="flavor"
            :placeholder="$t('model') | capitalize"
            :options="flavors"
            :loading="isFlavorsLoading"
            @change="setData"
          />
        </a-col>
        <a-col :xs="5" :sm="3">{{ $t('OS type') }}:</a-col>
        <a-col :xs="19" :sm="9">
          <a-select
            style="width: 100%"
            v-model="osType"
            :placeholder="$t('OS type')"
            :options="osTypes"
            :loading="isOSLoading"
            @change="getOS"
          />
        </a-col>
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
      :disabled="!itemSP || isOSLoading || !flavor"
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
        v-else
        show-icon
        type="warning"
        :message="$t('No OS. Choose another model')"
      />
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
    flavor: '',
    osType: '',
    osTypes: [
      { label: 'all', value: '' },
      { label: 'baremetal-linux', value: 'baremetal-linux '},
      { label: 'bsd', value: 'bsd' },
      { label: 'linux', value: 'linux' },
      { label: 'windows', value: 'windows' }
    ],
    isFlavorsLoading: false,
    isOSLoading: false,
    allFlavors: [],
    flavors: [],
    images: []
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
    },
    osName(name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0];
    },
    setData(value) {
      const flavor = this.allFlavors.find((el) =>
        (el.region === this.region) && (el.name === value)
      );
      const drive = flavor?.type.split('.')[1];

      this.options.cpu.size = flavor.vcpus;
      this.options.ram.size = +(flavor.ram / 1024).toFixed(2);
      this.options.disk.size = flavor.disk * 1024;
      this.options.drive = (drive === 'ssd') ? true : false;
      this.$emit('setData', { key: 'flavorId', value: flavor.id, type: 'ovh' });

      this.getOS();
    }
  },
  created() {
    this.isFlavorsLoading = true;
    this.$emit('setData', { key: 'region', value: this.region, type: 'ovh' });
    this.$api.post(`/sp/${this.itemSP.uuid}/invoke`, {
      method: 'flavors',
      params: { region: this.region }
    })
      .then(({ meta }) => {
        this.allFlavors = meta.result;
        meta.result.forEach((el) => {
          if (this.flavors.find(({ value }) => value === el.name)) return;
          this.flavors.push({ value: el.name, label: el.name.toUpperCase() });
        });
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
    planHeader() {
      if (this.itemSP) {
        return this.tarification === "Monthly"
          ? ` (VDS ${this.$t("Pre-Paid")})`
          : ` (VDC ${this.$t("Pay-as-you-Go")})`;
      } else {
        return " ";
      }
    },
    diskSize() {
      const size = (this.options.disk.size / 1024).toFixed(1);

      return (size >= 1) ? `${size} Gb` : `${this.options.disk.size} Mb`;
    }
  }
}
</script>
