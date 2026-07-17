<template>
  <div class="sched">
    <div class="sched__top">
      <a-switch v-model:checked="enabled" @change="emitChange" />
      <span class="sched__enable-label">{{ t("bots.schedule.enable") }}</span>
    </div>

    <template v-if="enabled">
      <div class="sched__controls">
        <div class="sched__tz">
          <span>{{ t("bots.schedule.timezone") }}:</span>
          <a-select
            v-model:value="tz"
            show-search
            style="min-width: 220px"
            :options="tzOptions"
            @change="emitChange"
          />
        </div>

        <div class="sched__brush">
          <span>{{ t("bots.schedule.brush") }}:</span>
          <a-button
            v-for="m in MODES"
            :key="m.key"
            size="small"
            :type="brush === m.key ? 'primary' : 'default'"
            class="sched__brush-btn"
            :style="brush === m.key ? { background: m.color, borderColor: m.color } : {}"
            @click="brush = m.key"
          >
            <span class="sched__swatch" :style="{ background: m.color }" />
            {{ t(`bots.schedule.mode.${m.key}`) }}
          </a-button>
        </div>
      </div>

      <div class="sched__grid" @mouseleave="painting = false">
        <div class="sched__row sched__row--head">
          <div class="sched__day sched__day--head" />
          <div v-for="h in 24" :key="h" class="sched__hcol">
            {{ h - 1 }}
          </div>
        </div>

        <div v-for="(day, d) in DAYS" :key="d" class="sched__row">
          <div class="sched__day">{{ t(`bots.schedule.days.${day}`) }}</div>
          <div
            v-for="h in 24"
            :key="h"
            class="sched__cell"
            :style="{ background: colorOf(grid[d][h - 1]) }"
            :title="`${day} ${h - 1}:00 — ${cellLabel(grid[d][h - 1])}`"
            @mousedown.prevent="startPaint(d, h - 1)"
            @mouseenter="dragPaint(d, h - 1)"
          />
        </div>
      </div>

      <div class="sched__legend">
        <span v-for="m in MODES" :key="m.key" class="sched__legend-item">
          <span class="sched__swatch" :style="{ background: m.color }" />
          {{ t(`bots.schedule.mode.${m.key}`) }} —
          {{ t(`bots.schedule.mode_hint.${m.key}`) }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
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
const TZ_LIST = [
  "UTC",
  "Europe/Warsaw",
  "Europe/Minsk",
  "Europe/Moscow",
  "Europe/Kyiv",
  "Europe/Kaliningrad",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Asia/Yekaterinburg",
];
const tzOptions = TZ_LIST.map((z) => ({ label: z, value: z }));

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
}

onMounted(() => {
  fromSchedule(props.modelValue);
  window.addEventListener("mouseup", stopPaint);
});
onBeforeUnmount(() => window.removeEventListener("mouseup", stopPaint));
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
.sched__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin-bottom: 14px;
}
.sched__tz,
.sched__brush {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sched__brush-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sched__swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.sched__grid {
  overflow-x: auto;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 6px;
}
.sched__row {
  display: flex;
  align-items: center;
}
.sched__row--head {
  margin-bottom: 4px;
}
.sched__day {
  width: 42px;
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  text-align: right;
  padding-right: 8px;
}
.sched__day--head {
  height: 14px;
}
.sched__hcol {
  flex: 1;
  min-width: 22px;
  text-align: center;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.35);
}
.sched__cell {
  flex: 1;
  min-width: 22px;
  height: 24px;
  border: 1px solid #fff;
  border-radius: 2px;
  cursor: pointer;
}
.sched__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.sched__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
