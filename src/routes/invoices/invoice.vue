<template>
  <div class="invoices">
    <div class="container">
      <a-progress
        v-if="transactionsStore.isLoading || invoicesStore.isLoading"
        ref="loading"
        status="active"
        :percent="percent"
        :show-info="false"
      />

      <div ref="wrapper" class="invoices__wrapper">
        <a-radio-group
          v-if="!authStore.billingUser.paid_stop"
          v-model:value="currentTab"
          size="large"
          default-value="Invoice"
        >
          <a-radio-button
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
          >
            {{ $t(tab.label) }}
          </a-radio-button>
        </a-radio-group>

        <template v-if="currentTab === 'Invoice'">
          <empty v-if="invoices?.length === 0" style="margin: 50px 0" />
          <template v-else>
            <a-card
              v-if="
                invoices?.some(
                  (invoice) =>
                    invoice.status === 'Unpaid' &&
                    invoice.properties.phoneVerificationRequired &&
                    !userdata.isPhoneVerified
                )
              "
              class="need_verification"
            >
              {{ $t("phone_verification.labels.invoices_message") }}
            </a-card>

            <invoice-item
              v-for="(invoice, index) in invoices"
              :key="index"
              :invoice="invoice"
            />
          </template>
        </template>

        <template v-if="currentTab === 'Detail'">
          <empty v-if="transactions?.length === 0" style="margin: 50px 0" />
          <template v-else>
            <transaction-item
              v-for="(invoice, index) in transactions"
              :key="index"
              :invoice="invoice"
            />
          </template>
        </template>

        <template v-if="currentTab === 'Acts'">
          <acts-list />
        </template>

        <a-pagination
          v-if="currentTab === 'Detail'"
          show-size-changer
          style="width: fit-content; margin-left: auto"
          :page-size-options="pageSizeOptions"
          :page-size="pageSize"
          :total="totalSize"
          :current="currentPage"
          @show-size-change="onShowSizeChange"
          @change="onShowSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useNotification } from "@/hooks/utils";
import config from "@/appconfig.js";

import { useAuthStore } from "@/stores/auth.js";
import { useInvoicesStore } from "@/stores/invoices.js";
import { useTransactionsStore } from "@/stores/transactions.js";
import { useInstancesStore } from "@/stores/instances.js";

import empty from "@/components/ui/empty.vue";
import invoiceItem from "@/components/invoice/invoiceItem.vue";
import transactionItem from "@/components/invoice/transactionItem.vue";
import actsList from "@/components/invoice/actsList.vue";
import { storeToRefs } from "pinia";
import { useChatsStore } from "@/stores/chats";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const { userdata } = storeToRefs(authStore);
const invoicesStore = useInvoicesStore();
const { getInvoices: invoices } = storeToRefs(invoicesStore);
const transactionsStore = useTransactionsStore();
const instancesStore = useInstancesStore();
const chatsStore = useChatsStore();
const { openNotification } = useNotification();
const router = useRouter();
const route = useRoute();

const currentTab = ref("Invoice");
const percent = ref(0);
const pageSizeOptions = ref(["5", "10", "25", "50", "100"]);

const wrapper = ref(null);
const loading = ref(null);

const transactions = computed(() => {
  const result = transactionsStore.filteredTransactions;

  result.sort((a, b) => b.exec - a.exec);
  return result;
});

const currentPage = computed(() => transactionsStore.page);
const pageSize = computed(() => transactionsStore.size);
const totalSize = computed(() => transactionsStore.total);

const radioGroupWidth = computed(() =>
  config.whmcsActs ? "calc(100% / 3)" : "calc(100% / 2)"
);

const tabs = computed(() => {
  const baseTabs = [
    { label: "Invoices", value: "Invoice" },
    { label: "Transactions", value: "Detail" },
  ];
  if (config.whmcsActs) {
    baseTabs.push({ label: "Acts", value: "Acts" });
  }
  return baseTabs;
});

watch(currentTab, () => {
  transactionsStore.tab = currentTab.value;

  router.push({ query: { tab: currentTab.value } });

  if (currentTab.value === "Invoice") return;
  if (transactions.value?.length > 0) return;
  if (!userdata.value.uuid) return;

  transactionsStore.fetch({
    account: userdata.value.uuid,
    page: currentPage.value,
    limit: pageSize.value,
    field: "exec",
    sort: "desc",
    type: "transaction",
  });
});

watch(userdata, () => {
  if (transactionsStore.isLoading) return;
  invoicesStore.fetch(invoices.value?.length);

  transactionsStore.fetch({
    account: userdata.value.uuid,
    page: currentPage.value,
    limit: pageSize.value,
    field: "exec",
    sort: "desc",
    type: "transaction",
  });

  transactionsStore.fetchCount({
    account: userdata.value.uuid,
    type: "transaction",
  });
  setPagination();
});

