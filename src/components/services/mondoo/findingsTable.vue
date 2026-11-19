<template>
  <a-table
    :columns="columns"
    :data-source="items"
    :loading="loading"
    :pagination="pagination"
    :row-key="(row) => row.asset + row.mrn"
    size="small"
    :scroll="{ x: 640 }"
    @change="({ current }) => (page = current)"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'rating'">
        <a-tag :color="ratingColor(record.rating)">
          {{ $t(`mondoo.rating.${record.rating}`) }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'last_updated'">
        {{ shortDate(record.last_updated) }}
      </template>
    </template>
  </a-table>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import api from "@/api.js";
import { ratingColor, shortDate } from "./shared.js";

const props = defineProps({
  uuid: { type: String, required: true },
  rating: { type: String, default: "" },
  state: { type: String, default: "" },
  // Limits the list to one domain namespace; all of them when empty.
  namespace: { type: String, default: "" },
  pageSize: { type: Number, default: 10 },
  // Changing it reloads the current page.
  refreshKey: { type: Number, default: 0 },
});
const emit = defineEmits(["total"]);

const { t } = useI18n();

const page = ref(1);
const loading = ref(false);
const items = ref([]);
const total = ref(0);

const columns = computed(() => [
  { title: t("mondoo.columns.rating"), key: "rating", width: 110 },
  { title: t("mondoo.columns.finding"), dataIndex: "title", key: "title" },
  { title: t("mondoo.columns.host"), dataIndex: "asset_name", key: "asset_name" },
  { title: t("mondoo.columns.updated"), key: "last_updated", width: 110 },
]);

const pagination = computed(() => ({
  current: page.value,
  pageSize: props.pageSize,
  total: total.value,
  showSizeChanger: false,
  hideOnSinglePage: true,
}));

async function load() {
  loading.value = true;
  try {
    const { meta = {} } = await api.instances.action({
      uuid: props.uuid,
      action: "findings",
      params: {
        limit: props.pageSize,
        offset: (page.value - 1) * props.pageSize,
        ...(props.rating && { rating: props.rating }),
        ...(props.state && { state: props.state }),
        ...(props.namespace && { namespace: props.namespace }),
      },
    });

    items.value = meta.items ?? [];
    total.value = +meta.total || 0;
    emit("total", total.value);
  } catch (error) {
    message.error(error.response?.data?.message ?? error.message ?? error);
  } finally {
    loading.value = false;
  }
}

watch(page, load);
watch(() => props.refreshKey, load);
watch(
  () => [props.rating, props.state, props.namespace],
  () => {
    if (page.value !== 1) page.value = 1;
    else load();
  }
);

onMounted(load);
</script>

<script>
export default { name: "MondooFindingsTable" };
</script>
