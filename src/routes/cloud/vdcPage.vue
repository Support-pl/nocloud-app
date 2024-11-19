<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="service.uuid">
          <div class="service-page__header">
            <div class="service-page__title">
              {{ service.title }}
            </div>
          </div>

          <div class="service-page__info">
            <div class="service-page__info-title">
              {{ capitalize($t("status")) }}:
              <a-tag :color="getTagColor">
                {{ $t(service.status) }}
              </a-tag>
            </div>
          </div>

          <div
            v-if="provider.publicData?.sunstone_url"
            class="service-page__info"
          >
            <div class="service-page__info-title">
              Sunstone:
              <span style="font-weight: 400">{{
                provider.publicData?.sunstone_url
              }}</span>
            </div>
          </div>

          <div v-if="isActionsActive" class="service-page__info">
            <div class="service-page__info-title">
              {{ $t("Actions") }}:
              <div style="display: inline-flex; gap: 8px">
                <a-button size="small" @click="sendRenew">
                  {{ capitalize($t("renew")) }}
                </a-button>
                <a-button danger size="small" @click="sendDelete">
                  {{ $t("Delete") }}
                </a-button>
              </div>
            </div>
          </div>

          <a-row :gutter="[10, 10]">
            <a-col
              v-for="item in info"
              :key="item.key"
              :md="12"
              :xs="12"
              :sm="12"
            >
              <div class="service-page__info">
                <div class="service-page__info-title">
                  {{ capitalize(item.title) }}:
                </div>

                <div
                  v-if="item.type === 'money'"
                  class="service-page__info-value"
                >
                  {{ service[item.key] }} {{ currency.code }}
                </div>

                <div
                  v-else-if="item.type === 'date'"
                  class="service-page__info-value"
                >
                  <template v-if="service[item.key] === '0000-00-00'">
                    -
                  </template>
                  <template v-else>
                    {{ dateFormat(service[item.key]) }}
                  </template>
                </div>

                <div
                  v-else-if="item.type === 'password'"
                  class="service-page__info-value"
                  style="display: flex; align-items: center; gap: 5px"
                >
                  <a-input-password
                    readonly
                    style="padding: 0"
                    :bordered="false"
                    :value="service[item.key]"
                  />
                  <copy-icon @click="addToClipboard(service[item.key])" />
                </div>

                <div
                  v-else-if="item.type === 'text'"
                  class="service-page__info-value"
                >
                  {{ capitalize($t(service[item.key].toLowerCase())) }}
                </div>

                <div
                  v-else-if="item.type === 'login'"
                  class="service-page__info-value"
                >
                  {{ capitalize(service[item.key]) }}
                  <copy-icon @click="addToClipboard(service[item.key])" />
                </div>

                <div v-else class="service-page__info-value">
                  {{
                    options[item.key]?.suffix === "Gb"
                      ? service[item.key] / 1024
                      : service[item.key]
                  }}
                  {{ options[item.key]?.suffix ?? "" }}
                </div>
              </div>
            </a-col>
          </a-row>
        </template>

        <loading v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, h, ref } from "vue";
import { Modal } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { useAuthStore } from "@/stores/auth.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useSpStore } from "@/stores/sp.js";

import { useNotification, useClipboard, useCurrency } from "@/hooks/utils";

import loading from "@/components/ui/loading.vue";
import { useInvoicesStore } from "@/stores/invoices";

const copyIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CopyOutlined")
);

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const { openNotification } = useNotification();
const { addToClipboard } = useClipboard();
const { currency } = useCurrency();

const authStore = useAuthStore();
const namespacesStore = useNamespasesStore();
const instancesStore = useInstancesStore();
const invoicesStore = useInvoicesStore();
const providersStore = useSpStore();

const service = computed(() => {
  const instance = instancesStore.instances.find(
    ({ uuid }) => uuid === route.params.uuid
  );

  if (!instance) return {};
  return {
    ...instance,
    ...instance.resources,
    status: `cloudStateItem.${instance.state.state}`,
    password: instance.data.password,
  };
});

const options = {
  cpu: { suffix: "cores", title: "CPU", sorter: 0 },
  ram: { suffix: "Gb", title: "RAM", sorter: 1 },
  drive_ssd: { suffix: "Gb", title: "SSD", sorter: 2 },
  drive_hdd: { suffix: "Gb", title: "HDD", sorter: 3 },
  ips_public: { suffix: "", title: "Public IP's", sorter: 4 },
  ips_private: { suffix: "", title: "Private IP's", sorter: 5 },
};

const info = computed(() => {
  const resources = Object.keys(service.value?.resources ?? {}).map((key) => ({
    title: options[key].title,
    key,
    type: "number",
  }));

  resources.sort((a, b) => options[a.key].sorter - options[b.key].sorter);
  return [
    { title: "login", key: "uuid", type: "login" },
    { title: "password", key: "password", type: "password" },
    ...resources,
  ];
});

const getTagColor = computed(() => {
  const status = service.value.status.replace("cloudStateItem.", "");

  switch (status?.toLowerCase()) {
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

const provider = computed(
  () =>
    providersStore.servicesProviders.find(
      ({ uuid }) => uuid === service.value.sp
    ) ?? {}
);

const isActionsActive = ref(false);

function sendRenew() {
  Modal.confirm({
    title: i18n.t("Do you want to renew service?"),
    okText: i18n.t("Yes"),
    cancelText: i18n.t("Cancel"),
    okButtonProps: { disabled: service.value.data.blocked },
    onOk: async () => {
      return invoicesStore
        .createRenewInvoice(service.value)
        .then(() => {
          openNotification("success", { message: "Done!" });
          service.value.data.blocked = true;
        })
        .catch((error) => {
          const message =
            error.response?.data?.message ?? error.message ?? error;

          openNotification("error", {
            message: `[Error]: ${message ?? "Unknown"}.`,
          });
          console.error(error);
        })
        .finally(Modal.destroyAll);
    },
    onCancel() {},
  });
}

function sendDelete() {
  Modal.confirm({
    title: i18n.t("Do you want to delete this service?"),
    okType: "danger",
    okText: i18n.t("Yes"),
    cancelText: i18n.t("Cancel"),
    content: () =>
      h("div", { style: "color: red" }, i18n.t("All data will be deleted!")),
    onOk: async () => {
      return instancesStore
        .deleteInstance(service.value.uuid)
        .then(() => {
          openNotification("success", { message: "Done!" });
          router.push({ path: "/services" });
        })
        .catch((error) => {
          const message =
            error.response?.data?.message ?? error.message ?? error;

          openNotification("error", {
            message: `[Error]: ${message ?? "Unknown"}.`,
          });
          console.error(error);
        });
    },
    onCancel() {},
  });
}

async function fetch() {
  try {
    await Promise.all([
      instancesStore.fetch(),
      authStore.fetchBillingData(),
      providersStore.fetch(!authStore.isLogged),
    ]);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", {
      message: `[Error]: ${message ?? "Unknown"}.`,
    });
    console.error(error);
  }
}

fetch();
</script>

<script>
export default { name: "OpenVdc" };
</script>

<style scoped>
.service-page {
  padding-top: 20px;
}

.service-page-card {
  padding: 10px 15px 15px;
  border-radius: 10px;
  background: var(--bright_font);
}

.service-page__header {
  margin-bottom: 10px;
}

.service-page__title {
  font-size: 1.6rem;
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

@media screen and (max-width: 768px) {
  .service-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
