<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="!isDataLoading">
          <div class="service-page__header">
            <div class="service-page__title">
              {{ service.name }}
              <a-button
                style="margin-left: 10px"
                size="small"
                shape="circle"
                :icon="h(editOutlined)"
                @click="isNameEditActive = true"
              />

              <a-modal
                v-model:open="isNameEditActive"
                :title="t('vpn.labels.editName')"
              >
                <div>
                  <a-form
                    ref="editNameForm"
                    :model="nameEditData"
                    name="basic"
                    autocomplete="off"
                  >
                    <a-form-item
                      name="title"
                      :label="t('vpn.fields.title')"
                      :rules="[requiredRule]"
                    >
                      <a-input
                        v-model:value="nameEditData.title"
                        :placeholder="t('vpn.fields.title')"
                      />
                    </a-form-item>
                  </a-form>
                </div>

                <template #footer>
                  <a-button key="back" @click="isNameEditActive = false">{{
                    t("Cancel")
                  }}</a-button>
                  <a-button
                    key="submit"
                    type="primary"
                    :loading="isNameEditLoading"
                    @click="editName"
                    >{{ t("Save") }}</a-button
                  >
                </template>
              </a-modal>
            </div>
          </div>

          <div v-if="lastInvoice" class="service-page__info">
            <div
              class="service-page__info-title"
              :style="{ display: 'inline-block', width: '50%' }"
            >
              {{ capitalize(t("invoice status")) }}:
              <a-tag :color="getInvoiceStatusColor">
                {{ t(lastInvoice.status) }}
              </a-tag>
              <a-button size="small" type="primary" @click="clickOnInvoice">
                {{ t("open") }}
              </a-button>
            </div>

            <div
              class="service-page__info-title"
              :style="{ display: 'inline-block', width: '50%' }"
            >
              {{ capitalize(t("userService.auto renew")) }}:

              <a-switch
                :loading="isUpdateAutoRenewLoading"
                :checked="service.meta?.autoRenew"
                @update:checked="updateInstanceAutoRenew"
              ></a-switch>
            </div>
          </div>

          <div
            class="service-page__info"
            :style="{ display: 'inline-block', width: '50%' }"
          >
            <div class="service-page__info-title">
              {{ capitalize(t("status")) }}:
              <a-tag :color="getTagColor">
                {{ t(service.status) }}
              </a-tag>
            </div>
          </div>

          <div
            v-if="isActionsActive"
            class="service-page__info"
            :style="
              service.groupname === 'AIBot'
                ? { display: 'inline-block', width: '50%' }
                : null
            "
          >
            <div class="service-page__info-title">
              {{ t("Actions") }}:
              <div style="display: inline-flex; gap: 8px">
                <a-button
                  :loading="isDisabledLoading"
                  @click="changeBotDisabled"
                  size="small"
                  :type="bot.settings.disabled ? 'primary' : undefined"
                  :danger="!bot.settings.disabled"
                  >{{
                    !bot.settings.disabled
                      ? t("ai_bot_page.actions.stop")
                      : t("ai_bot_page.actions.start")
                  }}</a-button
                >

                <a-button danger size="small" @click="sendDelete">
                  {{ t("Delete") }}
                </a-button>
              </div>
            </div>
          </div>

          <a-collapse class="service-page__collapse" :bordered="false">
            <template #expandIcon="{ isActive }">
              <caret-right-icon :rotate="isActive ? 90 : 0" />
            </template>

            <a-collapse-panel :header="capitalize(t('info'))">
              <service-info :service="service" :info="info" />
            </a-collapse-panel>
          </a-collapse>

          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane :disabled="isPending" key="chats">
              <template #tab>
                <span class="tab">
                  {{ t("ai_bot_page.tabs.chats") }}
                </span>
              </template>
              <div v-if="isSuspended" style="position: relative">
                <div style="opacity: 0.6">
                  <bot-info :service="service" />

                  <div
                    style="
                      position: absolute;
                      inset: 0;
                      background: transparent;
                      cursor: not-allowed;
                      z-index: 10;
                    "
                  ></div>
                </div>
              </div>
              <bot-info v-else :service="service" />
            </a-tab-pane>
            <a-tab-pane key="settings" :disabled="isPending">
              <template #tab>
                <span class="tab">
                  {{ t("ai_bot_page.tabs.settings") }}

                  <span
                    v-if="isSettingsBroken && !isPending"
                    class="pulsating-circle"
                  ></span>
                </span>
              </template>

              <a-alert v-if="isSettingsBroken" type="warning" show-icon>
                <template #description>
                  <span v-html="marked(t('bots.labels.channel_warning'))" />
                </template>
              </a-alert>

              <bot-settings
                ref="botSettings"
                :save-primary="isSavePrimary"
                @update:save-primary="isSavePrimary = $event"
                :save-loading="isBotSaveLoading"
                @update:save-loading="isBotSaveLoading = $event"
                :service="service"
              />
            </a-tab-pane>
            <a-tab-pane :disabled="isSuspended || isPending" key="database">
              <template #tab>
                <span class="tab">
                  {{ t("ai_bot_page.tabs.databases") }}

                  <span
                    v-if="isUnInmportedSites"
                    class="pulsating-circle"
                  ></span>
                </span>
              </template>

              <bot-database v-if="route.query.database" :service="service" />
              <bot-databases v-else :service="service" />
            </a-tab-pane>

            <a-tab-pane
              :disabled="isSuspended || isPending"
              key="notifications"
            >
              <template #tab>
                <span class="tab">
                  {{ t("ai_bot_page.tabs.notifications") }}
                </span>
              </template>

              <bot-notifications :service="service" />
            </a-tab-pane>
          </a-tabs>
        </template>

        <loading v-else />
      </div>
    </div>

    <div
      v-if="activeTab === 'settings' && isSavePrimary"
      class="container"
      style="
        position: sticky;
        bottom: 25px;
        display: flex;
        justify-content: flex-end;
        z-index: 60;
        pointer-events: auto;
        min-height: 0px;
      "
    >
      <a-button
        style="margin-right: 10px"
        key="back"
        :loading="isBotSaveLoading"
        @click="handleSaveBot"
        :type="isSavePrimary ? 'primary' : 'default'"
        >{{ t("bots.actions.save_bot") }}

        <template #icon>
          <save-icon></save-icon>
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, h, ref, watch } from "vue";
import { useNotification } from "@/hooks/utils";
import { useAuthStore } from "@/stores/auth.js";
import { useInstancesStore } from "@/stores/instances.js";
import loading from "@/components/ui/loading.vue";
import serviceInfo from "@/components/ui/serviceInfo.vue";
import BotInfo from "@/components/services/bots/draw.vue";
import BotDatabases from "@/components/services/bots/databases.vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Modal } from "ant-design-vue";
import { removeEmptyValues } from "@/functions";
import { UpdateRequest } from "nocloud-proto/proto/es/instances/instances_pb";
import { useChatsStore } from "@/stores/chats";
import { useAiBotsStore } from "@/stores/aiBots";
import BotDatabase from "@/components/services/bots/database.vue";
import BotSettings from "@/components/services/bots/settings.vue";
import BotNotifications from "@/components/services/bots/notifications.vue";
import { marked } from "marked";
import { useInvoicesStore } from "@/stores/invoices";
import { GetInvoicesRequest } from "nocloud-proto/proto/es/billing/billing_pb";

const caretRightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CaretRightOutlined")
);

const editOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EditOutlined")
);

const saveIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SaveOutlined")
);

const authStore = useAuthStore();
const instancesStore = useInstancesStore();
const chatsStore = useChatsStore();
const aiBotsStore = useAiBotsStore();
const invoicesStore = useInvoicesStore();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const notification = useNotification();

const info = ref([
  {
    title: "billing cycle",
    key: "billingcycle",
    type: "text",
  },
  {
    title: "registration date",
    key: "regdate",
    type: "date",
  },
]);
const service = ref(null);
const bot = ref(null);
const isDataLoading = ref(false);

const editNameForm = ref(null);
const isNameEditActive = ref(false);
const isNameEditLoading = ref(false);
const nameEditData = ref({ title: "" });
const activeTab = ref();
const lastInvoice = ref(null);

const isSavePrimary = ref(false);
const isBotSaveLoading = ref(false);

const isUpdateAutoRenewLoading = ref(false);
const isDisabledLoading = ref(false);

const botSettings = ref();

const requiredRule = computed(() => ({
  required: true,
  message: t("ssl_product.field is required"),
  trigger: "blur",
}));

const getTagColor = computed(() => {
  const status = service.value.status.replace("cloudStateItem.", "");

  switch (status.toLowerCase()) {
    case "running":
    case "active":
      return "green";
    case "operation":
    case "pending":
      return "blue";
    case "stopped":
    case "suspended":
      return "orange";
    case "cancelled":
    default:
      return "red";
  }
});

