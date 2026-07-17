<template>
  <div class="sched">
    <div class="sched__top">
      <a-switch v-model:checked="enabled" @change="emitChange" />
      <span class="sched__enable-label">{{ t("bots.schedule.enable") }}</span>
    </div>

    <template v-if="enabled">
      <div class="sched__toolbar">
        <div class="sched__brush">
          <span class="sched__lbl">{{ t("bots.schedule.brush") }}</span>
          <div class="sched__segment">
            <button
              v-for="m in MODES"
              :key="m.key"
              type="button"
              class="sched__seg"
              :class="{ 'sched__seg--on': brush === m.key }"
              :style="brush === m.key ? { background: m.color, borderColor: m.color, color: '#fff' } : {}"
              @click="brush = m.key"
            >
              <span class="sched__swatch" :style="{ background: m.color }" />
              {{ t(`bots.schedule.mode.${m.key}`) }}
            </button>
          </div>
        </div>

        <div class="sched__tz">
          <span class="sched__lbl">{{ t("bots.schedule.timezone") }}</span>
          <a-select
            v-model:value="tz"
            show-search
            style="min-width: 220px"
            :options="tzOptions"
            @change="emitChange"
          />
        </div>
      </div>

      <div class="sched__bulk">
        <span class="sched__lbl">{{ t("bots.schedule.bulk") }}</span>
        <div class="sched__days">
          <button
            v-for="(day, i) in DAYS"
            :key="day"
            type="button"
            class="sched__daybtn"
            :class="{ 'sched__daybtn--on': bulk.days.includes(i + 1) }"
            @click="toggleBulkDay(i + 1)"
          >
            {{ t(`bots.schedule.days.${day}`) }}
          </button>
        </div>
        <div class="sched__bulk-row">
          <a-select v-model:value="bulk.from" :options="hoursFrom" style="width: 92px" />
          <span class="sched__dash">—</span>
          <a-select v-model:value="bulk.to" :options="hoursTo" style="width: 92px" />
          <a-select v-model:value="bulk.mode" :options="modeOptions" style="width: 130px" />
          <a-button type="primary" @click="applyBulk">
            {{ t("bots.schedule.apply") }}
          </a-button>
          <a-button :disabled="!dirty" @click="undoBulk">
            {{ t("Cancel") }}
          </a-button>
          <a-button danger ghost @click="resetGrid">
            {{ t("bots.schedule.reset") }}
          </a-button>
        </div>
      </div>

      <div class="sched__grid" @mouseleave="painting = false">
        <div class="sched__row sched__row--head">
          <div class="sched__day sched__day--head" />
          <button
            v-for="h in 24"
            :key="h"
            type="button"
            class="sched__hcol"
            :class="{ 'sched__hcol--now': nowPos.hour === h - 1 }"
            :title="t('bots.schedule.fill_col')"
            @click="paintCol(h - 1)"
          >
            {{ h - 1 }}
          </button>
        </div>

        <div v-for="(day, d) in DAYS" :key="d" class="sched__row">
          <button
            type="button"
            class="sched__day sched__day--btn"
            :class="{ 'sched__day--now': nowPos.day === d + 1 }"
            :title="t('bots.schedule.fill_row')"
            @click="paintRow(d)"
          >
            {{ t(`bots.schedule.days.${day}`) }}
          </button>
          <div
            v-for="h in 24"
            :key="h"
            class="sched__cell"
            :class="{ 'sched__cell--now': nowPos.day === d + 1 && nowPos.hour === h - 1 }"
            :style="{ background: colorOf(grid[d][h - 1]) }"
            :title="`${t(`bots.schedule.days.${day}`)} ${h - 1}:00 — ${cellLabel(grid[d][h - 1])}`"
            @mousedown.prevent="startPaint(d, h - 1)"
            @mouseenter="dragPaint(d, h - 1)"
          />
        </div>
      </div>

      <div class="sched__legend">
        <span v-for="m in MODES" :key="m.key" class="sched__legend-item">
          <span class="sched__swatch" :style="{ background: m.color }" />
          <b>{{ t(`bots.schedule.mode.${m.key}`) }}</b> —
          {{ t(`bots.schedule.mode_hint.${m.key}`) }}
        </span>
        <span class="sched__legend-hint">{{ t("bots.schedule.paint_hint") }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update:modelValue"]);

const MODES = [
  { key: "auto", color: "#52c41a" },
  { key: "review", color: "#faad14" },
  { key: "off", color: "#ff4d4f" },
];
// Mon..Sun -> resolver day index is arrayIndex + 1 (1=Mon..7=Sun).
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT_TZ = "Europe/Warsaw";
// Full IANA timezone list from the browser; fall back to a short list on old ones.
const TZ_LIST =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "Europe/Warsaw", "Europe/Minsk", "Europe/Moscow", "Asia/Tbilisi"];
const tzOptions = (TZ_LIST.includes("UTC") ? TZ_LIST : ["UTC", ...TZ_LIST]).map(
  (z) => ({ label: z, value: z })
);

