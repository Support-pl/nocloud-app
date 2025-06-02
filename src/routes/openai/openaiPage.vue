<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="service">
          <div class="service-page__header">
            <div class="service-page__title">
              {{ service.name }}
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
              service.groupname === 'OpenAI'
                ? { display: 'inline-block', width: '50%' }
                : null
            "
          >
            <div class="service-page__info-title">
              {{ t("Actions") }}:
              <div style="display: inline-flex; gap: 8px">
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

          <component :is="getModuleButtons" :service="service" />
        </template>

        <loading v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, h, ref, watch } from "vue";
import { useNotification } from "@/hooks/utils";
import config from "@/appconfig.js";

import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useInstancesStore } from "@/stores/instances.js";

import loading from "@/components/ui/loading.vue";
import serviceInfo from "@/components/ui/serviceInfo.vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Modal } from "ant-design-vue";
import { useInvoicesStore } from "@/stores/invoices";
import { GetInvoicesRequest } from "nocloud-proto/proto/es/billing/billing_pb";

const caretRightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CaretRightOutlined")
);

const authStore = useAuthStore();
const instancesStore = useInstancesStore();
const chatsStore = useChatsStore();
const invoicesStore = useInvoicesStore();

const route = useRoute();
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
const lastInvoice = ref(null);

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
const getModuleButtons = computed(() => {
  if (!service.value.groupname) return;
  const { status, state } = service.value;
  const serviceType = config
    .getServiceType(service.value.groupname)
    ?.toLowerCase();

  const components = import.meta.glob("@/components/services/*/draw.vue");
  const component = Object.keys(components).find((key) =>
    key.includes(`/${serviceType}/draw.vue`)
  );

  if (!components[component]) return;
  if (serviceType === undefined) return;
  if (!(status === "Active" || state?.state === "RUNNING")) return;
  return defineAsyncComponent(() => components[component]());
});
const isActionsActive = computed(() => {
  const key = service.value.product ?? service.value.config?.product;
  const { meta } = service.value.billingPlan?.products[key] ?? {};

  return !service.value.clientid && meta?.renew !== false;
});

async function onStart() {
  await authStore.fetchBillingData();
  await instancesStore.fetch();

  const domain = instancesStore.getInstances.find(
    ({ uuid }) => uuid === route.params.id
  );
  let groupname = "OpenAI";
  let date = "year";

  const products = Object.values(domain.billingPlan.resources).reduce(
    (result, resource) => ({
      ...result,
      [resource.key]: resource.price,
    }),
    {}
  );

  domain.resources = {
    ...products,
    period: t("PayG"),
    recurringamount: 0,
    inputKilotoken: products.input_kilotoken,
    outputKilotoken: products.output_kilotoken,
  };

  domain.data.expiry = {
    expiredate: formatDate(domain.data.next_payment_date ?? 0),
    regdate: domain.data.creation,
  };

  chatsStore.startStream();

  const { period, recurringamount } = domain.resources;
  const { expiredate, regdate } = domain.data.expiry;

  service.value = {
    ...domain,
    groupname,
    regdate,
    name: domain.title,
    status: `cloudStateItem.${domain.state?.state || "UNKNOWN"}`,
    domain: domain.resources.domain ?? domain.config.domain,
    autorenew: domain.config.auto_renew ? "enabled" : "disabled",
    billingcycle: typeof period === "string" ? period : t(date, period),
    recurringamount:
      recurringamount ??
      domain.billingPlan.products[domain.product]?.price ??
      "?",
    nextduedate: expiredate,
  };
  info.value[0].type = "";
}

onStart();

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
</style>
