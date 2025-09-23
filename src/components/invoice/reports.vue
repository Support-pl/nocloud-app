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
      v-model="filterData"
      :show-instances-filter="true"
      default-filter="currentMonth"
      @filter-change="onFilterChange"
    />

    <a-table
      :columns="columns"
      :data-source="reports"
      row-key="uuid"
      bordered
      :pagination="false"
      style="margin-top: 16px"
    >
      <template #bodyCell="{ column, text }">
        <template v-if="column.dataIndex === 'amount'">
          {{ text }} {{ currency.title }}
        </template>
      </template>

      <template #footer>
        <div style="display: flex; justify-content: end">
          <a-button>{{ t("invoices.reports.download_full_report") }}</a-button>
        </div>
      </template>
    </a-table>
  </a-space>
</template>

<script setup>
import { computed, ref } from "vue";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import { useCurrency } from "@/hooks/utils";
import { marked } from "marked";
import { useI18n } from "vue-i18n";
import BillingFilters from "./billingFilters.vue";

const instancesStore = useInstancesStore();
const { allInstances } = storeToRefs(instancesStore);
const { currency } = useCurrency();
const { t } = useI18n();

const filterData = ref({
  dateRange: [null, null],
  selectedInstances: [],
  activeFilter: null,
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

const reports = computed(() => {
  return allInstances.value
    .map((instance) => ({
      uuid: instance.uuid,
      title: instance.title,
      amount: (Math.random() * 1000).toFixed(2),
    }))
    .filter((item) => {
      const instanceIndex = allInstances.value.findIndex(
        (inst) => inst.uuid === item.uuid
      );
      return filterData.value.selectedInstances[instanceIndex];
    });
});

function onFilterChange(data) {
  console.log('Filter changed:', data);
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
