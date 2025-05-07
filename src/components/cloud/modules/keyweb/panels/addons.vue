<template>
  <a-row v-for="(addon, key) in addons" :key="key" class="newCloud__prop">
    <a-col span="8" :xs="6"> {{ capitalize($t(key)) }}: </a-col>
    <a-col span="16" :xs="18">
      <a-select
        style="width: 100%"
        :options="[...Object.values(addon).sort((a, b) => a.price - b.price)]"
        :value="getAddon(addon)"
        @update:value="setAddon($event, addon[$event], key)"
      />
    </a-col>
  </a-row>
</template>

<script setup>
import { computed, inject, nextTick, watch } from "vue";
import { useCloudStore } from "@/stores/cloud.js";
import { useAddonsStore } from "@/stores/addons.js";
import { useCurrency } from "@/hooks/utils";

defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true },
  plans: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  isFlavorsLoading: { type: Boolean, default: false },
});

const cloudStore = useCloudStore();
const addonsStore = useAddonsStore();
const { currency } = useCurrency();

const [product] = inject("useProduct", () => [])();
const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();

const addons = computed(() => {
  const result = { backup: {} };

  const filtered = addonsStore.addons.filter(
    ({ uuid }) =>
      cloudStore.plan.addons.includes(uuid) ||
      product.value.addons?.includes(uuid)
  );

  filtered.forEach(
    ({ uuid, title, periods, meta, system, group, public: enabled }) => {
      const isInclude = meta.key.toLowerCase().includes("backup");
      const isEqualGroup = group === cloudStore.plan.uuid;
      const key = system && isInclude ? "backup" : group;

      if (!enabled || (!isEqualGroup && system)) return;
      if (system && !isInclude) return;
      if (!result[key]) result[key] = {};

      result[key][uuid] = {
        value: uuid,
        label: `${title} (${periods[product.value.period]} ${
          currency.value.title
        })`,
        title,
        required: system,
        type: meta.type ?? "custom",
        price: periods[product.value.period],
      };
    }
  );

  return result;
});

watch(addons, setAddons);
setAddons(addons.value);

async function setAddons(value) {
  await nextTick();

  Object.entries(value).forEach(([key, value]) => {
    const [code, addon] = Object.entries(value)
      .filter(([code, addon]) => addon.required && code)
      .sort(([b, addonB], [a, addonA]) => addonB.price - addonA.price)[0];
    if (!code || !addon.required) return;

    setAddon(code, addon, key);
  });
}

async function setAddon(code, addon, key) {
  const addonsPrices = { ...price.addons };
  const addonsKeys = [...options.addons].filter(
    (uuid) => !Object.keys(addons.value[key]).includes(uuid)
  );

  if (code !== -1) {
    addonsPrices[key] = addon.price;
    addonsKeys.push(code);
  } else {
    delete addonsPrices[key];
  }

  setPrice("addons", addonsPrices);
  setOptions("addons", addonsKeys);

  if (addon.type === "custom") return;
  setOptions(`config.configurations.${addon.type}`, code.split("$")[0]);
}

function getAddon(addons) {
  return Object.keys(addons).find((key) => options.addons.includes(key));
}
</script>

<script>
export default { name: "KeywebAddonsPanel" };
</script>
