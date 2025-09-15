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

    <a-space class="date_filter">
      <a-button
        type="primary"
        :ghost="activeFilter !== 'lastMonth'"
        @click="setQuickFilter('lastMonth')"
      >
        {{ t("invoices.reports.last_month") }}
      </a-button>

      <a-button
        type="primary"
        :ghost="activeFilter !== 'currentMonth'"
        @click="setQuickFilter('currentMonth')"
      >
        {{ t("invoices.reports.current_month") }}
      </a-button>

      <a-button
        type="primary"
        :ghost="activeFilter !== 'currentYear'"
        @click="setQuickFilter('currentYear')"
      >
        {{ t("invoices.reports.current_year") }}
      </a-button>

      <a-range-picker
        v-model:value="dateRange"
        @change="applyDateRange"
        format="YYYY-MM-DD"
        style="width: 100%"
        :disabled-date="disableFutureDates"
      />
    </a-space>

    <a-space class="instances_filter" wrap>
      <a-button
        v-for="(instance, index) in allInstances"
        :key="instance.uuid"
        class="checkable-tag"
        :type="selectedInstances[index] ? 'primary' : 'default'"
        @click="selectedInstances[index] = !selectedInstances[index]"
      >
        <div style="display: flex; align-items: center; gap: 8px">
          {{ instance.title }}

          <plusIcon class="icon" v-if="!selectedInstances[index]" />
          <minusIcon class="icon" v-else />
        </div>
      </a-button>
    </a-space>

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
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import { useCurrency } from "@/hooks/utils";
import { marked } from "marked";
import { useI18n } from "vue-i18n";

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);
const minusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseCircleOutlined")
);

const instancesStore = useInstancesStore();
const { allInstances } = storeToRefs(instancesStore);

const { currency } = useCurrency();
const {t} = useI18n();

const selectedInstances = ref([]);

const dateRange = ref([null, null]);
const activeFilter = ref(null);

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

onMounted(() => {
  setQuickFilter("currentMonth");

  selectedInstances.value = new Array(allInstances.value.length).fill(true);
});

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
      return selectedInstances.value[instanceIndex];
    });
});

function setQuickFilter(filter) {
  const now = dayjs();
  const yesterday = now.subtract(1, "day");

  switch (filter) {
    case "currentMonth":
      dateRange.value = [now.startOf("month"), yesterday];
      break;
    case "lastMonth":
      dateRange.value = [
        now.subtract(1, "month").startOf("month"),
        now.subtract(1, "month").endOf("month"),
      ];
      break;
    case "currentYear":
      dateRange.value = [now.startOf("year"), yesterday];
      break;
  }

  activeFilter.value = filter;
}

function applyDateRange(dates) {
  if (dates) {
    console.log(
      "Selected range:",
      dates[0].format("YYYY-MM-DD"),
      dates[1].format("YYYY-MM-DD")
    );

    activeFilter.value = null;
  }
}

watch(allInstances, (newInstances) => {
  selectedInstances.value = new Array(newInstances.length).fill(true);
});

function disableFutureDates(current) {
  const now = dayjs();
  const yesterday = now.subtract(1, "day");

  return current && current > yesterday;
}
</script>

<style scoped lang="scss">
.reports {
  .instruction {
    margin: 10px 0px;
    font-size: 1rem;
    border: dashed 0.2rem var(--main);
  }

  .date_filter {
    width: 100%;

    & > :last-child {
      width: 100%;
    }
  }

  .instances_filter {
    width: 100%;

    .checkable-tag {
      cursor: pointer;
      user-select: none;

      .icon {
        font-size: 18px;
      }
    }
  }
}
</style>