const isActionsActive = computed(() => {
  const key = service.value.product ?? service.value.config?.product;
  const { meta } = service.value.billingPlan?.products[key] ?? {};

  return !service.value.clientid && meta?.renew !== false;
});

const isUnInmportedSites = computed(() => {
  return Object.values(
    JSON.parse(localStorage.getItem("unInmportedSitesMap") || "{}")
  ).some((value) => !value);
});

const isSettingsBroken = computed(
  () => !bot.value?.channels || !bot.value?.channels?.length
);

const isSuspended = computed(() => service.value?.state?.state === "SUSPENDED");
const isPending = computed(() => service.value?.state?.state === "PENDING");

const getInvoiceStatusColor = computed(() => {
  switch (lastInvoice.value.status) {
    case "PAID":
      return "green";
    case "UNPAID":
      return "red";
    default:
      return "";
  }
});

async function onStart() {
  isDataLoading.value = true;

  try {
    router.replace({ query: {} });

    await Promise.all([
      authStore.fetchBillingData(),
      instancesStore.fetch(),
      chatsStore.fetch_models_list(),
    ]);

    const domain = instancesStore.getInstances.find(
      ({ uuid }) => uuid === route.params.id
    );

    if (!domain) {
      return;
    }

    let groupname = "AIBot";
    let date = "year";

    domain.resources = {
      period: t("PayG"),
    };

    domain.data.expiry = {
      expiredate: formatDate(domain.data.next_payment_date ?? 0),
      regdate: domain.data.creation,
    };

    const { period } = domain.resources;

    service.value = {
      ...domain,
      groupname,
      regdate: +domain.created * 1000,
      name: domain.title,
      status: `cloudStateItem.${domain.state?.state || "UNKNOWN"}`,
      autorenew: domain.config.auto_renew ? "enabled" : "disabled",
      billingcycle: typeof period === "string" ? period : t(date, period),
    };
    info.value[0].type = "";

    if (isPending.value) {
      return;
    }

    bot.value = await aiBotsStore.getBot(service.value.data.bot_uuid);
    aiBotsStore.startChatsStream();

    if (isSettingsBroken.value) {
      activeTab.value = "settings";
    }
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    notification.openNotification("error", opts);
  } finally {
    isDataLoading.value = false;
  }
}

onStart();

async function clickOnInvoice() {
  const paymentLink = await invoicesStore.getPaymentLink(
    lastInvoice.value.uuid
  );

  window.location.href = paymentLink;
}

const editName = async () => {
  try {
    await editNameForm.value.validate();
    isNameEditLoading.value = true;

    const updateData = removeEmptyValues({
      ...instancesStore.getInstances.find((i) => i.uuid === service.value.uuid),
      title: nameEditData.value.title,
    });

    delete updateData.uuidService;
    delete updateData.estimate;
    delete updateData.sp;
    delete updateData.type;

    await instancesStore.instancesApi.update(
      UpdateRequest.fromJson({
        instance: updateData,
      })
    );
    service.value.name = nameEditData.value.title;

    isNameEditActive.value = false;
  } finally {
    isNameEditLoading.value = false;
  }
};

