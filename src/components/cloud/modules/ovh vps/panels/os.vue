<template>
  <div
    v-if="imagesWithStock.length > 0 || !isLoading"
    class="newCloud__option-field"
  >
    <a-row>
      <a-col :xs="24" :sm="10">
        <a-form
          ref="ovhVpsForm"
          :model="authData"
          no-style
          autocomplete="off"
          layout="vertical"
          :rules="rules"
        >
          <a-form-item
            name="vmName"
            :label="`${capitalize($t('server name'))}:`"
          >
            <a-input v-model:value="authData.vmName" />
          </a-form-item>

          <a-form-item
            name="password"
            v-if="false"
            :label="`${$t('clientinfo.password')}:`"
          >
            <password-meter
              :style="{
                height: authData.password.length > 0 ? '10px' : '0',
                marginTop: authData.password.length < 1 ? '0' : null,
              }"
              :password="authData.password"
              @score="(value) => (authData.score = value.score)"
            />

            <a-input-password
              :value="authData.password"
              class="password"
              autocomplete="new-password"
              @update:value="authData.password = $event"
              @input="(e) => (authData.password = e.target.value)"
            />
          </a-form-item>
        </a-form>
      </a-col>
    </a-row>

    <images-list
      v-if="cloudStore.provider"
      :os-name="options.os.name"
      :images="imagesWithStock"
      :set-o-s="setOS"
    />
  </div>

  <a-alert
    v-else-if="!(isFlavorsLoading || isLoading)"
    show-icon
    type="warning"
    :message="$t('No OS. Choose another plan')"
  />
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { computed, inject, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import passwordMeter from "vue-simple-password-meter";

import { useCloudStore } from "@/stores/cloud.js";
import imagesList from "@/components/ui/images.vue";
import { useAddonsStore } from "@/stores/addons";
import { useCurrency } from "@/hooks/utils";
import { useI18n } from "vue-i18n";
import useVpsAvailability from "@/hooks/cloud/vpsAvailability.js";

const props = defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});

const i18n = useI18n();

const cloudStore = useCloudStore();
const { validationPanels, authData } = storeToRefs(cloudStore);
const { currency, formatPrice } = useCurrency();
const { addons, loading } = storeToRefs(useAddonsStore());
const { availability, isOsAvailable } = useVpsAvailability();

const ovhVpsForm = ref(null);
const images = ref([]);
const isLoading = ref(false);

const rules = {
  vmName: {
    trigger: "change",
    required: true,
    validator: () =>
      authData.value.vmName.length < 2
        ? Promise.reject(i18n.t("ssl_product.field is required"))
        : Promise.resolve(),
  },
};

const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();
const [activeKey] = inject("useActiveKey", () => [])();

watch(
  [
    () => props.productSize,
    () => options.config.planCode,
    // switching the billing period wipes price.addons in the plan panel and
    // reprices the OS, so the list has to be rebuilt and reapplied
    () => props.mode,
    availability,
    loading,
    currency,
  ],
  setImages,
);
if (props.productSize) setImages();

watch(
  [activeKey, authData],
  async () => {
    try {
      await ovhVpsForm.value.validateFields();
      validationPanels.value["os"] = false;
    } catch (e) {
      validationPanels.value["os"] = true;
    }
  },
  { deep: true },
);

// the plan holds one product per billing period, keyed "<duration> <planCode>"
function durationMode(duration) {
  switch (duration) {
    case "P1H":
      return "hourly";
    case "P1Y":
      return "upfront12";
    case "P2Y":
      return "upfront24";
    default:
      return "default";
  }
}

async function setImages() {
  const planProducts = Object.entries(cloudStore.plan.products ?? {}).filter(
    ([, { title }]) => title === props.productSize,
  );

  if (!planProducts[0]) return;

  // price the OS for the period the customer actually picked, not for whichever
  // product happens to come first
  const [, product] =
    planProducts.find(
      ([key]) => durationMode(key.split(" ")[0]) === props.mode,
    ) ?? planProducts[0];

  images.value = addons.value
    .filter((a) => product.addons.includes(a.uuid) && a.meta?.type == "os")
    .map((os) => {
      const price = os.periods?.[product.period];
      // no price for the picked period means we cannot sell it for that period:
      // giving a paid licence away at 0 is worse than not offering it. A free
      // image (nothing charged in any period) has nothing to leak, keep it.
      const isFree = Object.values(os.periods ?? {}).every((value) => !value);

      return {
        name: os.title,
        prices: [formatPrice(price)],
        desc: os.title,
        uuid: os.uuid,
        rawPrice: price ?? 0,
        unpriced: price === undefined && !isFree,
      };
    });
  images.value.sort((a, b) => a.name.localeCompare(b.name));
}

// OVH reports linux and windows stock separately, per datacenter. Derived, not
// stored on the item: the tariff can change under us (a greyed one gets swapped
// for an orderable one) and a baked-in flag would keep the old plan's stock.
const imagesWithStock = computed(() =>
  images.value.map((image) => ({
    ...image,
    unavailable:
      image.unpriced || !isOsAvailable(options.config.planCode, image.name),
  })),
);

// setOS() swaps the OS addon in place (filters out the old one, appends the
// new), so it has to run again whenever the list or the tariff changes - the
// addon uuids belong to the plan product, not to the image name.
// Cheapest first, not alphabetically first: when OVH is out of linux stock the
// only selectable images are the paid Windows ones, and picking one silently
// adds its licence to the order price. Equal prices keep the A-Z order.
watch(
  imagesWithStock,
  (list) => {
    const [orderable] = list
      .filter(({ unavailable }) => !unavailable)
      .sort((a, b) => a.rawPrice - b.rawPrice);

    if (orderable) {
      setOS(orderable);
      return;
    }
    // nothing orderable: drop the OS from the order instead of leaving a
    // greyed one selected. The create button already refuses an empty os.name
    clearOS();
  },
  { immediate: true },
);

// the plan panel wipes price.addons on every reprice (setResources), which drops
// the OS licence from the total while the image stays selected on screen
watch(
  () => price.addons.os,
  (osPrice) => {
    if (osPrice !== undefined) return;

    const current = imagesWithStock.value.find(
      ({ name }) => name === options.os.name,
    );

    if (current && !current.unavailable) setOS(current);
  },
);

function clearOS() {
  if (options.os.name === "" && price.addons.os === undefined) return;

  setOptions("os.name", "");
  setOptions("config.configuration.vps_os", "");
  setOptions(
    "addons",
    options.addons.filter(
      (uuid) =>
        addons.value.find((addon) => addon.uuid == uuid)?.meta?.type !== "os",
    ),
  );
  setPrice("addons.os", 0);
}

function setOS(item, index) {
  if (item.warning || item.unavailable) return;
  setOptions("os.id", +index);
  setOptions("os.name", item.name);

  if (item.prices) {
    setPrice("addons.os", item.prices[0]);
  } else if (price.addons.os !== 0) {
    setPrice("addons.os", 0);
  }

  setOptions("config.configuration.vps_os", item.name);
  setOptions("addons", [
    ...options.addons.filter(
      (uuid) =>
        addons.value.find((addon) => addon.uuid == uuid)?.meta?.type !== "os",
    ),
    item.uuid,
  ]);
}
</script>

<script>
export default { name: "OvhVpsOsPanel" };
</script>
