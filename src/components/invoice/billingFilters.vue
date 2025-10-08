<template>
  <a-space class="billing-filters" direction="vertical" size="small">
    <!-- Date Filter -->
    <a-space class="date-filter" wrap>
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
        style="min-width: 230px; max-width: 230px"
        v-model:value="dateRange"
        @change="applyDateRange"
        format="YYYY-MM-DD"
        :disabled-date="disableFutureDates"
        class="date-picker"
      />

      <a-checkbox v-model:checked="showAll">
        {{ t("invoices.reports.show_all") }}
      </a-checkbox>
    </a-space>

    <a-space v-if="showInstancesFilter" class="instances-filter" wrap>
      <instance-tags
        v-model="selectedInstances"
        :filter-mode="true"
        :max-visible="sortedInstances.length"
        @selection-change="emitChange"
        :max-length="25"
        size="normal"
      />
    </a-space>
  </a-space>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import InstanceTags from "./instanceTags.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      dateRange: [null, null],
      selectedInstances: [],
      activeFilter: null,
      showAll: false,
    }),
  },
  showInstancesFilter: {
    type: Boolean,
    default: true,
  },
  defaultFilter: {
    type: String,
    default: "currentMonth",
  },
  topInstancesCount: {
    type: Number,
    default: 15,
  },
  todayMaximum: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "filter-change"]);

const instancesStore = useInstancesStore();
const { allInstances } = storeToRefs(instancesStore);
const { t } = useI18n();

const dateRange = ref(props.modelValue.dateRange || [null, null]);
const activeFilter = ref(props.modelValue.activeFilter || null);
const selectedInstances = ref(props.modelValue.selectedInstances || []);
const showAll = ref(props.modelValue.showAll || false);

const sortedInstances = computed(() => {
  return [...allInstances.value]
    .filter((instance) => instance?.state?.state !== "DELETED")
    .sort((a, b) => {
      const dateA = new Date(a.created || a.created_at || 0);
      const dateB = new Date(b.created || b.created_at || 0);
      return dateB - dateA;
    });
});

const filterData = computed(() => ({
  dateRange: dateRange.value,
  selectedInstances: selectedInstances.value,
  activeFilter: activeFilter.value,
  showAll: showAll.value,
  selectedInstancesData: allInstances.value.filter((instance) =>
    selectedInstances.value.includes(instance.uuid)
  ),
}));

function setQuickFilter(filter) {
  const now = dayjs();

  const yesterday = now.subtract(1, "day");
  const endOfMonth = now.add(1, "month").startOf("month");

  let endDate = endOfMonth;

  if (props.todayMaximum) {
    endDate = yesterday;
  }

  switch (filter) {
    case "currentMonth":
      dateRange.value = [now.startOf("month"), endDate];
      break;
    case "lastMonth":
      dateRange.value = [
        now.subtract(1, "month").startOf("month"),
        now.subtract(1, "month").endOf("month"),
      ];
      break;
    case "currentYear":
      dateRange.value = [now.startOf("year"), endDate];
      break;
  }

  activeFilter.value = filter;
  emitChange();
}

function applyDateRange(dates) {
  dateRange.value = dates || [null, null];
  activeFilter.value = null;
  emitChange();
}

function disableFutureDates(current) {
  const now = dayjs();
  if (props.todayMaximum) {
    const yesterday = now.subtract(1, "day");

    return current && current > yesterday;
  }
  const endOfMonth = now.add(1, "month").startOf("month");

  return current && current > endOfMonth;
}

function emitChange() {
  const data = filterData.value;
  emit("update:modelValue", data);
  emit("filter-change", data);
}

onMounted(() => {
  if (props.defaultFilter && !activeFilter.value) {
    setQuickFilter(props.defaultFilter);
  }
});

watch(showAll, () => {
  emitChange();
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      dateRange.value = newValue.dateRange || [null, null];
      activeFilter.value = newValue.activeFilter || null;
      selectedInstances.value = newValue.selectedInstances || [];
    }
  },
  { deep: true }
);

watch([dateRange, selectedInstances], () => {
  showAll.value = false;
});
</script>

<script>
export default { name: "BillingFilters" };
</script>

<style lang="scss" scoped>
.billing-filters {
  width: 100%;
}

.date-filter {
  width: 100%;
  align-items: center;

  .date-picker {
    flex: 1;
    min-width: 250px;
  }
}

.instances-filter {
  width: 100%;
}

.instance-tag {
  cursor: pointer;
  user-select: none;
}

.instance-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 18px;
}

.toggle-instances-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #d9d9d9);
  border-radius: 6px;
  background: var(--component-background, #ffffff);

  &:hover {
    border-color: var(--primary-color, #1890ff);
  }
}

.toggle-icon {
  font-size: 14px;
  color: var(--text-color, #000000d9);
}
</style>
