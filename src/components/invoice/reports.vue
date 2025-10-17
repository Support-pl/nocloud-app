<template>
  <a-space
    class="reports"
    direction="vertical"
    size="middle"
    style="width: 100%; gap: 8px"
  >
    <a-card class="instruction">
      <div v-html="marked(t('invoices.reports.instruction'))"></div>
    </a-card>

    <billing-filters
      today-maximum
      v-model="filterData"
      :show-instances-filter="true"
      default-filter="currentMonth"
      @filter-change="onFilterChange"
    />

    <a-table
      size="small"
      :columns="columns"
      :data-source="reports"
      row-key="uuid"
      bordered
      :pagination="false"
      style="margin-top: 16px"
      :loading="isStatisticsDataLoading"
    >
      <template #bodyCell="{ column, text }">
        <template v-if="column.dataIndex === 'amount'">
          {{ formatPrice(text) }} {{ currency.title }}
        </template>
      </template>
    </a-table>
  </a-space>
</template>

<!-- <template #footer>
        <div style="display: flex; justify-content: end">
          <a-button>{{ t("invoices.reports.download_full_report") }}</a-button>
        </div>
      </template> -->

<script setup>
import { computed, ref } from "vue";
import { useCurrency } from "@/hooks/utils";
import { marked } from "marked";
import { useI18n } from "vue-i18n";
import BillingFilters from "./billingFilters.vue";
import api from "@/api";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import { debounce } from "@/functions";

const authStore = useAuthStore();
const instancesStore = useInstancesStore();
const { allInstances } = storeToRefs(instancesStore);
const { currency, formatPrice } = useCurrency();
const { t } = useI18n();
const statisticsData = ref(null);
const isStatisticsDataLoading = ref(false);

const lastParams = ref("");

const filterData = ref({
  dateRange: [null, null],
  selectedInstances: [],
  activeFilter: null,
  showAll: false,
});

const columns = computed(() => [
  {
    title: t("invoices.reports.service"),
    dataIndex: "title",
    key: "title",
  },
  {
    title: t("invoices.reports.amount"),
    dataIndex: "amount",
    key: "amount",
    scopedSlots: { customRender: "amount" },
  },
]);

const aliveInstances = computed(() => allInstances.value);

const reports = computed(() => {
  if (
    statisticsData.value === null ||
    statisticsData.value.summary === undefined ||
    statisticsData.value.summary.revenue_by_service === undefined
  ) {
    return [];
  }
  const reports = Object.keys(statisticsData.value.summary.revenue_by_service)
    .map((key) => ({
      title: aliveInstances.value.find((instance) => instance.uuid === key)
        ?.title,
      amount: statisticsData.value.summary.revenue_by_service[key],
      uuid: key,
    }))
    .filter((report) => report.title);

  reports.push({
    title: t("invoices.reports.total"),
    amount: reports.reduce((acc, report) => acc + report.amount, 0),
    uuid: "total",
  });

  return reports;
});

const fetchStatistics = async () => {
  try {
    isStatisticsDataLoading.value = true;

    if (!filterData.value.dateRange[0] || !filterData.value.dateRange[1]) {
      return;
    }

    const to = dayjs(filterData.value.dateRange[1]).format("YYYY-MM-DD");
    const from = dayjs(filterData.value.dateRange[0]).format("YYYY-MM-DD");

    const params = {
      start_date: from,
      end_date: to,
      accounts: [authStore.userdata.uuid]
        .map((account) => "accounts=" + account)
        .join("&"),
      with_details: true,
      services: (filterData.value.showAll ||
      filterData.value.selectedInstances.length == 0
        ? []
        : filterData.value.selectedInstances
      )
        .map((instance) => "services=" + instance)
        .join("&"),
    };

    if (lastParams.value === JSON.stringify(params)) {
      return;
    }

    const response = await api.get(
      `statistic/reports?start_date=${params.start_date}&end_date=${
        params.end_date
      }&${params.accounts}${
        params.services.length ? "&" + params.services : ""
      }`
    );

    statisticsData.value = response;
    lastParams.value = JSON.stringify(params);
  } finally {
    isStatisticsDataLoading.value = false;
  }
};

const fetchStatisticsDebounced = debounce(fetchStatistics, 500);

function onFilterChange() {
  isStatisticsDataLoading.value = true;
  fetchStatisticsDebounced();
}
</script>

<style scoped lang="scss">
.reports {
  .instruction {
    margin: 10px 0px;
    font-size: 1rem;
    border: dashed 0.2rem var(--main);
  }
}
</style>
