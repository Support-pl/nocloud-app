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

const props = defineProps({
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

      const price = periods[product.value.period];

      result[key][uuid] = {
        value: uuid,
        label: `${title} (${price ? `${price} ${currency.value.title}` : "-"})`,
        title,
        required: system,
        type: meta.type ?? "custom",
        price,
      };
    }
  );

  return result;
});

watch(addons, setAddons);
watch(() => props.productSize, () => setAddons(addons.value));
setAddons(addons.value);

async function setAddons(value) {
  await nextTick();

  // cloudStore.plan.addons + product.value.addons are the whole allowed set
  // for this order - anything in options.addons outside that (e.g. carried
  // over from a previously configured plan) doesn't belong here, drop it.
  const allowedUuids = new Set([
    ...cloudStore.plan.addons,
    ...(product.value.addons ?? []),
  ]);

  if (options.addons.some((uuid) => !allowedUuids.has(uuid))) {
    setOptions(
      "addons",
      options.addons.filter((uuid) => allowedUuids.has(uuid))
    );
  }

  Object.entries(value).forEach(([key, value]) => {
    if (getAddon(value)) return;

    const [code, addon] = Object.entries(value)
      .filter(([code, addon]) => addon.required && code)
      .sort(([b, addonB], [a, addonA]) => addonB.price - addonA.price)[0] ?? [];
    if (!code || !addon.required) return;

    setAddon(code, addon, key);
  });
}

async function setAddon(code, addon, key) {
  const addonsPrices = { ...price.addons };
  // ponytail: addons.value[key] is already scoped to the current product's
  // addons, so a stale uuid from a previously selected product (e.g. leftover
  // backup addon after switching tariffs) won't be in it and survives the
  // filter. Filter against the full addon list for this key category instead.
  const categoryUuids = addonsStore.addons
    .filter(({ meta, system, group }) => {
      const isInclude = meta.key.toLowerCase().includes("backup");
      return (system && isInclude ? "backup" : group) === key;
    })
    .map(({ uuid }) => uuid);
  const addonsKeys = [...options.addons].filter(
    (uuid) => !categoryUuids.includes(uuid)
  );

  if (code !== -1) {
    addonsPrices[key] = addon.price;
    addonsKeys.push(code);
  } else {
    delete addonsPrices[key];
  }

  setPrice("addons", addonsPrices);
  setOptions("addons", addonsKeys);
}

function getAddon(addons) {
  return Object.keys(addons).find((key) => options.addons.includes(key));
}
</script>

<script>
export default { name: "KeywebAddonsPanel" };
</script>