function sendDelete() {
  Modal.confirm({
    title: t("Do you want to delete this service?"),
    okType: "danger",
    okText: t("Yes"),
    cancelText: t("Cancel"),
    content: () =>
      h("div", { style: "color: red" }, t("All data will be deleted!")),
    onOk: async () => {
      return instancesStore
        .deleteInstance(service.value.uuid)
        .then(() => {
          notification.openNotification("success", { message: "Done!" });
          router.push({ path: "/services" });
        })
        .catch((err) => {
          notification.openNotification("error", {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          });
          console.error(err);
        });
    },
    onCancel() {},
  });
}

const changeBotDisabled = async () => {
  isDisabledLoading.value = true;

  try {
    await aiBotsStore.updateBot({
      ...bot.value,
      settings: {
        ...bot.value.settings,
        disabled: !bot.value.settings.disabled,
      },
    });

    bot.value.settings.disabled = !bot.value.settings.disabled;
  } finally {
    isDisabledLoading.value = false;
  }
};

function formatDate(timestamp) {
  if (timestamp < 1) return "0000-00-00";

  const date = new Date(timestamp * 1000);

  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (`${month}`.length < 2) month = `0${month}`;
  if (`${day}`.length < 2) day = `0${day}`;

  return `${year}-${month}-${day}`;
}

const updateInstanceAutoRenew = async (value) => {
  isUpdateAutoRenewLoading.value = true;
  try {
    if (!service.value.meta) {
      service.value.meta = {};
    }

    service.value.meta.autoRenew = value;

    const instance = {
      uuid: service.value.uuid,
      meta: service.value.meta,
      billingPlan: service.value.billingPlan,
    };

    await instancesStore.updateInstance(instance);
  } finally {
    isUpdateAutoRenewLoading.value = false;
  }
};

const handleSaveBot = () => {
  if (botSettings.value) {
    botSettings.value.handleSaveBot();
  }
};

watch(isNameEditActive, (value) => {
  if (value) {
    nameEditData.value = { title: service.value.name };
  }
});

watch(service, async () => {
  const invoices = await invoicesStore.invoicesApi.getInvoices(
    GetInvoicesRequest.fromJson({
      page: 1,
      limit: 3,
      sort: "DESC",
      field: "created",
      filters: { instances: [service.value.uuid] },
    })
  );
  lastInvoice.value = invoices.toJson().pool?.[0];
});
</script>

<script>
export default {
  name: "UserServiceView",
};
</script>

<style scoped>
.service-page {
  padding-top: 20px;
}

.service-page-card {
  background: var(--bright_font);
  border-radius: 10px;
  padding: 10px 15px 15px;
}

.service-page__header {
  margin-bottom: 10px;
}

.service-page__title {
  display: flex;
  justify-content: baseline;
  align-items: center;
  font-size: 1.6rem;
}

.service-page__domain {
  font-size: 1rem;
}

.service-page__info:not(:last-of-type) {
  margin-bottom: 5px;
}

.service-page__info-title {
  font-weight: bold;
}

.service-page__info-value {
  font-size: 1.1rem;
}

.service-page__info-value div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.service-page__collapse,
.service-page__collapse :deep(.ant-collapse-content) {
  color: inherit;
}

.service-page__collapse :deep(.ant-collapse-header) {
  font-weight: 700;
  color: inherit;
}

.product__specs {
  --color: rgb(126, 126, 126);
  color: var(--color);
  margin: 0 auto;
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td {
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1) {
  font-weight: 500;
}

.product__specs td:nth-child(2) {
  text-align: right;
  color: rgba(0, 0, 0, 0.7);
}

.product__specs tr {
  border-bottom: var(--border-line-weight) var(--border-line-type)
    var(--border-color);
}

.product__specs td:last-child::before {
  content: "";
  width: 2px;
  height: 50%;
  background: #f5f5f5;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

@media screen and (max-width: 768px) {
  .service-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}

@media screen and (max-width: 576px) {
  .product__specs {
    width: 100%;
  }

  .product__specs td {
    padding: 3px 7px;
  }

  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
  }
}

span.tab {
  font-weight: 500;
  font-size: 1rem;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.pulsating-circle {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-color: red;
  border-radius: 50%;
  animation: pulse 2.5s infinite ease-in-out;
  margin-right: 5px;
}
</style>
