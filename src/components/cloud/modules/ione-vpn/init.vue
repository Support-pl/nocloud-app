<template>
  <div></div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

import { computed, inject, nextTick, toRefs, watch } from "vue";
import { useCloudStore } from "@/stores/cloud.js";
import { getPeriods, getTarification } from "@/functions.js";
import { GeneratePassword } from "js-generate-password";

const props = defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});
const { isFlavorsLoading } = toRefs(props);

const emits = defineEmits(["update:periods", "update:product-size"]);

const cloudStore = useCloudStore();
const { provider, authData } = storeToRefs(useCloudStore());
const [options, setOptions] = inject("useOptions")();

const images = computed(() => {
  const { templates } = provider.value.publicData;
  const images = {};

  Object.entries(templates ?? {}).forEach(([key, value]) => {
    if (cloudStore.plan.meta.hidedOs?.includes(key)) return;
    if (value.is_public !== false) {
      images[key] = value;
    }
  });

  return images;
});

emits("update:periods", getPeriods(props.productSize, props.plans));
watch(
  () => props.productSize,
  (value) => {
    const product = getProduct(value);

    nextTick(() => {
      if (product?.meta?.minDiskSize) {
        setOptions("disk.size", product.meta.minDiskSize * 1024);
        setOptions("disk.min", product.meta.minDiskSize);
      }
      if (product?.meta?.maxDiskSize) {
        setOptions("disk.max", product.meta.maxDiskSize);
      }
    });

    emits("update:periods", getPeriods(value, props.plans));
  }
);

function getProduct(size, plan = cloudStore.plan) {
  const isDynamic = cloudStore.plan.kind === "DYNAMIC";
  const products = Object.values(plan.products);
  const product = products.find(
    ({ title, period }) =>
      title === size && (getTarification(period) === props.mode || isDynamic)
  );

  return { ...product?.resources, group: product?.group, meta: product?.meta };
}

async function setProduct(value) {
  emits("update:product-size", value);

  await nextTick();
  const plan = cloudStore.plan;

  if (!plan) return;
  const resources = getProduct(value, plan) ?? {};
  const minDisk = (plan.meta.minDiskSize ?? {})[options.disk.type];

  setOptions("cpu.size", resources.cpu ?? 0);
  setOptions("ram.size", (resources.ram ?? 0) / 1024);
  setOptions("disk.size", resources.disk ?? (minDisk ?? 20) * 1024);

  const osKey = Object.keys(images.value)[0];
  const osName = images.value[osKey].name;
  setOptions("os.id", +osKey);
  setOptions("os.name", osName);

  authData.value.vmName = `VPN Server (${osName})`;
  authData.value.username = `root`;
  authData.value.password = GeneratePassword({ length: 32 });
}

watch(isFlavorsLoading, () => {
  if (!isFlavorsLoading.value && props.products.length < 6) {
    setProduct(props.products[0]?.title);
  }
});

onMounted(() => {
  if (props.products.length < 6) {
    setProduct(props.products[0]?.title);
  }
});
</script>

<script>
export default { name: "ione-vpn-init" };
</script>
