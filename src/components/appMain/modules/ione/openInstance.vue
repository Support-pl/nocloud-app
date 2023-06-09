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
        v-if="
          VM.state &&
          VM.state.meta.state !== 8 &&
          VM.state.meta.lcm_state !== 0
        "
        class="Fcloud__button"
        @click="openModal('shutdown')"
        :class="{
          disabled: statusVM.shutdown,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop"></div>
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Power off") }}</div>
        <a-modal
          v-model="modal.shutdown"
          :title="$t('cloud_Shutdown_modal')"
          @ok="handleOk('shutdown')"
        >
          <p>{{ $t("cloud_Shutdown_invite") }}</p>
          <a-radio-group
            v-model="option.shutdown"
            name="shutdownOption"
            :default-value="1"
          >
            <a-radio :value="0" :style="{ 'margin-bottom': '10px' }">
              <a-tag color="green" :style="{ margin: '0 2px 0 0' }">{{
                $t("cloud_Regular")
              }}</a-tag>
              {{ $t("cloud_Shutdown") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red" :style="{ margin: '0 2px 0 0' }">
                HARD
              </a-tag>
              {{ $t("cloud_Shutdown") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
      <div
        v-else
        class="Fcloud__button"
        @click="sendAction('resume')"
        :class="{
          disabled: statusVM && statusVM.start,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="caret-right" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Start") }}</div>
      </div>
      <div
        class="Fcloud__button"
        @click="openModal('reboot')"
        :class="{
          disabled: statusVM && statusVM.reboot,
          btn_disabled_wiggle: true,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="redo" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Reboot") }}</div>
        <a-modal
          v-model="modal.reboot"
          :title="$t('cloud_Reboot_modal')"
          @ok="handleOk('reboot')"
        >
          <p>{{ $t("cloud_Reboot_invite") }}</p>
          <a-radio-group
            v-model="option.reboot"
            name="rebootOption"
            :default-value="1"
          >
            <a-radio :value="0">
              <a-tag color="green" :style="{ 'margin-bottom': '10px' }">
                {{ $t("cloud_Regular") }}
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red"> HARD </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
      <div
        class="Fcloud__button"
        @click="openModal('recover')"
        :class="{
          disabled: statusVM && statusVM.recover,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="backward" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Recover") }}</div>
        <a-modal
          v-model="modal.recover"
          :title="$t('cloud_Recover_modal')"
          @ok="handleOk('recover')"
        >
          <p>{{ $t("cloud_Recover_invite_line1") }}</p>
          <p>{{ $t("cloud_Recover_invite_line2") }}</p>
          <p>{{ $t("cloud_Recover_invite_line3") }}</p>
          <p>{{ $t("cloud_Recover_invite") }}</p>
          <a-radio-group
            v-model="option.recover"
            name="recover"
            :default-value="1"
          >
            <a-radio :value="0">
              {{ $t("yesterday") }}
            </a-radio>
            <a-radio :value="1">
              {{ $t("today") }}
            </a-radio>
          </a-radio-group>
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
                  <tr
                    v-for="nic in VM.state &&
                    VM.state.meta.networking.public"
                    :key="nic"
                  >
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="block__value" v-if="dataSP" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr
                    v-for="nic in VM.state &&
                    VM.state.meta.networking.private"
                    :key="nic"
                  >
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
              {{ dataSP.locations[0].title }}
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
              {{ OSName || $t('No Data') }}
            </div>
          </div>
          <div class="block__column" v-if="VM.product">
            <div class="block__title">{{ $t('Product') }}</div>
            <div class="block__value">
              {{ VM.product.replace('_', ' ').toUpperCase() || $t('No Data') }}
            </div>
          </div>
          <div class="block__column" v-if="VM.data.last_monitoring">
            <div class="block__title">{{ $t("userService.next payment date") | capitalize }}</div>
            <div class="block__value">
              {{ new Intl.DateTimeFormat().format(VM.data.last_monitoring * 1000) }}
              <a-icon type="sync" title="Renew" @click="handleOk('renew')" />
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="credit-card" />
          {{ $t("prices") | capitalize }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <div class="block__column block__column_table">
            <div class="block__title">{{ $t('tariff') | capitalize }}</div>
          </div>
          <div class="block__column block__column_table block__column_price">
            <div class="block__title">
              {{ VM.product.replace('_', ' ').toUpperCase() || $t('No Data') }}:
            </div>
            <div class="block__value">
              {{ +tariffPrice.toFixed(2) }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table">
            <div class="block__title">{{ $t('Addons') }}</div>
          </div>
          <div
            class="block__column block__column_table block__column_price"
            v-for="(price, addon) in addonsPrice"
          >
            <div class="block__title">{{ addon }}:</div>
            <div class="block__value">
              {{ +price.toFixed(2) }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table block__column_total">
            <div class="block__title">{{ $t('Total') }}:</div>
            <div class="block__value">{{ +fullPrice.toFixed(2) }} {{ currency.code }}</div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="setting" theme="filled" />
          {{ $t("cloud_system") | capitalize }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">CPU</div>
            <div class="block__value">
              {{ VM.resources && VM.resources.cpu }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Memory") }}</div>
            <div class="block__value">
              {{ VM.resources && VM.resources.ram / 1024 }} GB
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
              {{ VM.resources && VM.resources.drive_type }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Size") }}</div>
            <div class="block__value">
              {{ mbToGb(VM.resources && VM.resources.drive_size) }} GB
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
                printWidthRange(chart1Data[chart1Data.length - 1][1])
              }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("outgoing") | capitalize }}
            </div>
            <div class="block__value">
              {{
                printWidthRange(chart2Data[chart2Data.length - 1][1])
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
                  @click="openModal('createSnapshot')"
                  >{{ $t("Take snapshot") }}</a-button
                >
              </div>
              <a-modal
                v-model="snapshots.addSnap.modal"
                :footer="null"
                :title="$t('Create snapshot')"
              >
                <p>{{ $t("You can only have 3 snapshots at a time.") }}</p>
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
                    >{{ $t("Cancel") }}</a-button
                  >
                  <a-button
                    icon="plus"
                    type="primary"
                    shape="round"
                    :disabled="snapshots.addSnap.snapname.length < 1"
                    :loading="snapshots.addSnap.loading"
                    @click="createSnapshot()"
                    >{{ $t("Take snapshot") }}</a-button
                  >
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
              :disabled="!(VM.state.meta.state === 3 || VM.state.meta.lcm_state === 3)"
            >
              <router-link :to="{ path: `${$route.params.uuid}/vnc`, }">
                VNC
              </router-link>
            </a-button>
          </div>
        </a-col>
      </a-row>
    </div>

    <add-funds
      v-if="addfunds.visible"
      :sum="addfunds.amount"
      :modalVisible="addfunds.visible"
      :hideModal="() => addfunds.visible = false"
    />
  </div>
</template>

<script>
import notification from "@/mixins/notification";
import addFunds from '@/components/balance/addFunds.vue';

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
  components: { addFunds },
  mixins: [notification],
  props: { VM: { type: Object, required: true } },
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
      recover: 0,
    },
    actualAction: "",
    actionLoading: false,
    selectedSP: "",
    deployLoading: false,
    addfunds: { visible: false, amount: 0 },
  }),
  methods: {
    deployService() {
      this.actionLoading = true;
      this.$api.services
        .up(this.VM.uuidService)
        .then(() => {
          const opts = {
            message: `Done!`,
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
    mbToGb(mb) {
      return (mb / 1024).toFixed(1);
    },
    handleOk(from) {
      this.VM.state.meta.state = 0;

      switch (from) {
        case "reboot":
          this.sendAction("reboot");
          this.modal.reboot = false;
          break;
        case "shutdown":
          if (this.option.shutdown) {
            this.sendAction("poweroffHard");
          } else {
            this.sendAction("poweroff");
          }
          this.modal.shutdown = false;
          break;
        case "recover":
          this.$confirm({
            title: this.$t("Do you want to download a backup?"),
            maskClosable: true,
            content: () => {
              return <div>{ this.$t("All unsaved progress will be lost, are you sure?") }</div>;
            },
            okText: this.$t("Yes"),
            cancelText: this.$t("Cancel"),
            onOk: () => {
              if (this.option.recover) {
                this.sendAction("recoverToday");
              } else {
                this.sendAction("recoverYesterday");
              }
              this.modal.recover = false;
            },
            onCancel() {},
          });
          break;
        case "renew":
          if (this.checkBalance()) this.sendRenew();
          break;
      }
    },
    checkBalance() {
      const sum = this.VM.billingPlan?.products[this.VM.product]?.price ?? 0;

      if (this.user.balance < parseFloat(sum)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance'),
          content: () => (
            <div>{ this.$t('Click OK to replenish the account with the missing amount') }</div>
          ),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(sum) - this.user.balance);
            this.addfunds.visible = true;
          }
        });
        return false;
      }
      return true;
    },
    printWidthRange(value) {
      let range = this.checkRange(value);
      let newVal = this.fromBytesTo(value, range);
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000;
      }
      return `${newVal} ${range}`;
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
        action: "snapcreate",
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
        action: "snapdelete",
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
        action: "snaprevert",
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
          break;
        case "snapshot":
          this.snapshots.modal = true;
          break;
        case "createSnapshot":
          this.snapshots.addSnap.modal = true;
      }
      this.modal[name] = true;
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
        range = this.checkRange(this.chart1Data[this.chart1Data.length - 1][1]);
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1);
      } else if (title.toLowerCase() == "outgoing") {
        range = this.checkRange(this.chart2Data[this.chart2Data.length - 1][1]);
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1);
      } else if (title.toLowerCase() == "cpu") {
        range = "%"
        capitalized = this.$t(title).toUpperCase();
      } else if (title.toLowerCase() == "ram") {
        range = this.checkRange(this.chart4Data[this.chart4Data.length - 1][1]);
        capitalized = this.$t(title).toUpperCase();
      }
      newOpt.title = `${capitalized} (${range})`;
      return newOpt;
    },
    sendRenew() {
      const { period } = this.VM.billingPlan.products[this.VM.product];
      const currentPeriod = this.date(this.VM.data.last_monitoring);
      const newPeriod = this.date(this.VM.data.last_monitoring + +period);

      this.$confirm({
        title: this.$t("Do you want to renew server?"),
        content: () => (
          <div>
            <div style="font-weight: 700">{ `${this.VM.title}` }</div>
            <div>
              { `${this.$t("from")} ` }
              <span style="font-style: italic">{ `${currentPeriod}` }</span>
            </div>
            <div>
              { `${this.$t("to")} ` }
              <span style="font-style: italic">{ `${newPeriod}` }</span>
            </div>

            <div style="margin-top: 10px">
              <span style="font-weight: 700">{ this.$t('Tariff price') }: </span>
              { this.tariffPrice } { this.currency.code }
              <div>
                <span style="font-weight: 700">{ this.$t('Addons prices') }:</span>
                <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
                  { ...Object.entries(this.addonsPrice).map(([key, value]) =>
                    <li>{ key }: { value } { this.currency.code }</li>
                  ) }
                </ul>
              </div>

              <div>
                <span style="font-weight: 700">{ this.$t('Total') }: </span>
                { this.fullPrice } { this.currency.code }
              </div>
            </div>
          </div>
        ),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        okButtonProps: {
          props: { disabled: (this.VM.data.blocked) },
        },
        onOk: () => this.sendAction("manual_renew"),
        onCancel() {},
      });
    },
    async sendAction(action) {
      const hard = this.option.reboot || action.includes('Hard');
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: action.replace('Hard', ''),
        params: (hard) ? { hard: true } : {},
      }

      if (action === 'recoverYesterday' || action === 'recoverToday') {
        action = action.replace('recover', '');
        this.$api.get(this.baseURL, { params: {
          run: 'create_ticket',
          subject: `Recover VM - ${this.VM.title}`,
          message: `1. ID: ${this.VM.uuid}\n2. Date: ${action}`,
          department: 1,
        }})
          .then((resp) => {
            if (resp.result == "success") {
              this.$message.success(this.$t("Ticket created successfully"));
            } else {
              throw resp;
            }
          })
          .catch((err) => {
            const message = err.response?.data?.message ?? err.message ?? err;

            this.openNotificationWithIcon('error', {
              message: this.$t(message)
            });
            console.error(err);
          });
        return;
      }
      return this.$store.dispatch("nocloud/vms/actionVMInvoke", data)
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
        });
    },
    fetchMonitoring() {
      if (!this.VM?.uuidService) return;
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: 'monitoring',
      };

      this.$store.dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          if (res.meta?.NETRX !== undefined) {
            this.chart1Data = res.meta.NETRX;
          }
          if (res.meta?.NETTX !== undefined) {
            this.chart2Data = res.meta.NETTX;
          }
          if (res.meta?.CPU !== undefined) {
            this.chart3Data = res.meta.CPU;
          }
          if (res.meta?.MEMORY !== undefined) {
            this.chart4Data = res.meta.MEMORY;
          }
        })
        .catch((err) => {
          console.error(err);
          this.openNotificationWithIcon("error", {
            message: `Error: ${err.response?.data?.message ?? "Unknown"}.`
          });
        });
    },
    date(timestamp) {
      if (timestamp < 1) return '-';

      const date = new Date(timestamp * 1000);
      const time =  date.toTimeString().split(' ')[0];

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${day}.${month}.${year} ${time}`;
    }
  },
  created() { this.fetchMonitoring() },
  computed: {
    baseURL() {
      return this.$store.getters['support/getURL'];
    },
    statusVM() {
      if (!this.VM) return;
      if (this.VM.state.meta.state === 1) return {
        start: true, shutdown: true, reboot: true, recover: true
      }
      return {
        shutdown:
          (this.VM.state.meta.lcm_state == 18 &&
            this.VM.state.meta.state == 3) ||
          (this.VM.state.meta.lcm_state == 20 &&
            this.VM.state.meta.state == 3),
        reboot:
          (this.VM.state.meta.lcm_state == 18 &&
            this.VM.state.meta.state == 3) ||
          (this.VM.state.meta.lcm_state == 20 &&
            this.VM.state.meta.state == 3) ||
          (this.VM.state.meta.lcm_state == 0 &&
            this.VM.state.meta.state == 8),
        start:
          (this.VM.state.meta.lcm_state == 18 &&
            this.VM.state.meta.state == 3) ||
          (this.VM.state.meta.lcm_state == 20 &&
            this.VM.state.meta.state == 3),
        recover:
          (this.VM.state.meta.lcm_state == 18 &&
            this.VM.state.meta.state == 3) ||
          (this.VM.state.meta.lcm_state == 20 &&
            this.VM.state.meta.state == 3),
      };
    },

    tariffPrice() {
      const key = this.VM.product;

      return this.VM.billingPlan.products[key].price;
    },
    addonsPrice() {
      return this.VM.billingPlan.resources.reduce((prev, curr) => {
        if (curr.key === `drive_${this.VM.resources.drive_type.toLowerCase()}`) {
          const key = this.$t('Drive');

          return {
            ...prev,
            [key]: curr.price * this.VM.resources.drive_size / 1024
          };
        } else if (curr.key === "ram") {
          const key = this.$t('ram');

          return {
            ...prev,
            [key]: curr.price * this.VM.resources.ram / 1024
          };
        } else if (this.VM.resources[curr.key]) {
          const key = this.$t(curr.key.replace('_', ' '));

          return {
            ...prev,
            [key]: curr.price * this.VM.resources[curr.key]
          };
        }
        return prev;
      }, {});
    },
    fullPrice() {
      return this.tariffPrice + Object.values(this.addonsPrice)
        .reduce((sum, curr) => sum + curr);
    },
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      return { code: this.user.currency ?? defaultCurrency };
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
      let range = this.checkRange(data[data.length - 1][1]);
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range),
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
      let range = this.checkRange(data[data.length - 1][1]);
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range),
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
      data = data.map((pair) => [new Date(pair[0] * 1000), parseInt(pair[1])]);
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
      let range = this.checkRange(data[data.length - 1][1]);
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },

    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    dataSP() {
      return this.getSP.find((el) => el.uuid == this.VM.sp);
    },
    OSName() {
      const i = this.VM?.config?.template_id;

      return this.dataSP?.publicData.templates[i]?.name;
    }
  },
  watch: {
    'VM.uuidService'() { this.fetchMonitoring() }
  }
}
</script>

<style scoped>
.block-content_table {
  position: relative;
  display: grid;
  padding: 10px 15px;
}

.block-content_table::before {
  content: '';
  position: absolute;
  bottom: 40px;
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
  background: var(--gray);
}

.block-content_table::after {
  content: "";
  position: absolute;
  top: 35px;
  left: calc(50% - 26.8vw);
  height: 1px;
  width: calc(100% - 44vw);
  background: var(--gray);
}

.block__column_table {
  flex-direction: row;
  justify-content: start;
  gap: 7px;
}

.block__column_price {
  grid-column: 2 / 3;
  justify-content: end;
  overflow: hidden;
}

.block__column_price .block__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.block__column_price .block__value {
  white-space: nowrap;
}

.block__column_total {
  grid-column: 1 / 3;
  justify-content: end;
  margin-top: 5px;
}

@media (max-width: 575px) {
  .block-content_table {
    justify-content: initial;
  }
}
</style>
