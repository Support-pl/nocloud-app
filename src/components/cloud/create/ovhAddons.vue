<template>
  <template v-if="!isFlavorsLoading">
    <a-row v-for="(addon, key) in addons" :key="key" class="newCloud__prop">
      <a-col span="8" :xs="6"> {{ capitalize($t(key)) }}: </a-col>
      <a-col span="16" :xs="18">
        <a-select
          default-value="-1"
          style="width: 100%"
          :value="addonName(addon)"
          @change="(value) => setAddon(value, addon[value], key)"
        >
          <a-select-option value="-1">
            {{ $t("ip.none") }}
          </a-select-option>
          <a-select-option v-for="(item, id) in addon" :key="id">
            {{ item.title }} ({{ addonPrice(item) }})
          </a-select-option>
        </a-select>
      </a-col>
    </a-row>
  </template>
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { inject, watch } from "vue";
import { useRoute } from "vue-router";
import { useCurrency } from "@/hooks/utils";

const props = defineProps({
  addons: { type: Object, required: true },
  plans: { type: Array, default: () => [] },
  productSize: { type: String, default: "" },
  mode: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});

const route = useRoute();
const { currency, formatPrice } = useCurrency();
const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();

watch(
  () => props.addons,
  (value) => {
    const data = localStorage.getItem("data")
      ? JSON.parse(localStorage.getItem("data"))
      : JSON.parse(route.query.data ?? "{}");

    if (!data.ovhConfig) return;
    if (data.ovhConfig.addons.length < 1) return;

    options.addons.forEach((addon) => {
      const keys = Object.keys(value);
      const key = keys.find((el) => addon.includes(el));

      if (!value[key][addon]) return;
      setAddon(addon, value[key][addon], key);
    });
  }
);

function setAddon(code, addon, key) {
  const addonsPrices = JSON.parse(JSON.stringify(price.addons));
  const addonsCodes = JSON.parse(JSON.stringify(options.addons)).filter(
    (uuid) => !Object.keys(props.addons[key]).includes(uuid)
  );

  if (code !== "-1") {
    addonsPrices[key] = addon.periods[0].price.value;
    addonsCodes.push(code);
  } else {
    delete addonsPrices[key];
  }

  setPrice("addons", addonsPrices);
  setOptions("addons", addonsCodes);
}

// function selectorMode (addons) {
//   const values = Object.values(addons)

//   if (values.length < 1) return null
//   return values.every(({ multiple }) => multiple) ? 'multiple' : null
// }

function addonName(addons) {
  const keys = Object.keys(addons);

  return options.addons.find((el) => keys.includes(el)) ?? "-1";
}

function addonPrice({ periods }) {
  const period = periods.find(
    ({ pricingMode }) => pricingMode === props.mode
  ) ?? { price: { value: 0 } };
  const price = formatPrice(period.price.value);

  return `${price} ${currency.value.title}`;
}
</script>

<script>
export default { name: "OvhAddons" };
</script>