const HOURS_FROM = Array.from({ length: 24 }, (_, h) => ({
  label: `${String(h).padStart(2, "0")}:00`,
  value: h,
}));
const HOURS_TO = Array.from({ length: 24 }, (_, i) => {
  const h = i + 1;
  return { label: h === 24 ? "24:00" : `${String(h).padStart(2, "0")}:00`, value: h };
});

const enabled = ref(false);
const tz = ref(DEFAULT_TZ);
const brush = ref("auto");
const painting = ref(false);
// grid[day 0..6][hour 0..23] = "off" | "review" | "auto"
const grid = ref(
  Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => "review"))
);

const colorOf = (mode) => MODES.find((m) => m.key === mode)?.color || "#f0f0f0";
const cellLabel = (mode) => t(`bots.schedule.mode.${mode}`);

// Quick multi-slot fill, e.g. Mon–Fri 08:00–18:00 set to auto.
const bulk = ref({ days: [1, 2, 3, 4, 5], from: 8, to: 18, mode: "auto" });
// Computed (not a const) so labels resolve reactively once i18n is ready.
const modeOptions = computed(() =>
  MODES.map((m) => ({ label: t(`bots.schedule.mode.${m.key}`), value: m.key }))
);
const hoursFrom = HOURS_FROM;
const hoursTo = HOURS_TO;

function toggleBulkDay(v) {
  const i = bulk.value.days.indexOf(v);
  if (i === -1) bulk.value.days.push(v);
  else bulk.value.days.splice(i, 1);
}

// The grid as it was when the editor opened, so "Cancel" reverts every edit
// back to the original saved state.
const initialGrid = ref(null);
const dirty = computed(
  () =>
    initialGrid.value &&
    JSON.stringify(grid.value) !== JSON.stringify(initialGrid.value)
);
function undoBulk() {
  if (!initialGrid.value) return;
  grid.value = initialGrid.value.map((row) => [...row]);
  emitChange();
}

function applyBulk() {
  if (bulk.value.from >= bulk.value.to) return;
  for (const day of bulk.value.days) {
    const d = day - 1;
    if (d < 0 || d > 6) continue;
    for (let h = bulk.value.from; h < bulk.value.to && h < 24; h++) {
      grid.value[d][h] = bulk.value.mode;
    }
  }
  emitChange();
}

function resetGrid() {
  grid.value = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => "review")
  );
  emitChange();
}

function paintRow(d) {
  for (let h = 0; h < 24; h++) grid.value[d][h] = brush.value;
  emitChange();
}
function paintCol(h) {
  for (let d = 0; d < 7; d++) grid.value[d][h] = brush.value;
  emitChange();
}

// "Now" marker in the schedule's own timezone, so the operator sees which cell
// is currently in effect. Ticks once a minute.
const nowTick = ref(0);
let nowTimer = null;
const WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const nowPos = computed(() => {
  nowTick.value; // dependency so the interval refreshes it
  try {
    const now = new Date();
    const hour =
      parseInt(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: tz.value || "UTC",
          hour: "2-digit",
          hour12: false,
        }).format(now),
        10
      ) % 24;
    const wd = new Intl.DateTimeFormat("en-US", {
      timeZone: tz.value || "UTC",
      weekday: "short",
    }).format(now);
    return { day: WD[wd] || 0, hour };
  } catch {
    return { day: 0, hour: -1 };
  }
});

function startPaint(d, h) {
  painting.value = true;
  grid.value[d][h] = brush.value;
  emitChange();
}
function dragPaint(d, h) {
  if (!painting.value) return;
  grid.value[d][h] = brush.value;
  emitChange();
}
function stopPaint() {
  painting.value = false;
}

const hhmm = (h) => `${String(h).padStart(2, "0")}:00`;

