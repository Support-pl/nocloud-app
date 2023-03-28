<template>
  <div class="Fcloud">
    <slot name="header" />
    <div class="Fcloud__buttons" v-if="!VM.state && false">
      <div class="Fcloud__button" @click="deployService()">
        <div class="Fcloud__BTN-icon">
          <a-icon type="deployment-unit" />
        </div>
        <div class="Fcloud__BTN-title">
          <!-- {{$t('Start')}} -->
          {{ $t('Deploy') }}
        </div>
      </div>
    </div>
    <div class="Fcloud__buttons" v-else>
      <div
        class="Fcloud__button"
        v-if="VM.state && VM.state.state !== 'STOPPED'"
        :class="{ disabled: statusVM.shutdown, }"
        @click="sendAction('stop')"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop"></div>
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Power off") }}</div>
      </div>
      <div
        v-else
        class="Fcloud__button"
        :class="{ disabled: statusVM.start, }"
        @click="sendAction('start')"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="caret-right" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Start") }}</div>
      </div>
      <div
        class="Fcloud__button btn_disabled_wiggle"
        :class="{ disabled: statusVM.reboot }"
        @click="sendAction('reboot')"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="redo" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Reboot") }}</div>
      </div>
      <div
        class="Fcloud__button"
        @click="openModal('recover')"
        :class="{ disabled: statusVM.recover }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="backward" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Recover") }}</div>
        <a-modal
          v-model="modal.recover"
          :title="$t('cloud_Recover_modal')"
          @ok="sendRecover"
        >
          <template v-if="VM.config.addons?.find((el) => el.includes('backup'))">
            <p>{{ $t("cloud_Recover_invite_line1") }}</p>
            <p>{{ $t("cloud_Recover_invite_line2") }}</p>
            <p>{{ $t("cloud_Recover_invite_line3") }}</p>
            <p>{{ $t("cloud_Recover_invite") }}</p>
            <a-spin :tip="$t('loading')" :spinning="actionLoading">
              <a-radio-group name="recover" v-model="option.recover">
                <a-radio v-for="date of dates" :key="date" :value="date">{{ date }}</a-radio>
              </a-radio-group>
            </a-spin>
          </template>
          <a-button
            v-else
            type="primary"
            shape="round"
            size="large"
            :loading="actionLoading"
            @click="sendAddingAddon('backup')"
          >
            {{ $t("Add recover") }}
          </a-button>
        </a-modal>
      </div>
    </div>

    <div class="Fcloud__info">
      <div class="Fcloud__info-header">
        <div class="Fcloud__info-title">
          {{ $t("Information") }}
        </div>
      </div>
      <div
        class="Fcloud__info-block block"
        v-if="VM.state && VM.state.meta.networking"
      >
        <div class="Fcloud__block-header">
          <a-icon type="flag" theme="filled" />
          IP
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column" style="flex-direction: row">
            <div
              class="block__value" v-if="dataSP" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in networking.public" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="block__value" v-if="dataSP" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in networking.private" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="environment" theme="filled" />
          {{ $t("Location") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div
              class="block__value"
              v-if="dataSP"
              style="font-size: 18px"
            >
              {{ locationTitle }}
            </div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="info-circle" />
          {{ $t("info") | capitalize }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">OS</div>
            <div class="block__value">
              {{ osName || $t('No Data') }}
            </div>
          </div>
          <div class="block__column" v-if="VM.config.planCode">
            <div class="block__title">{{ $t('Tariff') }}</div>
            <div class="block__value">
              {{ tariffTitle || $t('No Data') }}
              <a-icon type="swap" title="Switch tariff" @click="openModal('switch')" />
            </div>
          </div>
          <div class="block__column" v-if="VM.data.expiration">
            <div class="block__title">{{ $t("userService.next payment date") | capitalize }}</div>
            <div class="block__value">
              {{ VM.data.expiration }}
              <a-icon type="sync" :title="$t('renew')" @click="sendRenew" />
            </div>
          </div>
        </div>
      </div>

      <a-modal
        v-model="modal.switch"
        title="Switch tariff"
        :ok-button-props="{ props: { disabled: planCode === '' } }"
        :confirmLoading="isSwitchLoading"
        @ok="sendNewTariff"
      >
        <span style="margin-right: 16px">{{ $t("Select new tariff") }}:</span>
        <a-select style="width: 200px" v-model="planCode">
          <a-select-option v-for="(item, key) in tariffs" :key="key">
            {{ item.title }}
          </a-select-option>
        </a-select>
      </a-modal>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="setting" theme="filled" />
          {{ $t("cloud_system") | capitalize }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">CPU</div>
            <div class="block__value">
              {{ VM.resources.cpu }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Memory") }}</div>
            <div class="block__value">
              {{ (VM.resources.ram / 1024).toFixed(2) }} GB
            </div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="database" theme="filled" />
          {{ $t("cloud_Storage") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Type") }}</div>
            <div class="block__value">
              {{ VM.resources.drive_type }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Size") }}</div>
            <div class="block__value">
              {{ (VM.resources.drive_size / 1024).toFixed(2) }} GB
            </div>
          </div>
        </div>
      </div>

      <div
        class="Fcloud__info-block block"
        v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
      >
        <div class="Fcloud__block-header">
          <a-icon type="apartment" />
          {{ $t("Network") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              {{ $t("inbound") | capitalize }}
            </div>
            <div class="block__value">
              {{
                printWidthRange(chart1Data[chart1Data.length - 1].value)
              }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("outgoing") | capitalize }}
            </div>
            <div class="block__value">
              {{
                printWidthRange(chart2Data[chart2Data.length - 1].value)
              }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="Fcloud__info-block block"
        v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
      >
        <div class="Fcloud__block-header">
          <a-icon type="line-chart" />
          {{ $t("graphs") | capitalize }}
        </div>
        <div
          class="Fcloud__block-content Fcloud__block-content--charts"
        >
          <a-row type="flex" justify="space-around" style="width: 100%">
            <a-col>
              <GChart
                type="LineChart"
                :data="inbChartDataReady"
                :options="chartOption('inbound')"
              />
            </a-col>
            <a-col>
              <GChart
                type="LineChart"
                :data="outChartDataReady"
                :options="chartOption('outgoing')"
              />
            </a-col>
            <a-col>
              <GChart
                type="LineChart"
                :data="cpuChartDataReady"
                :options="chartOption('cpu')"
              />
            </a-col>
            <a-col>
              <GChart
                type="LineChart"
                :data="ramChartDataReady"
                :options="chartOption('ram')"
              />
            </a-col>
          </a-row>
        </div>
      </div>

      <a-row :gutter="[15, 15]" style="margin-top: 20px" v-if="VM.state">
        <a-col :span="24" :md="12">
          <div class="button">
            <a-button
              type="primary"
              shape="round"
              block
              size="large"
              @click="openModal('snapshot')"
            >
              {{ $t("Snapshots") }}
            </a-button>
            <a-modal
              v-model="snapshots.modal"
              :title="$t('Snapshots')"
              :footer="null"
            >
              <div
                style="display: flex; align-items: center; margin-bottom: 10px"
                v-for="(item, index) in VM.state.meta.snapshots"
                :key="item.name"
              >
                <a-col style="width: 100%">
                  <div style="display: flex; font-size: 16px">
                    <div style="margin-right: 30px; width: 30%">
                      {{ item.name }}
                    </div>
                    <div style="width: 70%">
                      {{ (item.ts * 1000) | dateFormat }}
                    </div>
                  </div>
                </a-col>
                <a-col style="margin-left: auto; display: flex">
                  <a-button
                    type="primary"
                    style="margin-right: 10px"
                    :loading="snapshots.addSnap.loading"
                    @click="revSnapshot(index)"
                  >
                    <a-icon type="caret-right" />
                  </a-button>
                  <a-button
                    type="danger"
                    :loading="snapshots.loading"
                    @click="deleteSnapshot(index)"
                  >
                    <a-icon type="close" />
                  </a-button>
                </a-col>
              </div>

              <div class="modal__buttons">
                <a-button
                  icon="plus"
                  type="primary"
                  shape="round"
                  size="large"
                  v-if="(
                    VM.config.addons &&
                    VM.config.addons.find((el) => el.includes('snapshot'))
                  )"
                  @click="openModal('createSnapshot')"
                >
                  {{ $t("Take snapshot") }}
                </a-button>
                <a-button
                  v-else
                  type="primary"
                  shape="round"
                  size="large"
                  :loading="actionLoading"
                  @click="sendAddingAddon('snapshot')"
                >
                  {{ $t("Add snapshot") }}
                </a-button>
              </div>
              <a-modal
                v-model="snapshots.addSnap.modal"
                :footer="null"
                :title="$t('Create snapshot')"
              >
                <p>{{ $t("Each snapshot exists for 24 hours and is then deleted.") }}</p>
                <p>{{ $t("Choose a name for the new snapshot:") }}</p>
                <a-input
                  ref="snapNameInput"
                  :placeholder="$t('Snapshot name')"
                  v-model="snapshots.addSnap.snapname"
                />
                <div class="modal__buttons">
                  <a-button
                    shape="round"
                    :style="{ 'margin-right': '10px' }"
                    @click="snapshots.addSnap.modal = false"
                  >
                    {{ $t("Cancel") }}
                  </a-button>
                  <a-button
                    icon="plus"
                    type="primary"
                    shape="round"
                    :disabled="snapshots.addSnap.snapname.length < 1"
                    :loading="snapshots.addSnap.loading"
                    @click="createSnapshot"
                  >
                    {{ $t("Take snapshot") }}
                  </a-button>
                </div>
              </a-modal>
            </a-modal>
          </div>
        </a-col>

        <a-col :span="24" :md="12">
          <div class="button">
            <a-button
              block
              type="primary"
              shape="round"
              size="large"
              :disabled="VM.state.state !== 'RUNNING'"
              @click="openVNC"
            >
              VNC
            </a-button>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script>
import notification from "@/mixins/notification";

const columns = [
  {
    title: "Name",
    key: "Name",
    dataIndex: "NAME",
  },
  {
    title: "Time",
    dataIndex: "TIME",
    key: "Time",
    scopedSlots: { customRender: "time" },
  },
  {
    title: "Actions",
    key: "Actions",
    scopedSlots: { customRender: "actions" },
  },
];
const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB"];

export default {
  name: 'openInstance',
  props: { VM: { type: Object, required: true } },
  mixins: [notification],
  data: () => ({
    chart1Data: [["Time", ""]],
    chart2Data: [["Time", ""]],
    chart3Data: [["Time", ""]],
    chart4Data: [["Time", ""]],
    chartHead: ["Timestamp"],
    chartOptions: {
      title: "network",
      curveType: "function",
      legend: "none",
      width: 300,
      height: 150,
      vAxis: {
        viewWindowMode: "explicit",
        viewWindow: { min: 0 },
      },
    },

    modal: {
      reboot: false,
      shutdown: false,
      recover: false,
      snapshot: false,
      switch: false
    },
    snapshots: {
      modal: false,
      loading: false,
      columns,
      data: [],
      loadingSnaps: [],
      addSnap: {
        modal: false,
        snapname: "Snapshot",
        loading: false,
      },
    },
    option: {
      reboot: 0,
      shutdown: 0,
      recover: 0
    },

    dates: [],
    planCode: "",
    actionLoading: false,
    isSwitchLoading: false,
  }),
  methods: {
    deployService() {
      this.actionLoading = true;
      this.$api.services
        .up(this.VM.uuidService)
        .then(() => {
          const opts = {
            message: `${this.$t('Done')}!`,
          };
          this.openNotificationWithIcon("success", opts);
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.actionLoading = false;
        });
    },
    printWidthRange(value) {
      let range = this.checkRange(value);
      let newVal = this.fromBytesTo(value, range);
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000;
      }
      return `${newVal || ''} ${range}`;
    },
    checkRange(val) {
      let count = 0;
      for (let i = 0; val > 1024; count++) {
        val = val / 1024;
      }
      return sizes[count];
    },
    fromBytesTo(val, newRange) {
      let count = sizes.indexOf(newRange);
      if (count == -1) {
        console.log("can't get such range");
        return;
      }
      while (count > 0) {
        val = val / 1024;
        count--;
      }
      return val;
    },
    chartOption(title) {
      const newOpt = JSON.parse(JSON.stringify(this.chartOptions));
      let range = "";
      let capitalized = "";
      if (title.toLowerCase() == "inbound") {
        range = this.checkRange(this.chart1Data[this.chart1Data.length - 1].value);
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1);
      } else if (title.toLowerCase() == "outgoing") {
        range = this.checkRange(this.chart2Data[this.chart2Data.length - 1].value);
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1);
      } else if (title.toLowerCase() == "cpu") {
        range = "%"
        capitalized = this.$t(title).toUpperCase();
      } else if (title.toLowerCase() == "ram") {
        range = this.checkRange(this.chart4Data[this.chart4Data.length - 1].value * 1048576);
        capitalized = this.$t(title).toUpperCase();
      }
      newOpt.title = `${capitalized} (${range})`;
      return newOpt;
    },
    createSnapshot() {
      // if (this.snapshots.data.lenght >= 3) {
      //   this.$error({
      //     title: this.$t("You can't have more than 3 snaps at the same time"),
      //     content: this.$t("remove or commit old ones to create new"),
      //   });
      // }

      const data = {
        uuid: this.VM.uuid,
        params: { snap_name: this.snapshots.addSnap.snapname },
        action: "snap_create",
      };

      this.snapshots.addSnap.loading = true;
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          this.VM.state.meta.snapshots = res?.meta.snapshots;
          this.openNotificationWithIcon("success", {
            message: this.$t("Create snapshot"),
          });
          this.snapshots.addSnap.modal = false;
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.snapshots.addSnap.loading = false;
        });
    },
    deleteSnapshot(index) {
      const data = {
        uuid: this.VM.uuid,
        params: { snap_id: +index },
        action: "snap_delete",
      };

      this.snapshots.loading = true;
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then(() => {
          delete this.VM.state.meta.snapshots[index];
          this.openNotificationWithIcon("success", {
            message: this.$t("Delete snapshot"),
          });
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.snapshots.loading = false;
        });
    },
    revSnapshot(index) {
      const data = {
        uuid: this.VM.uuid,
        params: { snap_id: +index },
        action: "snap_revert",
      };

      this.snapshots.addSnap.loading = true;
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then(() => {
          this.openNotificationWithIcon("success", {
            message: this.$t("Revert snapshot"),
          });
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.snapshots.addSnap.loading = false;
        });
    },
    openModal(name) {
      switch (name) {
        case "start":
          if (this.statusVM.start) return;
          break;
        case "shutdown":
          if (this.statusVM.shutdown) return;
          break;
        case "reboot":
          if (this.statusVM.reboot) return;
          break;
        case "delete":
          if (this.statusVM.delete) return;
          break;
        case "recover":
          if (this.statusVM.recover) return;
          this.actionLoading = true;
          this.$store.dispatch("nocloud/vms/actionVMInvoke", {
            uuid: this.VM.uuid,
            uuidService: this.VM.uuidService,
            action: 'backup_restore_points'
          })
            .then(({ meta }) => this.dates = meta.restorePoints)
            .finally(() => this.actionLoading = false);
          break;
        case "snapshot":
          this.snapshots.modal = true;
          break;
        case "createSnapshot":
          this.snapshots.addSnap.modal = true;
      }
      this.modal[name] = true;
    },
    sendRecover() {
      this.$confirm({
        title: this.$t("Do you want to download a backup?"),
        maskClosable: true,
        content: () => {
          return <div>{ this.$t("All unsaved progress will be lost, are you sure?") }</div>;
        },
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk: () => {
          this.sendAction("recover");
          this.modal.recover = false;
        },
        onCancel() {},
      });
    },
    sendRenew() {
      this.$confirm({
        title: this.$t("Do you want to renew server?"),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk: () => this.sendAction("manual_renew"),
        onCancel() {},
      });
    },
    sendNewTariff() {
      this.isSwitchLoading = true;
      this.sendAction("get_upgrade_price").then((res) => {
        const { withTax } = res.meta.result.order.prices;

        this.$confirm({
          title: this.$t("Do you want to switch tariff?"),
          content: () => (
            <div>{ `${this.$t("invoice_Price")}: ${withTax.value} NCU` }</div>
          ),
          okText: this.$t("Yes"),
          cancelText: this.$t("Cancel"),
          onOk: () => new Promise((resolve) => setTimeout(resolve, 1000)),
          onCancel() {},
        });
      })
      .finally(() => this.isSwitchLoading = false);
    },
    sendAddingAddon(action) {
      this.$confirm({
        title: this.$t(`Do you want to add an ${action}?`),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk: () => {
          const key = `${this.VM.config.duration} ${this.VM.config.planCode}`;
          const planCode = this.VM.billingPlan.products[key].meta.addons
            .find((addon) => addon.includes(action));

          this.actionLoading = true;
          this.$store.dispatch("nocloud/vms/actionVMInvoke", {
            uuid: this.VM.uuid,
            uuidService: this.VM.uuidService,
            action: 'add_addon',
            params: { planCode }
          })
            .then(() => {
              this.openNotificationWithIcon("success", { message: `Done!` });
            })
            .catch((err) => {
              console.error(err);
              this.openNotificationWithIcon("error", {
                message: `Error: ${err.response?.data?.message ?? "Unknown"}.`
              });
            })
            .finally(() => this.actionLoading = false);
        },
        onCancel() {},
      });
    },
    async sendAction(action) {
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action
      }

      if (action === "recover") {
        data.action = 'backup_restore';
        data.params = { type: 'full', restorePoint: this.option.recover };
      }
      if (action === "get_upgrade_price") {
        data.params = { newPlanCode: this.planCode };
      }

      return this.$store.dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          this.openNotificationWithIcon("success", { message: `Done!` });

          return res;
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        });
    },
    openVNC() {
      this.$store.dispatch('nocloud/vms/actionVMInvoke', {
        uuid: this.$route.params.uuid,
        action: 'start_vnc'
      })
				.then(({ meta }) => location.href = meta.url)
        .catch((err) => console.error(err));
    },
    fetchMonitoring() {
      if (!this.VM?.uuidService) return;
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: 'monitoring',
        params: { period: 'lastday' }
      };

      this.$store.dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          if (res.meta['net:rx'] !== undefined) {
            this.chart1Data = res.meta['net:rx'].values;
          }
          if (res.meta['net:tx'] !== undefined) {
            this.chart2Data = res.meta['net:tx'].values;
          }
          if (res.meta?.cpu !== undefined) {
            this.chart3Data = res.meta.cpu.values;
          }
          if (res.meta?.mem !== undefined) {
            this.chart4Data = res.meta.mem.values;
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', { message: this.$t(message) });
          console.error(err);
        });
    },
  },
  created() { this.fetchMonitoring() },
  computed: {
    baseURL() {
      return this.$store.getters['support/getURL'];
    },
    statusVM() {
      if (!this.VM) return;
      if (this.VM.state.state === 'PENDING') return {
        shutdown: true, reboot: true, start: true, recover: true
      }
      return {
        shutdown: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        reboot: this.VM.state.meta.state === 'BUILD' ||
          this.VM.state.state === 'STOPPED',
        start: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        recover: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED'
      };
    },

    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    dataSP() {
      return this.getSP.find((el) => el.uuid === this.VM.sp);
    },
    osName() {
      const type = this.VM.billingPlan.type.split(' ')[1];

      return this.VM.config.configuration[`${type}_os`];
    },
    locationTitle() {
      if (!this.VM?.config.configuration) return this.dataSP.title;
      const type = this.VM.billingPlan.type.split(' ')[1];
      const region = this.VM.config.configuration[`${type}_datacenter`];
      const locationItem = this.dataSP.locations.find((el) => el.extra.region === region);

      return locationItem?.title ?? this.$t('No Data');
    },
    tariffTitle() {
      const key = `${this.VM.config.duration} ${this.VM.config.planCode}`;

      return this.VM.billingPlan.products[key].title;
    },
    tariffs() {
      if (!this.VM?.billingPlan) return {};
      const tariffs = {};
      const { products } = this.VM.billingPlan;
      const productKey = `${this.VM.config.duration} ${this.VM.config.planCode}`;
      const a = Object.values(products[productKey].resources)
        .reduce((acc, curr) => +acc + +curr);

      Object.keys(products).forEach((key) => {
        const b = Object.values(products[key].resources)
          .reduce((acc, curr) => +acc + +curr);

        if (b > a && products[key].period === products[productKey].period) {
          tariffs[key] = products[key];
        }
      });

      return tariffs;
    },
    networking() {
      const { networking } = this.VM?.state?.meta;

      if (!networking) return { public: [], private: [] };
      const regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

      const publicIPs = networking.public?.filter((el) => !regexp.test(el));
      const privateIPs = networking.private?.filter((el) => !regexp.test(el));

      return { public: publicIPs ?? [], private: privateIPs ?? [] };
    },

    inbChartDataReady() {
      let data = this.chart1Data;
      if (data == undefined) {
        console.error("can't get chart1");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "bytes"],
          [0, 0],
        ];
      }
      let range = this.checkRange(data[data.length - 1].value);
      data = data.map((pair) => [
        new Date(pair.timestamp * 1000),
        this.fromBytesTo(parseInt(pair.value), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },
    outChartDataReady() {
      let data = this.chart2Data;
      if (data == undefined) {
        console.error("can't get chart2");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "bytes"],
          [0, 0],
        ];
      }
      let range = this.checkRange(data[data.length - 1].value);
      data = data.map((pair) => [
        new Date(pair.timestamp * 1000),
        this.fromBytesTo(parseInt(pair.value), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },
    cpuChartDataReady() {
      let data = this.chart3Data;
      if (data == undefined) {
        console.error("can't get chart3");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "%"],
          [0, 0],
        ];
      }
      data = data.map((pair) => [new Date(pair.timestamp * 1000), parseInt(pair.value)]);
      data.unshift([this.chartHead[0], 'usage']);
      return data;
    },
    ramChartDataReady() {
      let data = this.chart4Data;
      if (data == undefined) {
        console.error("can't get chart4");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "mb"],
          [0, 0],
        ];
      }
      let range = this.checkRange(data[data.length - 1].value * 1048576);
      data = data.map((pair) => [
        new Date(pair.timestamp * 1000),
        this.fromBytesTo(parseInt(pair.value * 1048576), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },
  },
  watch: {
    'VM.uuidService'() { this.fetchMonitoring() }
  }
}
</script>
