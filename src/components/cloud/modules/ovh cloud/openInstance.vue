<template>
  <div class="Fcloud">
    <slot name="header" />
    <div class="Fcloud__buttons">
      <div
        v-if="VM.state && VM.state.state !== 'STOPPED'"
        class="Fcloud__button"
        :class="{ disabled: statusVM.shutdown }"
        @click="sendAction('stop_vm')"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Power off") }}
        </div>
      </div>
      <div
        v-else
        class="Fcloud__button"
        :class="{ disabled: statusVM.start }"
        @click="sendAction('start_vm')"
      >
        <div class="Fcloud__BTN-icon">
          <caret-right-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Start") }}
        </div>
      </div>
      <div
        class="Fcloud__button btn_disabled_wiggle"
        :class="{ disabled: statusVM.reboot }"
        @click="openModal('reboot')"
      >
        <div class="Fcloud__BTN-icon">
          <redo-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Reboot") }}
        </div>
        <a-modal
          v-model:open="modal.reboot"
          :title="$t('cloud_Reboot_modal')"
          @ok="sendAction('reboot_vm')"
        >
          <p>{{ $t("cloud_Reboot_invite") }}</p>
          <a-radio-group
            v-model:value="option.reboot"
            name="rebootOption"
            default-value="soft"
          >
            <a-radio value="soft">
              <a-tag color="green">
                {{ $t("cloud_Regular") }}
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
            <a-radio value="hard">
              <a-tag color="red"> HARD </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
      <div
        v-if="false"
        class="Fcloud__button"
        :class="{ disabled: statusVM.recover }"
        @click="openModal('recover')"
      >
        <div class="Fcloud__BTN-icon">
          <backward-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Recover") }}
        </div>
        <a-modal
          v-model:open="modal.recover"
          :title="$t('cloud_Recover_modal')"
          @ok="sendRecover"
        >
          <template
            v-if="VM.config.addons?.find((el) => el.includes('backup'))"
          >
            <p>{{ $t("cloud_Recover_invite_line1") }}</p>
            <p>{{ $t("cloud_Recover_invite_line2") }}</p>
            <p>{{ $t("cloud_Recover_invite_line3") }}</p>
            <p>{{ $t("cloud_Recover_invite") }}</p>
            <a-spin :tip="$t('loading')" :spinning="actionLoading">
              <a-radio-group v-model:value="option.recover" name="recover">
                <a-radio v-for="item of dates" :key="item" :value="item">
                  {{ item }}
                </a-radio>
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
              <sync-icon
                v-if="false"
                title="Renew"
                @click="isVisible = !isVisible"
              />
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
        <a-spin :tip="$t('loading')" :spinning="isPlansLoading">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 5px">
            <span style="margin-right: 16px"
              >{{ $t("Select new tariff") }}:</span
            >
            <a-select
              v-model:value="planCode"
              show-search
              :filter-option="searchTafiff"
            >
              <a-select-option v-for="(item, key) in tariffs" :key="key">
                {{ item.title }}
              </a-select-option>
            </a-select>

            <span style="margin-right: 16px">{{ $t("Select new OS") }}:</span>
            <a-select v-model:value="newOS">
              <a-select-option v-for="item of images" :key="item.id">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </div>

          <div
            v-if="planCode"
            style="
              display: grid;
              grid-template-columns: 100px 1fr;
              margin-top: 10px;
              text-align: right;
            "
          >
            <span style="font-weight: 700; text-align: left"
              >{{ $t("cpu") }}:</span
            >
            {{ tariffs[planCode].resources.cpu }} cores
            <span style="font-weight: 700; text-align: left"
              >{{ $t("ram") }}:</span
            >
            {{ tariffs[planCode].resources.ram / 1000 }} Gb
            <span style="font-weight: 700; text-align: left"
              >{{ $t("disk") }}:</span
            >
            {{ tariffs[planCode].resources.drive_size / 1024 }} Gb
          </div>
        </a-spin>
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
          <template v-if="Object.keys(addonsPrice ?? {}).length > 0">
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
          <div class="block__column" style="align-items: flex-end">
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
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">CPU</div>
            <div class="block__value">
              {{ VM.resources.cpu }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Memory") }}
            </div>
            <div class="block__value">
              {{ (VM.resources.ram / 1000).toFixed(2) }} GB
            </div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <database-icon /> {{ $t("cloud_Storage") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Type") }}
            </div>
            <div class="block__value">
              {{ VM.resources.drive_type ?? "SSD" }}
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

      <a-row v-if="VM.state" :gutter="[15, 15]" style="margin-top: 20px">
        <a-col :span="24" :md="12">
          <a-button
            v-show="false"
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
          >
            <router-link :to="{ path: `${$route.params.uuid}/vnc` }">
              VNC
            </router-link>
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
import { usePlansStore } from "@/stores/plans.js";

import renewalModal from "@/components/ui/renewalModal.vue";

const redoIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RedoOutlined")
);
const backwardIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/BackwardOutlined")
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

export default defineComponent({
  name: "OpenInstance",
  components: {
    renewalModal,
    redoIcon,
    backwardIcon,
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
      reboot: "soft",
      shutdown: 0,
      recover: 0,
    },

    dates: [],
    planCode: "",
    newOS: "",
    actionLoading: false,
    isSwitchLoading: false,
    isVisible: false,
  }),
  computed: {
    ...mapState(usePlansStore, { plans: "plans", isPlansLoading: "isLoading" }),
    ...mapState(useSpStore, ["servicesProviders"]),
    ...mapState(useAuthStore, ["userdata", "baseURL"]),
    ...mapState(useInstancesStore, ["services"]),
    statusVM() {
      if (!this.VM?.state) {
        return { shutdown: true, reboot: true, start: true, recover: true };
      }
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
      const key = this.VM.product;
      const type = this.VM.billingPlan.type.split(" ")[1];
      const imageId = this.VM.config.configuration[`${type}_os`];

      const { os } = this.VM.billingPlan.products[key].meta;
      const { name } = os.find(({ id }) => id === imageId) ?? {};

      return name ?? this.$t("No Data");
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
        Object.values(this.addonsPrice ?? {}).reduce(
          (sum, curr) => sum + curr,
          0
        )
      );
    },
    renewalProps() {
      const key = this.VM.product;
      const { period } = this.VM.billingPlan.products[key];
      const currentPeriod = this.VM.data.expiration;
      const newPeriod = this.date(this.VM.data.expiration, +period);

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
      const { products } =
        this.plans.find(({ uuid }) => uuid === this.VM.billingPlan.uuid) ?? {};
      const productKey = this.VM.product;
      const keys = Object.keys(products ?? {}).sort(
        (a, b) => products[a].price - products[b].price
      );

      keys.forEach((key) => {
        const { cloud_datacenter: region } = this.VM.config.configuration;
        const [a, b] = [products[productKey], products[key]];

        const isPriceMore = a.price <= b.price;
        const isPeriodsEqual = a.period === b.period;
        const isRegionIncluded = b.meta.datacenter.includes(region);

        if (productKey === key) return;
        if (isPriceMore && isPeriodsEqual && isRegionIncluded) {
          tariffs[key] = products[key];
        }
      });

      return tariffs;
    },
    images() {
      return this.tariffs[this.planCode]?.meta.os ?? [];
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
  watch: {
    images(value) {
      const os = value.find(({ name }) => name === this.osName);

      this.newOS = os?.id ?? value[0]?.id ?? "";
    },
  },
  created() {
    this.fetchPlans({ sp_uuid: this.VM.sp, anonymously: false });
  },
  methods: {
    ...mapActions(useInstancesStore, [
      "invokeAction",
      "updateService",
      "fetch",
      "updateInstance",
    ]),
    ...mapActions(usePlansStore, { fetchPlans: "fetch" }),
    toDate,
    searchTafiff(string, option) {
      const title = this.tariffs[option.key].title.toLowerCase();

      return title.includes(string.toLowerCase());
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
      const service = this.services.find(
        ({ uuid }) => uuid === this.VM.uuidService
      );
      const instance = service.instancesGroups
        .find(({ sp }) => sp === this.VM.sp)
        .instances.find(({ uuid }) => uuid === this.VM.uuid);

      try {
        this.isSwitchLoading = true;
        const { price, resources } = this.tariffs[this.planCode];

        instance.config.planCode = this.planCode.split(" ")[1];
        instance.config.configuration.cloud_os = this.newOS;
        instance.product = this.planCode;
        instance.resources = { ...instance.resources, ...resources };

        this.$confirm({
          title: this.$t("Do you want to switch tariff?"),
          content: `${this.$t("invoice_Price")}: ${price} ${
            this.currency.title
          }`,
          okText: this.$t("Yes"),
          cancelText: this.$t("Cancel"),
          onOk: async () => {
            await this.updateService(service);
            await this.fetch();

            this.modal.switch = false;
            this.openNotification("success", { message: this.$t("Done") });
          },
          onCancel() {},
        });
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error;

        this.openNotification("error", { message });
        console.error(error);
      } finally {
        this.isSwitchLoading = false;
      }
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
      if (action === "reboot_vm") {
        data.params = { type: this.option.reboot };
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
          console.error(err);
        });
    },
    openVNC() {
      this.invokeAction({
        uuid: this.$route.params.uuid,
        action: "start_vnc_vm",
      })
        .then(({ meta }) => {
          location.href = meta.url;
        })
        .catch((err) => console.error(err));
    },
    date(string, timestamp) {
      if (timestamp < 1) return "-";

      const stringDate = new Date(string).getTime();
      const date = new Date(timestamp * 1000 + stringDate);

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${year}-${month}-${day}`;
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
