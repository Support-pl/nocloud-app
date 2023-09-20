<template>
  <div class="Fcloud">
    <slot name="header" />
    <div class="Fcloud__buttons" v-if="VM.state">
      <div class="Fcloud__button" @click="openActions">
        <div class="Fcloud__BTN-icon">
          <a-icon :type="(actionLoading) ? 'loading' : 'deployment-unit'" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t('open') | capitalize }}
        </div>
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
            <div class="block__title">{{ $t('tariff') | capitalize }}</div>
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
          <a-icon type="credit-card" />
          {{ $t("prices") | capitalize }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <div class="block__column block__column_table">
            <div class="block__title">{{ $t('tariff') | capitalize }}</div>
          </div>
          <div class="block__column block__column_table block__column_price">
            <div class="block__title">
              {{ tariffTitle || $t('No Data') }}:
            </div>
            <div class="block__value">
              {{ +tariffPrice.toFixed(2) }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table">
            <div class="block__title">{{ $t('Addons') }}</div>
          </div>
          <template v-if="Object.keys(addonsPrice).length > 0">
            <div
              class="block__column block__column_table block__column_price"
              v-for="(price, addon) in addonsPrice"
            >
              <div class="block__title">{{ addon }}:</div>
              <div class="block__value">
                {{ +price.toFixed(2) }} {{ currency.code }}
              </div>
            </div>
          </template>
          <div v-else class="block__column" style="align-items: flex-end">
            <div class="block__value">0 {{ currency.code }}</div>
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
              {{ VM.resources.cpu ?? $t('No Data') }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Memory") }}</div>
            <div class="block__value">
              {{ VM.resources.ram }} GB
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

      <a-row :gutter="[15, 15]" style="margin-top: 20px" v-if="VM.state && false">
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

<script lang="jsx">
import { defineComponent } from "vue";
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

export default defineComponent({
  name: 'openInstance',
  props: { VM: { type: Object, required: true } },
  mixins: [notification],
  data: () => ({
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
    async openActions() {
      if (this.actionLoading) return;
      this.actionLoading = true;

      const response = await fetch('http://geoplugin.net/json.gp');
      const { geoplugin_request: ip } = await response.json();

      this.$store.dispatch('nocloud/vms/actionVMInvoke', {
        uuid: this.VM.uuid, action: 'ipmi', params: { ip }
      })
        .then(({ result, meta }) => {
          if (result) location.assign(meta.url);
          else {
            this.openNotificationWithIcon("success", {
              message: `${this.$t(meta.message)}`
            });

            setTimeout(this.openActions, 30 * 1000);
          }
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };

          if (err.response?.status >= 500) {
            opts.message = `Error: ${this.$t('Failed to load data')}`;
          }
          this.openNotificationWithIcon("error", opts);
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
        content: this.$t("All unsaved progress will be lost, are you sure?"),
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
      const key = `${this.VM.config.duration} ${this.VM.config.planCode}`;
      const { period } = this.VM.billingPlan.products[key];
      const currentPeriod = this.VM.data.expiration;
      const newPeriod = this.date(this.VM.data.expiration, +period);

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
              { Object.keys(this.addonsPrice).length > 0 &&
                <div>
                  <span style="font-weight: 700">{ this.$t('Addons prices') }:</span>
                  <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
                    { ...Object.entries(this.addonsPrice).map(([key, value]) =>
                      <li>{ key }: { value } { this.currency.code }</li>
                    ) }
                  </ul>
                </div>
              }

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
    sendNewTariff() {
      this.isSwitchLoading = true;
      this.sendAction("get_upgrade_price").then((res) => {
        const { withTax } = res.meta.result.order.prices;

        this.$confirm({
          title: this.$t("Do you want to switch tariff?"),
          content: `${this.$t("invoice_Price")}: ${withTax.value} NCU`,
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
              const opts = {
                message: `Error: ${err.response?.data?.message ?? "Unknown"}.`
              };

              if (err.response?.status >= 500) {
                opts.message = `Error: ${this.$t('Failed to load data')}`;
              }
              this.openNotificationWithIcon("error", opts);
              console.error(err);
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

          if (err.response?.status >= 500) {
            opts.message = `Error: ${this.$t('Failed to load data')}`;
          }
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
    date(string, timestamp) {
      if (timestamp < 1) return '-';

      const stringDate = new Date(string).getTime();
      const date = new Date(timestamp * 1000 + stringDate);

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${year}-${month}-${day}`;
    }
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    baseURL() {
      return this.$store.getters['support/getURL'];
    },
    statusVM() {
      if (!this.VM) return;
      if (this.VM.state.state === 'PENDING' || this.VM.data.suspended_manually) {
        return { shutdown: true, reboot: true, start: true, recover: true };
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
    tariffPrice() {
      const key = `${this.VM.config.duration} ${this.VM.config.planCode}`;

      return this.VM.billingPlan.products[key].price;
    },
    addonsPrice() {
      return this.VM.config.addons?.reduce((res, id) => {
        const { price } = this.VM.billingPlan.resources.find(
          ({ key }) => key === `${this.VM.config.duration} ${this.VM.config.planCode} ${id}`
        ) ?? {};
        let key = '';

        if (!id) return res;
        if (id.includes('ram')) key = this.$t('ram');
        if (id.includes('raid')) key = this.$t('Drive');
        if (id.includes('vrack')) key = this.$t('vrack');
        if (id.includes('bandwidth')) key = this.$t('traffic');

        return { ...res, [key]: +price || 0 };
      }, {});
    },
    fullPrice() {
      return this.tariffPrice + Object.values(this.addonsPrice)
        .reduce((sum, curr) => sum + curr, 0);
    },
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      return { code: this.user.currency_code ?? defaultCurrency };
    },

    tariffs() {
      if (!this.VM?.billingPlan) return {};
      const tariffs = {};
      const { products } = this.VM.billingPlan;
      const productKey = `${this.VM.config.duration} ${this.VM.config.planCode}`;
      const a = Object.values(products[productKey].resources)
        .reduce((acc, curr) => +acc + +curr, 0);

      Object.keys(products).forEach((key) => {
        const b = Object.values(products[key].resources)
          .reduce((acc, curr) => +acc + +curr, 0);

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
  }
})
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
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
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
