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

    <!-- Instances Filter -->
    <a-space v-if="showInstancesFilter" class="instances-filter" wrap>
      <a-button
        v-for="(instance, index) in allInstances"
        :key="instance.uuid"
        class="instance-tag"
        :type="selectedInstances[index] ? 'primary' : 'default'"
        @click="toggleInstance(index)"
      >
        <div class="instance-content">
          {{ instance.title }}
          <plus-icon v-if="!selectedInstances[index]" class="icon" />
          <minus-icon v-else class="icon" />
        </div>
      </a-button>
    </a-space>
  </a-space>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);
const minusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseCircleOutlined")
);

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
});

const emit = defineEmits(["update:modelValue", "filter-change"]);

const instancesStore = useInstancesStore();
const { allInstances } = storeToRefs(instancesStore);
const { t } = useI18n();

const dateRange = ref(props.modelValue.dateRange || [null, null]);
const activeFilter = ref(props.modelValue.activeFilter || null);
const selectedInstances = ref(props.modelValue.selectedInstances || []);
const showAll = ref(props.modelValue.showAll || false);

const filterData = computed(() => ({
  dateRange: dateRange.value,
  selectedInstances: selectedInstances.value,
  activeFilter: activeFilter.value,
  showAll: showAll.value,
  selectedInstancesData: selectedInstances.value
    .map((selected, index) => (selected ? allInstances.value[index] : null))
    .filter(Boolean),
}));

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
  emitChange();
}

function applyDateRange(dates) {
  dateRange.value = dates || [null, null];
  activeFilter.value = null;
  emitChange();
}

function toggleInstance(index) {
  selectedInstances.value[index] = !selectedInstances.value[index];
  emitChange();
}

function disableFutureDates(current) {
  const now = dayjs();
  const yesterday = now.subtract(1, "day");
  return current && current > yesterday;
}

function emitChange() {
  const data = filterData.value;
  emit("update:modelValue", data);
  emit("filter-change", data);
}

function initializeInstances() {
  if (allInstances.value.length > 0 && selectedInstances.value.length === 0) {
    selectedInstances.value = new Array(allInstances.value.length).fill(true);
    emitChange();
  }
}

onMounted(() => {
  if (props.defaultFilter && !activeFilter.value) {
    setQuickFilter(props.defaultFilter);
  }
  initializeInstances();
});

watch(
  allInstances,
  (newInstances) => {
    if (newInstances.length > 0) {
      selectedInstances.value = new Array(newInstances.length).fill(true);
      emitChange();
    }
  },
  { immediate: true }
);

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
</style>
