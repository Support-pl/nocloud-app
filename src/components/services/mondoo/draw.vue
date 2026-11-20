<template>
  <div class="mondoo">
    <a-alert
      v-if="trialActive"
      type="success"
      show-icon
      :message="$t('mondoo.trial until', { date: trialEnds })"
      class="mondoo__alert"
    />
    <a-alert
      v-if="service.state?.state === 'SUSPENDED'"
      type="warning"
      show-icon
      :message="$t('mondoo.suspended')"
      class="mondoo__alert"
    />

    <a-alert
      v-if="scanInfo.error"
      type="warning"
      show-icon
      :message="$t('mondoo.scan failed')"
      :description="scanInfo.error"
      class="mondoo__alert"
    />

    <a-alert
      v-if="fix.status"
      :type="fixAlert"
      show-icon
      :message="$t(`mondoo.fix.status.${fix.status}`, { title: fix.title })"
      :description="fix.error"
      class="mondoo__alert"
    />

    <a-row :gutter="[12, 12]">
      <a-col :xs="12" :sm="6">
        <div class="stat">
          <div class="stat__value">{{ summary.assets ?? "-" }}</div>
          <div class="stat__label">{{ $t("mondoo.hosts") }}</div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="6">
        <div class="stat">
          <div class="stat__value">{{ summary.findings ?? "-" }}</div>
          <div class="stat__label">{{ $t("mondoo.open findings") }}</div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="6">
        <div class="stat">
          <div class="stat__value" :style="{ color: gradeColor(worst?.grade) }">
            {{ worst?.grade ?? "-" }}
          </div>
          <div class="stat__label">
            {{ $t("mondoo.grade") }}
            <template v-if="worst?.score !== undefined">({{ worst.score }}/100)</template>
          </div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="6">
        <div class="stat">
          <div class="stat__value stat__value--small">{{ syncedAt }}</div>
          <div class="stat__label">{{ $t("mondoo.last sync") }}</div>
        </div>
      </a-col>
    </a-row>

    <div class="mondoo__ratings">
      <a-tag
        v-for="rating in ratings"
        :key="rating.key"
        :color="rating.color"
        class="mondoo__rating"
        :class="{ 'mondoo__rating--dim': !byRating[rating.key] }"
        @click="filterRating(rating.key)"
      >
        {{ $t(`mondoo.rating.${rating.key}`) }}: {{ byRating[rating.key] ?? 0 }}
      </a-tag>
    </div>

    <div v-if="namespaces.length" class="mondoo__namespaces">
      <a-tag v-for="ns in namespaces" :key="ns.name">
        {{ ns.name }}
        <template v-if="ns.grade"> · {{ ns.grade }}</template>
        <template v-if="ns.configured === false"> · {{ $t("mondoo.discovered") }}</template>
      </a-tag>
    </div>

    <a-empty
      v-if="!summary.synced_at"
      :description="$t('mondoo.first scan pending')"
      class="mondoo__empty"
    />

    <template v-else>
      <div class="mondoo__toolbar">
        <a-radio-group v-model:value="tab" button-style="solid">
          <a-radio-button value="findings">
            {{ $t("mondoo.findings") }} ({{ findings.total }})
          </a-radio-button>
          <a-radio-button value="assets">
            {{ $t("mondoo.assets") }} ({{ assets.total }})
          </a-radio-button>
        </a-radio-group>

        <template v-if="tab === 'findings'">
          <a-select v-model:value="filter.rating" style="width: 140px">
            <a-select-option value="">{{ $t("mondoo.any rating") }}</a-select-option>
            <a-select-option v-for="rating in ratings" :key="rating.key" :value="rating.key">
              {{ $t(`mondoo.rating.${rating.key}`) }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="filter.state" style="width: 140px">
            <a-select-option value="">{{ $t("mondoo.state.open") }}</a-select-option>
            <a-select-option value="CLOSED">{{ $t("mondoo.state.passing") }}</a-select-option>
            <a-select-option value="ALL">{{ $t("mondoo.state.all") }}</a-select-option>
          </a-select>
          <a-input-search
            v-model:value="searchText"
            allow-clear
            :placeholder="$t('mondoo.search')"
            style="width: 200px"
          />
          <a-select
            v-if="namespaces.length > 1"
            v-model:value="filter.namespace"
            style="width: 190px"
          >
            <a-select-option value="">{{ $t("mondoo.all domains") }}</a-select-option>
            <a-select-option v-for="ns in namespaces" :key="ns.name" :value="ns.name">
              {{ ns.name }}
            </a-select-option>
          </a-select>
        </template>

        <a-button
          v-if="canScan"
          :loading="scanning"
          style="margin-left: auto"
          @click="scan"
        >
          {{ $t("mondoo.scan now") }}
        </a-button>
      </div>

      <mondoo-findings-table
        v-if="tab === 'findings'"
        :uuid="service.uuid"
        :rating="filter.rating"
        :state="filter.state"
        :namespace="filter.namespace"
        :search="filter.search"
        :page-size="pageSize"
        :refresh-key="refreshKey"
        @total="findings.total = $event"
        @fix="watchFix"
      />

      <a-table
        v-else
        :columns="assetColumns"
        :data-source="assets.items"
        :loading="loading"
        :pagination="pagination"
        row-key="mrn"
        size="small"
        :scroll="{ x: 560 }"
        @change="changePage"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'grade'">
            <span v-if="record.grade" :style="{ color: gradeColor(record.grade), fontWeight: 700 }">
              {{ record.grade }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'updated_at'">
            {{ shortDate(record.updated_at) }}
          </template>
        </template>
      </a-table>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import api from "@/api.js";
import MondooFindingsTable from "./findingsTable.vue";
import { gradeColor, ratings, shortDate } from "./shared.js";

const props = defineProps({
  service: { type: Object, required: true },
});

const { t } = useI18n();
const pageSize = 10;

const tab = ref("findings");
const page = ref(1);
const loading = ref(false);
const scanning = ref(false);
const findings = reactive({ total: 0 });
const assets = reactive({ items: [], total: 0 });
const refreshKey = ref(0);
const filter = reactive({ rating: "", state: "", namespace: "", search: "" });
// Typing must not fire a request per key.
const searchText = ref("");
let searchTimer;
watch(searchText, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => (filter.search = (value ?? "").trim()), 350);
});

