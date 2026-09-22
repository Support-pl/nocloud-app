<template>
  <a-spin
    v-if="isFlavorsLoading"
    style="display: block; margin: 0 auto"
    :tip="$t('loading')"
  />
  <template v-else-if="products.length > 0">
    <a-row style="margin-bottom: 15px" align="middle">
      <a-col v-if="products.length < 6 && products.length > 1" span="24">
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...products }"
          :tip-formatter="null"
          :max="products.length - 1"
          :min="0"
          :value="Math.max(products.indexOf(product), 0)"
          @change="(i) => pickProduct(products[i])"
        />
      </a-col>

      <a-col v-else span="24">
        <div class="order__grid">
          <div
            v-for="provider of products"
            :key="provider"
            class="order__slider-item"
            :class="{ 'order__slider-item--active': product === provider }"
            @click="pickProduct(provider)"
          >
            {{ provider }}
          </div>
        </div>
      </a-col>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">CPU:</span>
      </a-col>
      <a-col
        v-if="resources.cpu.length > 1"
        :sm="{ span: 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
      >
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.cpu }"
          :tip-formatter="null"
          :max="resources.cpu.length - 1"
          :min="0"
          :value="resources.cpu.indexOf(options.cpu.size)"
          @change="(i) => setOptions('cpu.size', resources.cpu[i])"
          @after-change="setResources(productKey)"
        />
      </a-col>
      <a-col class="changing__field" style="text-align: right">
        <loading-icon v-if="options.cpu.size === 'loading'" />
        <template v-else>
          {{ options.cpu.size }} {{ isNaN(+options.cpu.size) ? "" : "vCPU" }}
        </template>
      </a-col>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">RAM:</span>
      </a-col>
      <a-col
        v-if="resources.ram.length > 1"
        :sm="{ span: 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
      >
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.ram }"
          :tip-formatter="null"
          :max="resources.ram.length - 1"
          :min="0"
          :value="resources.ram.indexOf(options.ram.size)"
          @change="(i) => setOptions('ram.size', resources.ram[i])"
          @after-change="setResources(productKey)"
        />
      </a-col>
      <transition name="textchange" mode="out-in">
        <a-col
          class="changing__field"
          :sm="3"
          :xs="18"
          style="text-align: right"
        >
          {{ options.ram.size }} Gb
        </a-col>
      </transition>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px"
          >{{ $t("Drive") }}:</span
        >
      </a-col>
      <a-col
        v-if="resources.disk.length > 1"
        :sm="{ span: 18, order: 0 }"
        :xs="{ span: 24, order: 1 }"
      >
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.disk }"
          :tip-formatter="null"
          :max="resources.disk.length - 1"
          :min="0"
          :value="resources.disk.indexOf(parseInt(diskSize))"
          @change="(i) => setOptions('disk.size', resources.disk[i] * 1024)"
          @after-change="setResources(productKey)"
        />
      </a-col>
      <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
        {{ diskSize }}
      </a-col>
    </a-row>
  </template>

  <a-alert
    v-else
    show-icon
    type="warning"
    :message="$t('No linked plans. Choose another location')"
  />
</template>

<script setup>
import {
  ref,
  inject,
  defineAsyncComponent,
  computed,
  watch,
  nextTick,
  toRefs,
} from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { useCloudStore } from "@/stores/cloud.js";
import { useAuthStore } from "@/stores/auth.js";
import useVpsAvailability from "@/hooks/cloud/vpsAvailability.js";

const loadingIcon = defineAsyncComponent(
  () => import("@ant-design/icons-vue/LoadingOutlined"),
);

const props = defineProps({
  plans: { type: Array, default: () => [] },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  mode: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});
const { isFlavorsLoading } = toRefs(props);

const emits = defineEmits(["update:periods", "update:product-size"]);

const route = useRoute();
const cloudStore = useCloudStore();
const [options, setOptions] = inject("useOptions", () => [])();
const [, setPrice] = inject("usePriceOVH", () => [])();
const { isLogged } = storeToRefs(useAuthStore());
const { availability, fetchAvailability, isCodeOrderable } =
  useVpsAvailability();
const isPicked = ref(false);

// the slider shows a group, the calculator shows what the planCode says: derive
// the group from that planCode so the two cannot show different tariffs
const product = computed(
  () =>
    datacenterProducts.value.find(
      ({ value }) => value === options.config.planCode,
    )?.group ?? "",
);

// picking a group is picking its plan in this datacenter - the same group name
// in another one carries a planCode that is not on sale here
function selectGroup(group) {
  const [groupProduct] = datacenterProducts.value.filter(
    ({ group: name }) => name === group,
  );

  if (groupProduct) setResources(groupProduct.value);
}

function pickProduct(group) {
  // the slider echoes an out-of-range value back as a change
  if (!group) return;

  isPicked.value = true;
  selectGroup(group);
}

if (props.products.length < 1) resetData();

const productKey = computed(() => {
  const { ram, disk } = options;

  const keys = ["ram", "disk"];
  const values = { ram: { size: ram.size * 1024 }, disk };
  const plan = props.products.find(
    ({ group, resources }) =>
      group === product.value &&
      keys.every((key) => resources[key] === values[key].size),
  );

  return plan?.value;
});

watch(
  () => options.ram.size,
  async (size) => {
    await nextTick();
    const plan = props.products.find(({ value }) => value === productKey.value);

    if (plan) return;
    const { resources } =
      props.products.find(
        (el) => el.group === product.value && el.resources.ram / 1024 === size,
      ) ?? {};

    setOptions("disk.size", resources?.disk);
  },
);

