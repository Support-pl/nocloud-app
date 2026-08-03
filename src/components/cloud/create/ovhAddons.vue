<template>
  <template v-if="!isFlavorsLoading">
    <template v-for="(addon, key) in addons" :key="key">
      <a-row v-if="Object.keys(addon).length" class="newCloud__prop">
        <a-col span="8" :xs="6"> {{ capitalize($t(key)) }}: </a-col>
        <a-col span="16" :xs="18">
          <a-select
            default-value="-1"
            style="width: 100%"
            :value="addonName(addon)"
            @change="(value) => setAddon(value, addon[value], key)"
          >
            <a-select-option v-if="!isMandatory(addon)" value="-1">
              {{ $t("ip.none") }}
            </a-select-option>
            <a-select-option v-for="item in getGroupAddons(addon)" :key="item.id">
              <span class="addon-option">
                <span class="addon-option__title">{{ item.title }}</span>
                <span class="addon-option__price">
                  <template v-if="item.hasDiscount"><del class="addon-option__old">{{ item.baseFormatted }}</del> {{ item.priceFormatted }}</template>
                  <template v-else>{{ item.priceFormatted }}</template>
                </span>
              </span>
            </a-select-option>
          </a-select>
        </a-col>
      </a-row>
    </template>
  </template>
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { inject, watch } from "vue";
import { useCurrency } from "@/hooks/utils";

const props = defineProps({
  addons: { type: Object, required: true },
  plans: { type: Array, default: () => [] },
  productSize: { type: String, default: "" },
  mode: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});

const { currency, formatPrice } = useCurrency();
const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();

watch(
  () => props.addons,
  (value) => {
    if (options.addons.length > 0) {
      options.addons.forEach((addon) => {
        const keys = Object.keys(value);
        const key = keys.find((el) => addon.includes(el));

        if (!value[key][addon]) return;
        setAddon(addon, value[key][addon], key);
      });
    }

    selectDefaultMandatoryAddons(value);
  },
  { immediate: true }
);

// options.addons gets reset to [] on provider/location change (elsewhere) —
// re-apply mandatory free addons so the select never lands on an unrenderable "-1"
watch(
  () => options.addons.length,
  (length) => {
    if (length === 0) selectDefaultMandatoryAddons(props.addons);
  }
);

// ponytail: any free addon counts as "selected by default", user just can't drop back to none
function selectDefaultMandatoryAddons(addonsGroups) {
  Object.entries(addonsGroups).forEach(([key, groupAddons]) => {
    if (addonName(groupAddons) !== "-1") return;

    const free = getGroupAddons(groupAddons).find((item) => item.price === 0);
    if (free) setAddon(free.id, groupAddons[free.id], key);
  });
}

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
  const selected = options.addons.find((el) => keys.includes(el));

  if (selected) return selected;

  // nothing selected yet: for a mandatory group "-1" isn't a renderable option,
  // so show the free item instead of a raw "-1" while the real selection catches up
  const free = getGroupAddons(addons).find((item) => item.price === 0);
  return free?.id ?? "-1";
}

function isMandatory(groupAddons) {
  return getGroupAddons(groupAddons).some((item) => item.price === 0);
}

function getGroupAddons(groupAddons) {
  const keys = Object.keys(groupAddons);

  const addons = keys.map((key) => {
    const period = groupAddons[key].periods.find(
      ({ pricingMode }) => pricingMode === props.mode
    ) ?? { price: { value: 0 } };
    const price = period.price.value;
    const hasDiscount = period.basePrice > price;

    return {
      ...groupAddons[key],
      price: price,
      id: key,
      hasDiscount,
      priceFormatted: formatPrice(price) + " " + currency.value.title,
      baseFormatted: hasDiscount
        ? formatPrice(period.basePrice) + " " + currency.value.title
        : "",
    };
  });

  addons.sort((a, b) => a.price - b.price);

  return addons;
}
</script>

<script>
export default { name: "OvhAddons" };
</script>

<style scoped>
.addon-option {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.addon-option__old {
  opacity: 0.5;
  margin-right: 4px;
}
</style>
