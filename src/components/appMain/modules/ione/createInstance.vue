<template>
  <a-collapse
    accordion
    :activeKey="activeKey"
    :style="{ 'border-radius': '20px' }"
    @change="(value) => $emit('setData', { key: 'activeKey', value })"
  >
    <a-collapse-panel
      key="location"
      :header="`${$t('Location')}: ${(!itemSP) ? ' ' : ` (${itemSP.locations[0].title})`}`"
    >
      <slot name="location" />
    </a-collapse-panel>

    <a-collapse-panel
      key="plan"
      :header="`${$t('Plan')}: ${planHeader}`"
      :disabled="itemSP ? false : true"
    >
      <template v-if="getPlan">
        <a-slider
          style="margin-top: 10px"
          v-if="isLinked"
          :marks="{ ...getProducts }"
          :tip-formatter="null"
          :max="getProducts.length - 1"
          :min="0"
          :value="getProducts.indexOf(productSize)"
          @change="(value) => $emit('setData', { key: 'productSize', value: getProducts[value] })"
        />
        <a-row
          type="flex"
          justify="space-between"
          align="middle"
          class="newCloud__prop"
          :style="{ marginTop: (!isLinked) ? null : '50px' }"
        >
          <a-col>
            <span style="display: inline-block; width: 70px">CPU:</span>
          </a-col>
          <a-col class="changing__field" span="6" style="text-align: right">
            <template v-if="isLinked">{{ options.cpu.size }} vCPU</template>
            <template v-else>
              <a-input-number allow-clear v-model="options.cpu.size" :min="0" :max="32" /> Gb
            </template>
          </a-col>
        </a-row>
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">RAM:</span>
          </a-col>
          <transition name="textchange" mode="out-in">
            <!-- :key="
                getCurrentProd != null
                  ? getCurrentProd.props.ram.TITLE
                  : 'DefaultKeyForRAM'
              " -->
            <a-col class="changing__field" span="6" style="text-align: right">
              <template v-if="isLinked">{{ options.ram.size }} Gb</template>
              <template v-else>
                <a-input-number allow-clear v-model="options.ram.size" :min="0" :max="64" /> Gb
              </template>
            </a-col>
          </transition>
        </a-row>
        <a-row class="newCloud__prop">
          <a-col span="8" :xs="6">
            <span style="display: inline-block; width: 70px"
              >{{ $t("Drive") }}:</span
            >
          </a-col>
          <a-col :xs="12" :sm="14">
            <a-switch v-model="options.drive" style="width: 60px">
              <span slot="checkedChildren">SSD</span>
              <span slot="unCheckedChildren">HDD</span>
            </a-switch>
          </a-col>
          <a-col class="changing__field" style="text-align: right" :sm="4" :xs="6">
            <template v-if="isLinked">{{ diskSize }}</template>
            <template v-else>
              <a-input-number allow-clear v-model="options.disk.size" :min="0" :max="512 * 1024" /> Mb
            </template>
          </a-col>
        </a-row>
        <a-row class="newCloud__prop" v-if="isLinked">
          <a-col>{{ $t("Drive size") }}:</a-col>
          <a-col>
            <a-slider
              style="margin-top: 10px"
              :tip-formatter="null"
              :step="options.disk.step"
              :max="options.disk.max"
              :min="options.disk.min"
              :value="parseFloat(diskSize)"
              @change="(value) => (options.disk.size = value * 1024)"
            />
          </a-col>
        </a-row>
      </template>
      <a-alert
        v-else
        show-icon
        type="warning"
        :message="$t('No linked plans. Choose another location')"
      />
      <!-- <a-row class="newCloud__prop">
          <a-col span="8" :xs="6"
            >{{ $t("traffic") | capitalize }}:</a-col
          >
          <a-col span="16" :xs="18">
            <a-select
              default-value="-1"
              style="width: 100%"
              @change="(newdata) => setAddon('traffic', +newdata)"
            >
              <a-select-option value="-1">{{
                $t("under 3 Gb per month") | capitalize
              }}</a-select-option>
              <a-select-option
                v-for="group in getAddons.traffic"
                :key="group.id"
              >
                {{
                  $t(
                    `newPaaSTrafficItem.${group.description.TITLE.replace(
                      "Безлимитный, скорость канала не менее",
                      "Безлимит, от "
                    )}`
                  )
                }}
              </a-select-option>
            </a-select>
          </a-col>
        </a-row> -->
      <!-- </a-skeleton> -->
    </a-collapse-panel>

    <!-- OS -->
    <a-collapse-panel
      key="OS"
      :disabled="!itemSP || !getPlan"
      :header="`${$t('os')}: ${(options.os.name == '') ? ' ' : ` (${options.os.name})`}`"
    >
      <div class="newCloud__option-field">
        <div class="newCloud__template" v-if="this.itemSP">
          <div
            v-for="(item, index) in itemSP && itemSP.publicData.templates"
            class="newCloud__template-item"
            :key="index"
            :class="{ active: options.os.name == item.name }"
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
        <a-row>
          <a-col :xs="24" :sm="10">
            <!-- <a-form-model-item> -->
            <a-input
              style="margin-top: 15px"
              :style="{ boxShadow: (vmName.length < 2) ? '0 0 2px 2px var(--err)' : null }"
              :value="vmName"
              :placeholder="$t('VM name')"
              @change="({ target: { value } }) => $emit('setData', { key: 'vmName', value })"
            />
            <div style="color: var(--err); margin-top: 5px" v-if="vmName.length < 2">
              {{ $t('ssl_product.field is required') }}
            </div>

            <password-meter
              style="height: 10px"
              :password="password"
              @score="(value) => $emit('score', value)"
            />

            <!-- <span style="color: red">{{ textInvalid }}</span> -->
            <!-- </a-form-model-item> -->
            <!-- <a-form-model-item> -->

            <a-form-item style="margin-bottom: 0px">
              <a-input-password
                class="password"
                :value="password"
                :placeholder="$t('clientinfo.password')"
                @change="({ target: { value } }) => $emit('setData', { key: 'password', value })"
              />
            </a-form-item>
            <!-- </a-form-model-item> -->
            <a-select
              placeholder="SSH key"
              style="width: 100%; margin-top: 18px"
              :options="user.data && user.data.ssh_keys"
              :value="sshKey"
              @change="(value) => $emit('setData', { key: 'sshKey', value })"
            />
          </a-col>
        </a-row>
      </div>
    </a-collapse-panel>

    <!-- network -->
    <a-collapse-panel
      v-if="false && getPlan.kind === 'STATIC'"
      key="network"
      :header="`${$t('Network')}: ${networkHeader}`"
      :disabled="itemSP ? false : true"
    >
      <div class="newCloud__option-field">
        <a-row :gutter="[10, 10]">
          <a-col :sm="12" :span="24">
            <a-row :style="{ display: 'flex', alignItems: 'center' }">
              <a-col :sm="10" :span="12">
                {{ $t("Public network") }}:
              </a-col>
              <a-col :sm="12" :span="12">
                <a-switch
                  v-model="options.network.public.status"
                  @change="changeNetwork('public')"
                />
                <a-input-number
                  v-model="options.network.public.count"
                  :min="(options.network.public.status) ? 1 : 0"
                  :max="10"
                  :disabled="!options.network.public.status"
                  :style="{ 'margin-left': '10px' }"
                />
              </a-col>
            </a-row>
          </a-col>

          <a-col :sm="12" :span="24">
            <a-row :style="{ display: 'flex', alignItems: 'center' }">
              <a-col :sm="10" :span="12">
                {{ $t("Private network") }}:
              </a-col>
              <a-col :sm="12" :span="12">
                <a-switch
                  v-model="options.network.private.status"
                  @change="changeNetwork('private')"
                />
                <a-input-number
                  v-model="options.network.private.count"
                  :min="(options.network.private.status) ? 1 : 0"
                  :max="10"
                  :disabled="!options.network.private.status"
                  :style="{ 'margin-left': '10px' }"
                />
              </a-col>
            </a-row>
          </a-col>
        </a-row>
      </div>
    </a-collapse-panel>

    <!-- Addons -->
    <!-- <div class="paas_addons" v-if="!isAddonsLoading"> -->
    <!-- <a-collapse-panel
      key="addons"
      :header="$t('Addons') + ':'"
      :style="{ 'border-radius': '0 0 20px 20px' }"
    >
      <a-row class="newCloud__prop">
        <a-col span="8" :xs="6"
          >{{ $t("panel") | capitalize }}:</a-col
        >
        <a-col span="16" :xs="18">
          <a-select
            default-value="-1"
            style="width: 100%"
            @change="(newdata) => setAddon('panel', +newdata)"
          >
            <a-select-option value="-1">{{
              $t("none")
            }}</a-select-option>
            <a-select-option
              v-for="group in getAddons.panel"
              :key="group.id"
              >{{ group.description.TITLE }}</a-select-option
            >
          </a-select>
        </a-col>
      </a-row>

      <a-row class="newCloud__prop">
        <a-col span="8" :xs="6"
          >{{ $t("backup HDD") | capitalize }}:</a-col
        >
        <a-col span="16" :xs="18">
          <a-select
            default-value="-1"
            style="width: 100%"
            @change="(newdata) => setAddon('backup', +newdata)"
          >
            <a-select-option value="-1">0 Gb</a-select-option>
            <a-select-option
              v-for="group in getAddons.backup"
              :key="group.id"
              >{{ group.description.TITLE }}</a-select-option
            >
          </a-select>
        </a-col>
      </a-row>
    </a-collapse-panel> -->
    <!-- </div> -->
  </a-collapse>
