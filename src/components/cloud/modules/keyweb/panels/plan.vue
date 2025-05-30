<template>
  <a-row style="margin-bottom: 15px" align="middle">
    <a-col
      v-if="products.length < 8 && products.length > 1 && isSlider"
      span="24"
    >
      <a-slider
        ref="slider"
        style="margin-top: 10px"
        :marks="{ ...products }"
        :tip-formatter="null"
        :max="products.length - 1"
        :min="0"
        :value="products.indexOf(productSize)"
        @update:value="setProduct(products[$event])"
      />
    </a-col>

    <a-col v-else-if="products.length > 0" span="24">
      <div class="order__grid">
        <div
          v-for="item of products"
          :key="item"
          class="order__slider-item"
          :class="{ 'order__slider-item--active': productSize === item }"
          @click="setProduct(item)"
        >
          {{ item }}
        </div>
      </div>
    </a-col>
    <a-alert
      v-else
      show-icon
      type="warning"
      :message="$t('No linked plans. Choose another location')"
    />

    <a-col span="24">
      <editor-container :value="description" />
    </a-col>
  </a-row>
</template>

<script setup>
import { inject, nextTick, watch, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { EditorContainer } from "nocloud-ui";

import { useCloudStore } from "@/stores/cloud.js";
import { getPeriods } from "@/functions.js";
import { useSlider } from "@/hooks/utils";

const props = defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
});
const emits = defineEmits(["update:periods", "update:product-size"]);

emits("update:periods", getPeriods(props.productSize, props.plans));
watch(
  () => props.productSize,
  (value) => {
    emits("update:periods", getPeriods(value, props.plans));
  }
);

const route = useRoute();
const cloudStore = useCloudStore();
const [product] = inject("useProduct", () => [])();
const [, setOptions] = inject("useOptions", () => [])();
const [, setPrice] = inject("usePriceOVH", () => [])();

if (props.products.length > 0) {
  const data = localStorage.getItem("data") ?? route.query.data;
  const { productSize } = JSON.parse(data ?? "{}");

  if (productSize) setProduct(productSize);
  else setProduct(props.products[1] ?? props.products[0]);
} else {
  resetData();
}

watch(
  () => props.products,
  (value) => {
    if (value.length < 1) resetData();
    else setProduct(value[1] ?? value[0]);
  }
);

watch(
  () => props.mode,
  () => {
    if (props.products.length < 1) return;
    setProduct(props.productSize);
  }
);

const description = computed(() => product.value.meta?.description);

function resetData() {
  emits("update:product-size", "-");
  emits("update:periods", [{ value: "-", label: "unknown" }]);

  setOptions("cpu.size", 0);
  setOptions("ram.size", 0);
  setOptions("disk.size", 0);

  setPrice("value", 0);
  setOptions("config", {});
}

async function setProduct(value) {
  emits("update:product-size", value);

  await new Promise((resolve) => setTimeout(resolve, 5));

  if (!product.value.key) return;

  const {
    price,
    meta,
    resources = {},
  } = cloudStore.plan.products[product.value.key];
  let cycle = "";

  switch (props.mode) {
    case "Annually":
      cycle = "yearly";
      break;
    case "Biennially":
      cycle = "2-yearly";
      break;
    case "Hourly":
      cycle = "hourly";
      break;
    default:
      cycle = "monthly";
  }

  setOptions("cpu.size", resources.cpu || 0);
  setOptions("ram.size", resources.ram || 0);
  setOptions("disk.size", (resources.disk || 0) * 1024);

  setOptions("config", { configurations: {}, id: meta.keywebId, cycle });
  setPrice("value", price);
}

const slider = ref();
const [activeKey] = inject("useActiveKey", () => [])();
const { isSlider } = useSlider(slider, activeKey);
</script>

<script>
export default { name: "KeywebPlanPanel" };
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
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
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
