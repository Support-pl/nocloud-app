<template>
  <div class="newCloud__template">
    <div
      v-for="group in groups"
      :key="group.title"
      class="newCloud__template-item"
      :class="{ active: activeVersion(group).item.name === osName }"
      @click="selectGroup(group)"
    >
      <div class="newCloud__template-head">
        <span class="newCloud__template-radio" />
        <span class="newCloud__template-name">{{ group.title }}</span>
      </div>

      <select
        v-if="group.versions.length > 1"
        class="newCloud__template-version"
        :value="activeVersion(group).index"
        @click.stop
        @change="onVersionChange(group, $event.target.value)"
      >
        <option v-for="v in group.versions" :key="v.index" :value="v.index">
          {{ $t("Version") }} {{ v.version }}
        </option>
      </select>
      <div
        v-else-if="activeVersion(group).version"
        class="newCloud__template-version is-static"
      >
        {{ $t("Version") }} {{ activeVersion(group).version }}
      </div>

      <div
        v-if="!activeVersion(group).item.warning"
        class="newCloud__template-price"
      >
        <template v-if="activeVersion(group).item.prices || activeVersion(group).item.price">
          {{ osPrice(activeVersion(group).item.prices ?? activeVersion(group).item) }} {{ currency.title }}
        </template>
        <template v-else>{{ $t("vpn.labels.free") }}</template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCurrency } from "@/hooks/utils";
import { computed, onMounted, toRefs, watch } from "vue";

const props = defineProps({
  images: { type: [Array, Object], required: true },
  osName: { type: String, required: true },
  setOS: { type: Function, required: true },
  osPrice: { type: Function, default: (prices) => prices[0] ?? 0 },
});
const { images } = toRefs(props);

const { currency } = useCurrency();

// "Windows_Server_2016_Standard" -> { title: "Windows Server", version: "2016 Standard" }
function splitName(rawName) {
  const name = rawName.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const match = name.match(/^(.*?)[\s-]*(\d[\d.]*.*)$/);

  if (!match) return { title: name, version: "" };

  const [, title, version] = match;
  return { title: title.replace(/[-\s]+$/, "").trim() || name, version };
}

const groups = computed(() => {
  const map = new Map();

  Object.entries(images.value).forEach(([index, item]) => {
    if (item.warning || item.name.includes("none")) {
      map.set(`single-${index}`, {
        title: item.name.replace(/_/g, " ").replace(/\s+/g, " ").trim(),
        versions: [{ index, item, version: "" }],
      });
      return;
    }

    const { title, version } = splitName(item.name);
    const key = title.toLowerCase();

    if (!map.has(key)) map.set(key, { title, versions: [] });
    map.get(key).versions.push({ index, item, version });
  });

  return [...map.values()];
});

function activeVersion(group) {
  return (
    group.versions.find((v) => v.item.name === props.osName) ??
    group.versions[0]
  );
}

function selectGroup(group) {
  const { item, index } = activeVersion(group);
  props.setOS(item, index);
}

function onVersionChange(group, index) {
  const v = group.versions.find((v) => String(v.index) === String(index));
  if (v) props.setOS(v.item, v.index);
}

const setDefaultOs = () => {
  const index = Object.keys(images.value)[0];
  const defaultOs = images.value[index];
  if (defaultOs && !props.osName) {
    props.setOS(defaultOs, index);
  }
};

onMounted(() => {
  setDefaultOs();
});

watch(images, () => {
  setDefaultOs();
});
</script>

<script>
export default { name: "ImagesList" };
</script>

<style scoped>
.newCloud__template {
  display: flex;
  flex-wrap: wrap;
  gap: 17px;
}

.newCloud__template-item {
  background-color: var(--bright_font);
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1 1 200px;
  max-width: calc(25% - 13px);
}

.newCloud__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}

.newCloud__template-item.active {
  border-color: var(--main);
  background-color: color-mix(in srgb, var(--main) 10%, var(--bright_font));
}

.newCloud__template-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 8px;
  font-weight: 600;
}

.newCloud__template-radio {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--border, #b7c0d8);
  position: relative;
}

.newCloud__template-item.active .newCloud__template-radio {
  border-color: var(--main);
}

.newCloud__template-item.active .newCloud__template-radio::after {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: var(--main);
}

.newCloud__template-version {
  margin: 0 12px 10px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border, #c9d2e6);
  background: var(--bright_font);
  color: var(--main);
  font-weight: 600;
  cursor: pointer;
}

.newCloud__template-version.is-static {
  cursor: default;
}

.newCloud__template-price {
  margin-top: auto;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--accent, #9c1e6b);
  font-weight: 700;
}

@media (max-width: 991px) {
  .newCloud__template-item {
    max-width: calc(50% - 9px);
  }
}

@media (max-width: 575px) {
  .newCloud__template-item {
    max-width: 100%;
  }
}
</style>