watch(
  () => transactionsStore.isLoading,
  () => {
    percent.value = 0;
    setCoordY();
    setLoading();
  }
);

watch(() => invoicesStore.isLoading, setCoordY);

onMounted(() => {
  if (authStore.isLogged && userdata.value.uuid) {
    invoicesStore.fetch(invoices.value?.length);

    chatsStore.fetch_models_list();

    transactionsStore.fetchCount({
      account: userdata.value.uuid,
      type: "transaction",
    });
    setPagination();
  }

  currentTab.value =
    tabs.value.find((tab) => tab.value == route.query.tab)?.value || "Invoice";
  router.replace({ query: { tab: currentTab.value } });

  setCoordY();
});

onUnmounted(() => {
  sessionStorage.removeItem("invoice");
});

function setCoordY() {
  setTimeout(() => {
    const items =
      currentTab.value === "Invoice" ? invoices.value : transactions.value;
    const id = sessionStorage.getItem("invoice");
    const i = items.findIndex(({ uuid }) => uuid === id);

    if (i === -1) return;
    wrapper.value?.children[i + 1]?.scrollIntoView();
  }, 100);
}

function setLoading() {
  if (percent.value > 99) {
    percent.value = 0;
    if (loading.value?.$el.style.transform ?? true) return;

    loading.value.$el.style.transform = "rotate(180deg)";
    setTimeout(setLoading, 1000);

    return;
  }

  if (loading.value?.$el.style.transform) {
    loading.value.$el.style.transform = "";
  }
  percent.value += 1;

  setTimeout(setLoading, 10);
}

function setPagination() {
  const pagination = localStorage.getItem("transactionsPagination");

  if (!pagination) return;
  const { page, limit } = JSON.parse(pagination);

  onShowSizeChange(page, limit);
}

function onShowSizeChange(page, limit) {
  if (page !== currentPage.value) {
    transactionsStore.page = page;
  }
  if (limit !== pageSize.value) {
    transactionsStore.size = limit;
  }

  transactionsStore.fetch({
    page,
    limit,
    account: userdata.value.uuid,
    field: "exec",
    sort: "desc",
    type: "transaction",
  });

  localStorage.setItem(
    "transactionsPagination",
    JSON.stringify({ page, limit })
  );
}

async function fetchInstances() {
  if (instancesStore.allInstances?.length > 0) return;
  try {
    await instancesStore.fetchAll();
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message });
    console.error(error);
  }
}

fetchInstances();
</script>

<script>
export default { name: "InvoicesView" };
</script>

<style scoped>
.invoices {
  padding: 0 10px 0;
  overflow: auto;
  height: 100%;
}

.invoices__wrapper {
  padding: 20px 0;
}

.need_verification {
  margin: 10px 0px;
  font-size: 1rem;
  border: dashed 0.2rem var(--warn);
}

.invoices__wrapper :deep(.ant-radio-group) {
  width: 100%;
  margin: 0 1px 20px;
}

.invoices__wrapper :deep(.ant-radio-button-wrapper) {
  width: v-bind("radioGroupWidth");
  text-align: center;
  border-color: var(--border_color);
}

.invoices__wrapper :deep(.ant-radio-button-wrapper-checked) {
  border-color: var(--main);
}

.invoices__wrapper :deep(.ant-radio-button-wrapper:not(:first-child)::before) {
  background-color: var(--border_color);
}

/* .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled){
  border-top:none;
} */
/*
.invoices__wrapper  .card-container {
  overflow: hidden;

}
.invoices__wrapper .card-container > .ant-tabs-card > .ant-tabs-content {
  margin-top: -16px;
  padding: 0 10px;
}

.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-content > .ant-tabs-tabpane {
  margin-bottom: 20px;
}

.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar {
  background-color: var(--bright_font);
  border-bottom: 0;
  margin: 0 10px 20px;
}
.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
  border-color: transparent;
  background: transparent;
  margin-right: 0;
  border: 0;
  width: 374px;
  text-align: center;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 0;
}
.invoices__wrapper .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-left: 0;
}
.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border-right:1px solid #40a9ff;
;
}

.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab-active {
  background: var(--bright_font);
  border-left: 1px solid #40a9ff ;
  border-right: 1px solid #40a9ff ;
  border-bottom: 1px solid #40a9ff ;
}

@media screen and (max-width: 576px) {
  .invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
    width: 240px;
  }
}

@media screen and (max-width: 420px) {
 .invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
    width: 180px;
  }
} */
</style>