</template>

<script>
import passwordMeter from "vue-simple-password-meter";

export default {
  name: 'createInstance-ione',
  components: { passwordMeter },
  props: {
    activeKey: { type: String, required: true },
    itemSP: { type: Object, default: null },
    getPlan: { type: Object, required: true },
    options: { type: Object, required: true },
    getProducts: { type: Array, required: true },
    productSize: { type: String, required: true },
    tarification: { type: String, required: true },
    vmName: { type: String, required: true },
    password: { type: String, required: true },
    sshKey: { type: String }
  },
  methods: {
    setOS(item, index) {
      if (item.warning) return;
      this.options.os.id = +index;
      this.options.os.name = item.name;
    },
    osName(name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0];
    },
    changeNetwork(type) {
      switch (type) {
        case 'public':
          if (!this.options.network.public.status) {
            this.options.network.private.status = true;
            this.options.network.public.count = 0;
          }
          break;
        case 'private':
          if (!this.options.network.private.status) {
            this.options.network.public.status = true;
            this.options.network.private.count = 0;
          }
          break;
      }
    },
    changeMinMax(value) {
      const { max, min } = this.options.disk;

      if (value === 128 && max === 128) this.options.disk.min -= 20;
      if (max === value) {
        if (max >= 512) return;
        this.options.disk.max += 128;
        this.options.disk.min += 128;
      }
      if (min === 128 && value === 128) this.options.disk.min += 20;
      if (min === value) {
        if (min <= 20) return;
        this.options.disk.max -= 128;
        this.options.disk.min -= 128;
      }
    },
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    plans() {
      return this.$store.getters['nocloud/plans/getPlans'];
    },
    isLinked() {
      return this.getProducts.length > 1 && this.tarification === 'Hourly' &&
        this.getPlan?.meta?.linkedPlan || this.tarification !== 'Hourly';
    },
    networkHeader() {
      const pub = this.options.network.public;
      const priv = this.options.network.private;

      if (!this.itemSP) {
        return " ";
      }
      if (pub.status && priv.status) {
        return ` (Public - ${pub.count}, Private - ${priv.count})`;
      }
      if (pub.status) {
        return ` (Public - ${pub.count})`;
      }
      if (priv.status) {
        return ` (Private - ${priv.count})`;
      }
      return " ";
    },
    planHeader() {
      if (this.itemSP && this.getPlan) {
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
  },
  watch: {
    getProducts() {
      const value = [];
      const month = 3600 * 24 * 30;
      const year = 3600 * 24 * 365;

      this.plans.forEach((plan) => {
        if (plan.kind === 'DYNAMIC') value.push(
          { value: 'Hourly', label: 'ssl_product.Hourly' }
        );

        if (plan.kind !== 'STATIC') return;
        const periods = Object.values(plan.products).map((el) => +el.period);

        if (periods.includes(month)) value.push(
          { value: 'Monthly', label: 'ssl_product.Monthly' }
        );

        if (periods.includes(year)) value.push(
          { value: 'Annually', label: 'annually' }
        );

        if (periods.includes(year * 2)) value.push(
          { value: 'Biennially', label: 'biennially' }
        );
      });

      this.options.drive = false;
      this.$emit('setData', { key: 'periods', value });
    }
  }
}
</script>