const data = computed(() => props.service.data ?? {});
// The copy in instance data is refreshed by the driver's monitoring pass and
// can lag a sync; ask the driver directly and fall back to the copy.
const liveSummary = ref(null);
const summary = computed(() => liveSummary.value ?? data.value.summary ?? {});
const byRating = computed(() => summary.value.findings_by_rating ?? {});
const namespaces = computed(() => summary.value.namespaces ?? []);
// An SSH scan has one machine and no domains; its grade comes with the summary.
const scanInfo = computed(() => summary.value.scan ?? {});
// The last fix run on the server, and whether it is still under way.
const fix = computed(() => summary.value.remediation ?? {});
const fixActive = computed(() => ["requested", "running"].includes(fix.value.status));
const fixAlert = computed(
  () => ({ done: "success", failed: "error" })[fix.value.status] ?? "info"
);

// After a fix is requested, follow it: its status first, then the scan that
// comes after it, and reload the findings once that scan is in.
let fixTimer;
function watchFix() {
  clearInterval(fixTimer);
  let ticks = 0;
  fixTimer = setInterval(async () => {
    await loadCounts();
    const rescanned = +scanInfo.value.finished_at >= +fix.value.finished_at;
    if (++ticks > 72 || (!fixActive.value && fix.value.finished_at && rescanned)) {
      clearInterval(fixTimer);
      refreshKey.value++;
    }
  }, 5000);
}
onBeforeUnmount(() => clearInterval(fixTimer));
const worst = computed(() => {
  if (summary.value.grade) {
    return { grade: summary.value.grade, score: summary.value.score };
  }
  return [...namespaces.value]
    .filter((ns) => ns.grade)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
});

const formatTs = (seconds) =>
  seconds ? new Date(seconds * 1000).toLocaleString() : "";
const syncedAt = computed(() => formatTs(+summary.value.synced_at) || "-");
const trialEnds = computed(() => formatTs(+props.service.config?.trial_ends));
const trialActive = computed(
  () => +props.service.config?.trial_ends * 1000 > Date.now()
);
// An imported integration is read-only for the driver.
const canScan = computed(
  () => !data.value.imported && props.service.state?.state === "RUNNING"
);

const assetColumns = computed(() => [
  { title: t("mondoo.columns.host"), dataIndex: "name", key: "name" },
  { title: t("mondoo.columns.grade"), key: "grade", width: 80 },
  { title: t("mondoo.columns.type"), dataIndex: "platform", key: "platform" },
  { title: t("mondoo.columns.updated"), key: "updated_at", width: 110 },
]);

const pagination = computed(() => ({
  current: page.value,
  pageSize,
  total: assets.total,
  showSizeChanger: false,
  hideOnSinglePage: true,
}));

async function invoke(action, params) {
  const { meta } = await api.instances.action({
    uuid: props.service.uuid,
    action,
    params,
  });

  return meta ?? {};
}

// The hosts page; findings tables load themselves.
async function load() {
  if (!props.service.uuid || tab.value !== "assets") return;

  loading.value = true;
  try {
    const meta = await invoke("assets", {
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
    });

    assets.items = meta.items ?? [];
    assets.total = +meta.total || 0;
  } catch (error) {
    message.error(error.response?.data?.message ?? error.message ?? error);
  } finally {
    loading.value = false;
  }
}

async function loadCounts() {
  try {
    const [meta, live] = await Promise.all([
      invoke("assets", { limit: 1 }),
      invoke("summary"),
    ]);

    assets.total = +meta.total || 0;
    liveSummary.value = live;
  } catch {
    // the table's own load reports errors
  }
}

function changePage({ current }) {
  page.value = current;
}

function filterRating(rating) {
  tab.value = "findings";
  filter.rating = filter.rating === rating ? "" : rating;
}

async function scan() {
  scanning.value = true;
  try {
    await invoke("scan");
    message.success(t("mondoo.scan started"));
    loadCounts();
    refreshKey.value++;
  } catch (error) {
    message.error(error.response?.data?.message ?? error.message ?? error);
  } finally {
    scanning.value = false;
  }
}

watch(tab, () => {
  if (page.value !== 1) page.value = 1;
  else load();
});
watch(page, load);
onMounted(loadCounts);
</script>

<script>
export default { name: "MondooDraw" };
</script>

<style scoped>
.mondoo {
  width: 100%;
}

.mondoo__alert {
  margin-bottom: 12px;
}

.stat {
  height: 100%;
  padding: 12px;
  border: 1px solid var(--border_color, #e5e5e5);
  border-radius: 12px;
  text-align: center;
}

.stat__value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat__value--small {
  font-size: 1rem;
  line-height: 2.16rem;
}

.stat__label {
  color: var(--gray);
}

.mondoo__ratings,
.mondoo__namespaces {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.mondoo__rating {
  cursor: pointer;
}

.mondoo__rating--dim {
  opacity: 0.45;
}

.mondoo__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 16px 0 10px;
}

.mondoo__empty {
  margin-top: 24px;
}
</style>
