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

// uuids that belonged to OUR groups (backup/snapshot/disk/storage) as of the
// last time props.addons had data. options.addons also holds addons this
// component knows nothing about (e.g. the OS pick from panels/os.vue) -
// never touch those, only clean up uuids that were ours before.
let ownedUuids = new Set();

watch(
  () => props.addons,
  (value) => {
    if (Object.keys(value).length) {
      const validUuids = new Set(
        Object.values(value).flatMap((group) => Object.keys(group))
      );

      // A product switch swaps in a whole new addon catalog (new uuids per
      // group). If something we previously owned isn't in the new catalog,
      // drop it instead of leaving a dangling uuid; selectDefaultMandatoryAddons()
      // below then fills that now-empty mandatory group with the new default.
      if (options.addons.length && ownedUuids.size) {
        const stale = options.addons.filter(
          (uuid) => ownedUuids.has(uuid) && !validUuids.has(uuid)
        );
        if (stale.length) {
          setOptions(
            "addons",
            options.addons.filter((uuid) => !stale.includes(uuid))
          );
        }
      }

      ownedUuids = validUuids;
    }

    selectDefaultMandatoryAddons(value);
  },
  { immediate: true }
);

// options.addons gets reset/overwritten from elsewhere too - provider/location
// change clears it to [], and useCloudOptions.setReadyData() restores a saved
// array from localStorage ~1s after mount, blowing away whatever was already
// selected here. selectDefaultMandatoryAddons() only *adds* a group's free
// item when that group has nothing selected yet, so re-running it on every
// change is safe and keeps mandatory defaults from getting silently dropped.
watch(
  () => options.addons.length,
  () => selectDefaultMandatoryAddons(props.addons)
);

// ponytail: any free addon counts as "selected by default", user just can't drop back to none
function selectDefaultMandatoryAddons(addonsGroups) {
  Object.entries(addonsGroups).forEach(([key, groupAddons]) => {
    const keys = Object.keys(groupAddons);
    // addonName() fakes a "selected" id for display even when nothing was
    // actually picked yet - checking options.addons directly is the only way
    // to tell "really selected" apart from "just rendered as selected".
    if (options.addons.some((el) => keys.includes(el))) return;

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
