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
      show-keys
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
      <template #bodyCell="{ column, text, record }">
        <template v-if="column.dataIndex === 'title'">
          <span :class="{ 'muted-row': record.muted }">{{ text }}</span>
          <a-tag v-if="record.deleted" class="deleted-tag">
            {{ t("invoices.reports.deleted") }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'amount'">
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
import { computed, onMounted, ref } from "vue";
import { useApiKeysStore } from "@/stores/apiKeys.js";
import { useCurrency } from "@/hooks/utils";
import { marked } from "marked";
import { useI18n } from "vue-i18n";
import BillingFilters from "./billingFilters.vue";
import api from "@/api";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import { debounce, isInstanceDeleted } from "@/functions";

const authStore = useAuthStore();
const instancesStore = useInstancesStore();
const { allInstances } = storeToRefs(instancesStore);
const { currency, formatPrice } = useCurrency();
const { t } = useI18n();
const statisticsData = ref(null);
const isStatisticsDataLoading = ref(false);

const lastParams = ref("");

const apiKeys = useApiKeysStore();

const filterData = ref({
  dateRange: [null, null],
  selectedInstances: [],
  activeFilter: null,
  showAll: false,
  groupBy: "services",
  selectedKeys: [],
});

// "services" splits the spend by the services charged, "keys" by the API keys it was made with.
const groupBy = computed(() => filterData.value.groupBy ?? "services");

const columns = computed(() => [
  {
    title:
      groupBy.value === "keys"
        ? t("invoices.reports.key")
        : t("invoices.reports.service"),
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

// A row for what the breakdown leaves out, so the rows always add up to everything charged.
const restRow = (rows, title, summary) => {
  const rest =
    Number(summary.revenue ?? 0) -
    rows.reduce((acc, row) => acc + Number(row.amount ?? 0), 0);
  return rest > 0.005 ? [{ title, amount: rest, uuid: "rest", muted: true }] : [];
};

const serviceRows = (summary) =>
  // Every charged service stays in the list and in the total, even one we know nothing about.
  Object.entries(summary.revenue_by_service ?? {}).map(([key, amount]) => {
    const instance = allInstances.value.find((inst) => inst.uuid === key);
    return {
      title:
        instance?.title ??
        `${t("invoices.reports.deleted_service")} (${key.split("-")[0]})`,
      deleted: !instance || isInstanceDeleted(instance),
      amount,
      uuid: key,
    };
  });

const keyRows = (summary) =>
  Object.entries(summary.revenue_by_key ?? {})
    .map(([id, amount]) => {
      return {
        title: apiKeys.name(id, t("invoices.reports.unknown_key")),
        deleted: apiKeys.isDeleted(id),
        amount,
        uuid: id,
      };
    })
    .sort((a, b) => b.amount - a.amount);

const reports = computed(() => {
  const summary = statisticsData.value?.summary;
  if (!summary) {
    return [];
  }
  const byKeys = groupBy.value === "keys";
  const rows = byKeys ? keyRows(summary) : serviceRows(summary);
  const rest = restRow(
    rows,
    t(byKeys ? "invoices.reports.without_key" : "invoices.reports.without_service"),
    summary
  );

  return [
    ...rows,
    ...rest,
    {
      title: t("invoices.reports.total"),
      amount: Number(summary.revenue ?? 0),
      uuid: "total",
    },
  ];
});

onMounted(apiKeys.fetch);

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
      keys: (groupBy.value !== "keys" || filterData.value.showAll
        ? []
        : filterData.value.selectedKeys ?? []
      )
        .map((key) => "keys=" + encodeURIComponent(key))
        .join("&"),
      services: (groupBy.value === "keys" ||
      filterData.value.showAll ||
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
      }${params.keys.length ? "&" + params.keys : ""}`
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

  .deleted-tag {
    margin-left: 8px;
  }

  .muted-row {
    color: var(--gray, #8c8c8c);
  }
}
</style>