// grid -> schedule: pick the most common mode as default (fewest rules), then
// emit each day's runs that deviate from it.
function toSchedule() {
  const counts = { off: 0, review: 0, auto: 0 };
  for (const row of grid.value) for (const m of row) counts[m]++;
  let def = "review";
  let best = -1;
  for (const m of ["review", "auto", "off"]) {
    if (counts[m] > best) {
      best = counts[m];
      def = m;
    }
  }

  const rules = [];
  for (let d = 0; d < 7; d++) {
    let h = 0;
    while (h < 24) {
      const m = grid.value[d][h];
      if (m === def) {
        h++;
        continue;
      }
      const start = h;
      while (h < 24 && grid.value[d][h] === m) h++;
      rules.push({
        days: [d + 1],
        from: hhmm(start),
        to: h === 24 ? "24:00" : hhmm(h),
        mode: m,
      });
    }
  }
  return { enabled: enabled.value, tz: tz.value, default: def, rules };
}

function emitChange() {
  emit("update:modelValue", toSchedule());
}

// schedule -> internal grid (fill with default, then apply rules).
function fromSchedule(s) {
  enabled.value = !!s?.enabled;
  tz.value = s?.tz || DEFAULT_TZ;
  const def = s?.default || "review";
  grid.value = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => def)
  );
  for (const r of s?.rules || []) {
    const from = parseInt(r.from, 10) || 0;
    const to = r.to === "24:00" ? 24 : parseInt(r.to, 10) || 0;
    for (const day of r.days || []) {
      const d = day - 1;
      if (d < 0 || d > 6) continue;
      for (let h = from; h < to && h < 24; h++) grid.value[d][h] = r.mode;
    }
  }
  initialGrid.value = grid.value.map((row) => [...row]);
}

onMounted(() => {
  fromSchedule(props.modelValue);
  window.addEventListener("mouseup", stopPaint);
  nowTimer = setInterval(() => (nowTick.value = nowTick.value + 1), 60_000);
});
onBeforeUnmount(() => {
  window.removeEventListener("mouseup", stopPaint);
  if (nowTimer) clearInterval(nowTimer);
});
</script>

<style scoped>
.sched {
  user-select: none;
}
.sched__top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.sched__enable-label {
  font-weight: 500;
}
.sched__lbl {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  margin-right: 2px;
}
.sched__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #fafafa;
  margin-bottom: 12px;
}
.sched__tz,
.sched__brush {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sched__segment {
  display: inline-flex;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.sched__seg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 13px;
  border: none;
  border-right: 1px solid #eee;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}
.sched__seg:last-child {
  border-right: none;
}
.sched__seg:hover {
  background: rgba(0, 0, 0, 0.04);
}
.sched__seg--on {
  font-weight: 600;
}
.sched__seg--on:hover {
  filter: brightness(0.96);
}
.sched__swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}
.sched__seg--on .sched__swatch {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
}
.sched__bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.sched__dash {
  color: rgba(0, 0, 0, 0.4);
}
.sched__bulk-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sched__days {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}
.sched__daybtn {
  min-width: 34px;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.sched__daybtn:hover {
  border-color: #1677ff;
  color: #1677ff;
}
.sched__daybtn--on {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}
.sched__daybtn--on:hover {
  color: #fff;
}
.sched__grid {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 10px;
}
.sched__row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.sched__row + .sched__row {
  margin-top: 2px;
}
.sched__row--head {
  margin-bottom: 6px;
}
.sched__day {
  width: 34px;
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  text-align: right;
  padding-right: 6px;
}
.sched__day--head {
  height: 16px;
}
.sched__day--btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  border-radius: 4px;
}
.sched__day--btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.9);
}
.sched__day--now {
  color: #1677ff;
  font-weight: 700;
}
.sched__hcol {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.4);
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px 0;
  border-radius: 4px;
}
.sched__hcol:hover {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.9);
}
.sched__hcol--now {
  color: #1677ff;
  font-weight: 700;
}
.sched__cell {
  flex: 1 1 0;
  min-width: 0;
  height: 28px;
  border-radius: 3px;
  cursor: pointer;
  transition: filter 0.1s, box-shadow 0.1s;
}
.sched__cell:hover {
  filter: brightness(0.9);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.15);
}
.sched__cell--now {
  box-shadow: inset 0 0 0 2px #1677ff;
}
.sched__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.sched__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sched__legend-hint {
  flex-basis: 100%;
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
}
</style>