watch(
  () => options.disk.size,
  async (size) => {
    await nextTick();
    const plan = props.products.find(({ value }) => value === productKey.value);

    if (plan) return;
    const { resources } =
      props.products.find(
        (el) => el.group === product.value && el.resources.disk === size,
      ) ?? {};

    setOptions("ram.size", resources?.ram / 1024);
  },
);

watch(
  () => props.mode,
  () => {
    setResources(productKey.value, false);
  },
);

const datacenterProducts = computed(() =>
  props.products.filter(({ datacenter }) => {
    const key = options.config.configuration?.vps_datacenter;

    return datacenter?.includes(key);
  }),
);

const products = computed(() =>
  Array.from(new Set(datacenterProducts.value.map(({ group }) => group))),
);

watch(
  [
    () => cloudStore.provider?.uuid,
    () => options.config.configuration?.vps_datacenter,
    datacenterProducts,
    isLogged,
  ],
  () => {
    fetchAvailability(
      cloudStore.provider?.uuid,
      options.config.configuration?.vps_datacenter,
      Array.from(new Set(datacenterProducts.value.map(({ value }) => value))),
    );
  },
  { immediate: true },
);

watch(products, async (value) => {
  if (value.length < 1) {
    resetData();
    return;
  }

  const dataString = localStorage.getItem("data") ?? route.query.data ?? "{}";
  const data = dataString.includes("productSize") ? JSON.parse(dataString) : {};
  const code = data.ovhConfig?.planCode;

  if (code && options.config.planCode === code) return;

  await nextTick();

  // a restored order only counts while its plan is sold in this datacenter
  if (datacenterProducts.value.some((el) => el.value === code)) {
    setResources(code);
    setOptions("config", data.ovhConfig);
    return;
  }

  selectGroup(value[1] ?? value[0]);
});

// the default tariff is a guess made before OVH stock is known: when it turns
// out to be undeliverable here, fall to the first one that is orderable
watch([availability, product], () => {
  if (isPicked.value || !product.value) return;

  const groupCode = (group) =>
    datacenterProducts.value.find((el) => el.group === group)?.value;
  const code = groupCode(product.value);

  if (!code || isCodeOrderable(code)) return;

  const orderable = products.value.find((group) =>
    isCodeOrderable(groupCode(group)),
  );

  if (orderable) selectGroup(orderable);
});

watch(isFlavorsLoading, () => {
  if (isFlavorsLoading.value) {
    resetData();
  }
});

const resources = computed(() => {
  const cpu = new Set();
  const ram = new Set();
  const disk = new Set();

  const filteredPlans = props.products.filter(
    ({ group }) => group === product.value,
  );

  filteredPlans.forEach(({ resources }) => {
    cpu.add(resources.cpu);
    ram.add(resources.ram / 1024);
    disk.add(resources.disk / 1024);
  });

  return {
    cpu: Array.from(cpu).toSorted((a, b) => a - b),
    ram: Array.from(ram).toSorted((a, b) => a - b),
    disk: Array.from(disk).toSorted((a, b) => a - b),
  };
});

const diskSize = computed(() => {
  const size = options.disk.size / 1024;

  if (size > 1024) return `${(size / 1024).toFixed(1)} Tb`;
  if (size >= 1) return `${size.toFixed(1)} Gb`;
  return `${options.disk.size.toFixed(1)} Mb`;
});

function resetData() {
  emits("update:product-size", "-");
  emits("update:periods", [{ value: "-", label: "unknown" }]);

  setOptions("cpu.size", 0);
  setOptions("ram.size", 0);
  setOptions("disk.size", 0);

  setPrice("value", 0);
  setPrice("addons", {});

  setOptions("config.planCode", "");
  setOptions("config.duration", "");
  setOptions("config.pricingMode", "");
  setOptions("config.addons", []);
}

function setResources(productKey, changeTarifs = true) {
  const { title, periods, value, resources } =
    props.products.find((el) => el.value === productKey) ?? {};

  if (!value) return;
  emits("update:product-size", title);

  const tarifs = [];
  let product = periods[0];

  setOptions("cpu.size", +resources.cpu);
  setOptions("ram.size", resources.ram / 1024);
  setOptions("disk", { size: +resources.disk, type: "SSD" });

  periods.forEach((period) => {
    if (period.pricingMode === props.mode) product = period;
    switch (period.pricingMode) {
      case "upfront12":
        tarifs.push({ value: "Annually", label: "annually" });
        break;
      case "upfront24":
        tarifs.push({ value: "Biennially", label: "biennially" });
        break;
      case "default":
        tarifs.push({ value: "Monthly", label: "ssl_product.Monthly" });
    }
  });

  if (changeTarifs) emits("update:periods", tarifs);
  setPrice("value", product.price.value);
  setPrice("addons", {});

  setOptions("config.planCode", value);
  setOptions("config.duration", product.duration);
  setOptions("config.pricingMode", product.pricingMode);
  setOptions("config.addons", []);
}

function setDatacenter() {
  const { extra } =
    cloudStore.locations.find(({ id }) => cloudStore.locationId.includes(id)) ??
    {};

  setOptions("config.configuration.vps_datacenter", extra.region);
}

watch(() => cloudStore.locationId, setDatacenter);
setDatacenter();
</script>

<script>
export default { name: "OvhVpsPlanPanel" };
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  font-size: 1.1rem;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--border_color);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--gloomy_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
