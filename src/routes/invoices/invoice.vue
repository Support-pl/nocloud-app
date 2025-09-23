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

            <div style="margin-bottom: 20px">
              <billing-filters
                :show-instances-filter="false"
                v-model="invoicesFilterData"
              />
            </div>

            <invoice-item
              v-for="(invoice, index) in currentInvoices"
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
          :page-size="transactionsPageSize"
          :total="transactionsTotalSize"
          :current="transactionsCurrentPage"
          @show-size-change="transactionsOnShowSizeChange"
          @change="transactionsOnShowSizeChange"
        />

        <a-pagination
          v-if="currentTab === 'Invoice'"
          show-size-changer
          style="width: fit-content; margin-left: auto"
          :page-size-options="pageSizeOptions"
          :page-size="invoicesPageSize"
          :total="invoicesTotalSize"
          :current="invoicesCurrentPage"
          @show-size-change="invoicesOnShowSizeChange"
          @change="invoicesOnShowSizeChange"
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
import BillingFilters from "@/components/invoice/billingFilters.vue";
import dayjs from "dayjs";

const authStore = useAuthStore();
const { userdata } = storeToRefs(authStore);
const invoicesStore = useInvoicesStore();
const { getInvoices: invoices } = storeToRefs(invoicesStore);
const transactionsStore = useTransactionsStore();
const instancesStore = useInstancesStore();
const { getInstances: instances } = storeToRefs(instancesStore);
const chatsStore = useChatsStore();
const { openNotification } = useNotification();
const router = useRouter();
const route = useRoute();
const pageSizeOptions = ref(["5", "10", "25", "50", "100"]);

const currentTab = ref("Invoice");
const percent = ref(0);

const wrapper = ref(null);
const loading = ref(null);

const transactions = computed(() => {
  const result = transactionsStore.filteredTransactions;

  result.sort((a, b) => b.exec - a.exec);
  return result;
});

const transactionsCurrentPage = computed(() => transactionsStore.page);
const transactionsPageSize = computed(() => transactionsStore.size);
const transactionsTotalSize = computed(() => transactionsStore.total);

const invoicesTotalSize = computed(() => filtredInvoices.value?.length || 0);
const invoicesCurrentPage = ref(1);
const invoicesPageSize = ref(10);
const invoicesFilterData = ref({
  dateRange: [null, null],
  selectedInstances: [],
  activeFilter: null,
  showAll: false,
});

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

const filtredInvoices = computed(() => {
  if (invoicesFilterData.value.showAll) {
    return invoices.value;
  }

  return invoices.value.filter((invoice) => {
    const { dateRange } = invoicesFilterData.value;
    let pass = true;

    if (dateRange?.[0] && dateRange?.[1]) {
      const invoiceDate = dayjs(invoice.created);

      pass =
        pass &&
        invoiceDate.isAfter(dayjs(dateRange[0]).subtract(1, "day")) &&
        invoiceDate.isBefore(dayjs(dateRange[1]).add(1, "day"));
    }

    return pass;
  });
});

const currentInvoices = computed(() => {
  if (!filtredInvoices.value) return [];
  const start = (invoicesCurrentPage.value - 1) * invoicesPageSize.value;
  const end = start + invoicesPageSize.value;

  return filtredInvoices.value.slice(start, end);
});

watch(currentTab, () => {
  transactionsStore.tab = currentTab.value;

  router.push({ query: { tab: currentTab.value } });

  if (currentTab.value === "Invoice") return;
  if (transactions.value?.length > 0) return;
  if (!userdata.value.uuid) return;

  transactionsStore.fetch({
    account: userdata.value.uuid,
    page: transactionsCurrentPage.value,
    limit: transactionsPageSize.value,
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
    page: transactionsCurrentPage.value,
    limit: transactionsPageSize.value,
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
  const keys = {
    transactionsPagination: transactionsOnShowSizeChange,
    invoicesPagination: invoicesOnShowSizeChange,
  };
  Object.keys(keys).forEach((key) => {
    const pagination = localStorage.getItem(key);

    if (!pagination) return;
    const { page, limit } = JSON.parse(pagination);

    keys[key](page, limit);
  });
}

function transactionsOnShowSizeChange(page, limit) {
  if (page !== transactionsCurrentPage.value) {
    transactionsStore.page = page;
  }
  if (limit !== transactionsPageSize.value) {
    transactionsStore.size = limit;
  }

  localStorage.setItem(
    "transactionsPagination",
    JSON.stringify({ page, limit })
  );
}

function invoicesOnShowSizeChange(page, limit) {
  invoicesCurrentPage.value = page;
  invoicesPageSize.value = limit;

  localStorage.setItem("invoicesPagination", JSON.stringify({ page, limit }));
}

async function fetchInstances() {
  if (instancesStore.allInstances?.length > 0) return;
  try {
    await instancesStore.fetchAll();
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message });
  }
}

watch(
  [transactionsCurrentPage, transactionsPageSize],
  () => {
    transactionsStore.fetch({
      page: transactionsCurrentPage.value,
      limit: transactionsPageSize.value,
      account: userdata.value.uuid,
      field: "exec",
      sort: "desc",
      type: "transaction",
    });
  },
  { deep: true }
);

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
