<template>
  <div class="Fcloud">
    <slot name="header" />
    <div v-if="VM.state" class="Fcloud__buttons">
      <div
        class="Fcloud__button"
        :class="{ disabled: actionLoading }"
        @click="openActions"
      >
        <div class="Fcloud__BTN-icon">
          <loading-icon v-if="actionLoading" />
          <deployment-icon v-else />
        </div>
        <div class="Fcloud__BTN-title">
          {{ capitalize($t("open")) }}
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
        v-if="VM.state && VM.state.meta.networking"
        class="Fcloud__info-block block"
      >
        <div class="Fcloud__block-header"><flag-icon /> IP</div>
        <div class="Fcloud__block-content">
          <div class="block__column" style="flex-direction: row">
            <div v-if="dataSP" class="block__value" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in networking.public" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="dataSP" class="block__value" style="font-size: 18px">
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
          <env-icon /> {{ $t("Location") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div v-if="dataSP" class="block__value" style="font-size: 18px">
              {{ locationTitle }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <info-icon /> {{ capitalize($t("info")) }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">OS</div>
            <div class="block__value">
              {{ osName || $t("No Data") }}
            </div>
          </div>

          <div v-if="VM.config.planCode" class="block__column">
            <div class="block__title">
              {{ capitalize($t("tariff")) }}
            </div>
            <div class="block__value">
              {{ tariffTitle || $t("No Data") }}
              <swap-icon title="Switch tariff" @click="openModal('switch')" />
            </div>
          </div>

          <div v-if="VM.data.expiration" class="block__column">
            <div class="block__title">
              {{ capitalize($t("userService.next payment date")) }}
            </div>
            <div class="block__value">
              {{ toDate(VM.data.expiration, ".", false) }}
              <sync-icon title="Renew" @click="isVisible = !isVisible" />
            </div>
          </div>

          <div class="block__column">
            <div class="block__title">
              {{ capitalize($t("userService.auto renew")) }}
            </div>
            <div class="block__value">
              <a-switch
                :loading="isUpdateAutoRenewLoading"
                :checked="VM.meta?.autoRenew"
                @update:checked="updateInstanceAutoRenew"
              >
                <template #checkedChildren>
                  {{ $t("enabled") }}
                </template>
                <template #unCheckedChildren>
                  {{ $t("disabled") }}
                </template>
              </a-switch>
            </div>
          </div>
        </div>
      </div>

      <a-modal
        v-model:open="modal.switch"
        title="Switch tariff"
        :ok-button-props="{ props: { disabled: planCode === '' } }"
        :confirm-loading="isSwitchLoading"
        @ok="sendNewTariff"
      >
        <span style="margin-right: 16px">{{ $t("Select new tariff") }}:</span>
        <a-select v-model:value="planCode" style="width: 200px">
          <a-select-option v-for="(item, key) in tariffs" :key="key">
            {{ item.title }}
          </a-select-option>
        </a-select>
      </a-modal>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <card-icon /> {{ capitalize($t("prices")) }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <div class="block__column block__column_table">
            <div class="block__title">
              {{ capitalize($t("tariff")) }}
            </div>
          </div>
          <div class="block__column block__column_table block__column_price">
            <div class="block__title">{{ tariffTitle || $t("No Data") }}:</div>
            <div class="block__value">
              {{ +tariffPrice.toFixed(2) }} {{ currency.title }}
            </div>
          </div>

          <div class="block__column block__column_table">
            <div class="block__title">
              {{ $t("Addons") }}
            </div>
          </div>
          <template v-if="Object.keys(addonsPrice).length > 0">
            <div
              v-for="(price, addon) in addonsPrice"
              :key="addon"
              class="block__column block__column_table block__column_price"
            >
              <div class="block__title">{{ addon }}:</div>
              <div class="block__value">
                {{ +price.toFixed(2) }} {{ currency.title }}
              </div>
            </div>
          </template>
          <div v-else class="block__column" style="align-items: flex-end">
            <div class="block__value">0 {{ currency.title }}</div>
          </div>

          <div class="block__column block__column_table block__column_total">
            <div class="block__title">{{ $t("Total") }}:</div>
            <div class="block__value">
              {{ +fullPrice.toFixed(2) }} {{ currency.title }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <setting-icon /> {{ capitalize($t("cloud_system")) }}
          {{ capitalize($t("cloud_system")) }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">CPU</div>
            <div class="block__value">
              {{ VM.resources.cpu ?? $t("No Data") }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Memory") }}
            </div>
            <div class="block__value">{{ VM.resources.ram }} GB</div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <database-icon /> {{ $t("cloud_Storage") }}
          {{ $t("cloud_Storage") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Type") }}
            </div>
            <div class="block__value">
              {{ VM.resources.drive_type }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Size") }}
            </div>
            <div class="block__value">
              {{ (VM.resources.drive_size / 1024).toFixed(2) }} GB
            </div>
          </div>
        </div>
      </div>

      <a-row
        v-if="VM.state && false"
        :gutter="[15, 15]"
        style="margin-top: 20px"
      >
        <a-col :span="24" :md="12">
          <a-button
            type="primary"
            shape="round"
            block
            size="large"
            :disabled="VM.data.lock"
            @click="openModal('snapshot')"
          >
            {{ $t("Snapshots") }}
          </a-button>
          <a-modal
            v-model:open="snapshots.modal"
            :title="$t('Snapshots')"
            :footer="null"
          >
            <div
              v-for="(item, index) in VM.state.meta.snapshots"
              :key="item.name"
              style="display: flex; align-items: center; margin-bottom: 10px"
            >
              <a-col style="width: 100%">
                <div style="display: flex; font-size: 16px">
                  <div style="margin-right: 30px; width: 30%">
                    {{ item.name }}
                  </div>
                  <div style="width: 70%">
                    {{ dateFormat(item.ts * 1000) }}
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
                  <caret-right-icon />
                </a-button>
                <a-button
                  danger
                  :loading="snapshots.loading"
                  @click="deleteSnapshot(index)"
                >
                  <close-icon />
                </a-button>
              </a-col>
            </div>

            <div class="modal__buttons">
              <a-button
                v-if="
                  VM.config.addons &&
                  VM.config.addons.find((el) => el.includes('snapshot'))
                "
                type="primary"
                shape="round"
                size="large"
                @click="openModal('createSnapshot')"
              >
                + {{ $t("Take snapshot") }}
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
              v-model:open="snapshots.addSnap.modal"
              :footer="null"
              :title="$t('Create snapshot')"
            >
              <p>
                {{
                  $t("Each snapshot exists for 24 hours and is then deleted.")
                }}
              </p>
              <p>{{ $t("Choose a name for the new snapshot:") }}</p>
              <a-input
                ref="snapNameInput"
                v-model:value="snapshots.addSnap.snapname"
                :placeholder="$t('Snapshot name')"
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
                  type="primary"
                  shape="round"
                  :disabled="snapshots.addSnap.snapname.length < 1"
                  :loading="snapshots.addSnap.loading"
                  @click="createSnapshot"
                >
                  + {{ $t("Take snapshot") }}
                </a-button>
              </div>
            </a-modal>
          </a-modal>
        </a-col>

        <a-col :span="24" :md="12">
          <a-button
            block
            type="primary"
            shape="round"
            size="large"
            :disabled="VM.state.state !== 'RUNNING' || VM.data.lock"
            @click="openVNC"
          >
            VNC
          </a-button>
        </a-col>
      </a-row>
    </div>
    <renewal-modal v-bind="renewalProps" v-model:visible="isVisible" />
  </div>
</template>

<script lang="jsx">
import { defineAsyncComponent, defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { useCurrency, useNotification } from "@/hooks/utils";
import { toDate } from "@/functions.js";

import { useSpStore } from "@/stores/sp.js";
import { useAuthStore } from "@/stores/auth.js";
import { useInstancesStore } from "@/stores/instances.js";

import renewalModal from "@/components/ui/renewalModal.vue";

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);
const deploymentIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DeploymentUnitOutlined")
);
const flagIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FlagFilled")
);
const envIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EnvironmentOutlined")
);
const infoIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/InfoCircleOutlined")
);

const swapIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SwapOutlined")
);
const syncIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SyncOutlined")
);
const cardIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CreditCardOutlined")
);

const settingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SettingFilled")
);
const databaseIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DatabaseFilled")
);
const caretRightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CaretRightOutlined")
);
const closeIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseOutlined")
);

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
  name: "OpenInstance",
  components: {
    renewalModal,
    loadingIcon,
    deploymentIcon,
    flagIcon,
    envIcon,
    infoIcon,
    swapIcon,
    syncIcon,
    cardIcon,
    settingIcon,
    databaseIcon,
    caretRightIcon,
    closeIcon,
  },
  props: {
    VM: { type: Object, required: true },
  },
  setup() {
    const { currency } = useCurrency();
    const { openNotification } = useNotification();

    return { currency, openNotification };
  },
  data: () => ({
    isUpdateAutoRenewLoading: false,
    modal: {
      reboot: false,
      shutdown: false,
      recover: false,
      snapshot: false,
      switch: false,
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

    dates: [],
    planCode: "",
    actionLoading: false,
    isSwitchLoading: false,
    isVisible: false,
  }),
  computed: {
    ...mapState(useSpStore, ["servicesProviders"]),
    ...mapState(useAuthStore, ["userdata", "baseURL"]),
    ...mapState(useInstancesStore, ["services"]),
    statusVM() {
      if (!this.VM) return;
      const isPending = ["PENDING", "OPERATION"].includes(this.VM.state.state);
      const isSuspended =
        this.VM.state.state === "SUSPENDED" || this.VM.data.suspended_manually;

      if (isPending || isSuspended || this.VM.data.lock) {
        return { shutdown: true, reboot: true, start: true, recover: true };
      }

      return {
        shutdown:
          this.VM.state.state !== "RUNNING" &&
          this.VM.state.state !== "STOPPED",
        reboot:
          this.VM.state.meta.state === "BUILD" ||
          this.VM.state.state === "STOPPED",
        start:
          this.VM.state.state !== "RUNNING" &&
          this.VM.state.state !== "STOPPED",
        recover:
          this.VM.state.state !== "RUNNING" &&
          this.VM.state.state !== "STOPPED",
      };
    },

    dataSP() {
      return this.servicesProviders.find((el) => el.uuid === this.VM.sp);
    },
    osName() {
      const type = this.VM.billingPlan.type.split(" ")[1];

      return this.VM.config.configuration[`${type}_os`];
    },
    locationTitle() {
      if (!this.VM?.config.configuration) return this.dataSP.title;
      const type = this.VM.billingPlan.type.split(" ")[1];
      const region = this.VM.config.configuration[`${type}_datacenter`];
      const locationItem = this.dataSP.locations.find(
        (el) => el.extra.region === region
      );

      return locationItem?.title ?? this.$t("No Data");
    },
    fullProduct() {
      const key = this.VM.product;
      return this.VM.billingPlan.products[key];
    },
    tariffTitle() {
      return this.fullProduct?.title;
    },
    tariffPrice() {
      return this.fullProduct?.price ?? 0;
    },
    addonsPrice() {
      return (this.VM.addons || []).reduce((acc, uuid) => {
        const addon = this.cachedAddons[uuid];
        if (addon) {
          const price = addon.periods[this.fullProduct?.period] ?? 0;
          acc[addon.title] = price;
        }
        return acc;
      }, {});
    },
    fullPrice() {
      return (
        this.tariffPrice +
        Object.values(this.addonsPrice).reduce((sum, curr) => sum + curr, 0)
      );
    },
    renewalProps() {
      const { period } = this.VM.billingPlan.products[this.VM.product];
      const currentPeriod = this.toDate(this.VM.data.next_payment_date);
      const newPeriod = this.toDate(this.VM.data.next_payment_date + +period);

      return {
        service: this.VM,
        currentPeriod,
        newPeriod,
        price: this.tariffPrice,
        addonsPrice: this.addonsPrice,
        currentAutoRenew: this.VM.config.auto_renew,
        blocked: this.VM.data.blocked,
      };
    },

    tariffs() {
      if (!this.VM?.billingPlan) return {};
      const tariffs = {};
      const { products } = this.VM.billingPlan;
      const productKey = this.VM.product;
      const a = Object.values(products[productKey].resources).reduce(
        (acc, curr) => +acc + +curr,
        0
      );

      Object.keys(products).forEach((key) => {
        const b = Object.values(products[key].resources).reduce(
          (acc, curr) => +acc + +curr,
          0
        );

        if (b > a && products[key].period === products[productKey].period) {
          tariffs[key] = products[key];
        }
      });

      return tariffs;
    },
    networking() {
      const { networking } = this.VM?.state?.meta;

      if (!networking) return { public: [], private: [] };
      const regexp =
        /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

      const publicIPs = networking.public?.filter((el) => !regexp.test(el));
      const privateIPs = networking.private?.filter((el) => !regexp.test(el));

      return { public: publicIPs ?? [], private: privateIPs ?? [] };
    },
  },
  methods: {
    ...mapActions(useInstancesStore, [
      "invokeAction",
      "updateService",
      "updateInstance",
    ]),
    toDate,
    async openActions() {
      this.actionLoading = true;

      const response = await fetch("https://ipinfo.io/ip");
      const ip = await response.text();

      this.invokeAction({
        uuid: this.VM.uuid,
        action: "ipmi",
        params: { ip },
      })
        .then(({ result, meta }) => {
          if (result) location.assign(meta.url);
          else {
            this.openNotification("success", {
              message: `${this.$t(meta.message)}`,
            });

            setTimeout(this.openActions, 20_1000);
          }
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };

          if (err.response?.status >= 500) {
            opts.message = `Error: ${this.$t("Failed to load data")}`;
          }
          this.openNotification("error", opts);
          this.actionLoading = false;
        });
    },
    printWidthRange(value) {
      const range = this.checkRange(value);
      let newVal = this.fromBytesTo(value, range);
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000;
      }
      return `${newVal || ""} ${range}`;
    },
    checkRange(val) {
      let count = 0;
      for (; val > 1024; count++) {
        val = val / 1024;
      }
      return sizes[count];
    },
    fromBytesTo(val, newRange) {
      let count = sizes.indexOf(newRange);
      if (count === -1) {
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
      this.invokeAction(data)
        .then((res) => {
          this.VM.state.meta.snapshots = res?.meta.snapshots;
          this.openNotification("success", {
            message: this.$t("Create snapshot"),
          });
          this.snapshots.addSnap.modal = false;
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotification("error", opts);
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
      this.invokeAction(data)
        .then(() => {
          delete this.VM.state.meta.snapshots[index];
          this.openNotification("success", {
            message: this.$t("Delete snapshot"),
          });
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotification("error", opts);
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
      this.invokeAction(data)
        .then(() => {
          this.openNotification("success", {
            message: this.$t("Revert snapshot"),
          });
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotification("error", opts);
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
          this.invokeAction({
            uuid: this.VM.uuid,
            uuidService: this.VM.uuidService,
            action: "backup_restore_points",
          })
            .then(({ meta }) => {
              this.dates = meta.restorePoints;
            })
            .finally(() => {
              this.actionLoading = false;
            });
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
    sendNewTariff() {
      this.isSwitchLoading = true;
      this.sendAction("get_upgrade_price")
        .then((res) => {
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
        .finally(() => {
          this.isSwitchLoading = false;
        });
    },
    sendAddingAddon(action) {
      this.$confirm({
        title: this.$t(`Do you want to add an ${action}?`),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk: () => {
          const key = this.VM.product;
          const planCode = this.VM.billingPlan.products[key].meta.addons.find(
            (addon) => addon.includes(action)
          );
          this.actionLoading = true;
          this.invokeAction({
            uuid: this.VM.uuid,
            uuidService: this.VM.uuidService,
            action: "add_addon",
            params: { planCode },
          })
            .then(() => {
              this.openNotification("success", { message: "Done!" });
            })
            .catch((err) => {
              const opts = {
                message: `Error: ${err.response?.data?.message ?? "Unknown"}.`,
              };

              if (err.response?.status >= 500) {
                opts.message = `Error: ${this.$t("Failed to load data")}`;
              }
              this.openNotification("error", opts);
              console.error(err);
            })
            .finally(() => {
              this.actionLoading = false;
            });
        },
        onCancel() {},
      });
    },
    async sendAction(action) {
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action,
      };

      if (action === "recover") {
        data.action = "backup_restore";
        data.params = { type: "full", restorePoint: this.option.recover };
      }
      if (action === "get_upgrade_price") {
        data.params = { newPlanCode: this.planCode };
      }

      return this.invokeAction(data)
        .then((res) => {
          this.openNotification("success", { message: "Done!" });

          return res;
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };

          if (err.response?.status >= 500) {
            opts.message = `Error: ${this.$t("Failed to load data")}`;
          }
          this.openNotification("error", opts);
        });
    },
    openVNC() {
      this.invokeAction({
        uuid: this.$route.params.uuid,
        action: "start_vnc",
      })
        .then(({ meta }) => {
          location.href = meta.url;
        })
        .catch((err) => console.error(err));
    },
    async updateInstanceAutoRenew(value) {
      this.isUpdateAutoRenewLoading = true;
      try {
        if (!this.VM.meta) {
          this.VM.meta = {};
        }

        this.VM.meta.autoRenew = value;

        const instance = {
          uuid: this.VM.uuid,
          meta: this.VM.meta,
          billingPlan: this.VM.billingPlan,
        };

        await this.updateInstance(instance);
      } finally {
        this.isUpdateAutoRenewLoading = false;
      }
    },
  },
});
</script>

<style scoped>
.block-content_table {
  position: relative;
  display: grid;
  padding: 10px 15px;
}

.block-content_table::before {
  content: "";
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
