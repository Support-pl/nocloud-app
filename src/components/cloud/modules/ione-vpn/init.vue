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
import { useInstancesStore } from "@/stores/instances";

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
const instancesStore = useInstancesStore();
const { provider, authData, plan } = storeToRefs(cloudStore);
const [options, setOptions] = inject("useOptions")();

const images = computed(() => {
  const { templates } = provider.value.publicData;
  const images = {};

  Object.entries(templates ?? {}).forEach(([key, value]) => {
    if (plan.value.meta.hidedOs?.includes(key)) return;
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
    nextTick(() => {
      const diskType = plan.value?.meta?.preferedDiskType || "SSD";
      const minDisk = plan.value?.meta?.minDiskSize?.[diskType] || 5;
      const maxDisk = plan.value?.meta?.maxDiskSize?.[diskType] || 5;

      setOptions("disk.min", minDisk);
      setOptions("disk.max", maxDisk);
      setOptions("disk.size", minDisk * 1024);
      setOptions("disk.type", diskType);
    });

    emits("update:periods", getPeriods(value, props.plans));
  }
);

function getProduct(size) {
  const isDynamic = plan.value.kind === "DYNAMIC";
  const products = Object.values(plan.value.products);
  const product = products.find(
    ({ title, period }) =>
      title === size && (getTarification(period) === props.mode || isDynamic)
  );

  return { ...product?.resources, group: product?.group, meta: product?.meta };
}

async function setProduct(value) {
  emits("update:product-size", value);

  await nextTick();

  if (!plan.value) return;
  const resources = getProduct(value) ?? {};
  const minDisk = (plan.value.meta.minDiskSize ?? {})[options.disk.type];

  setOptions("cpu.size", resources.cpu ?? 0);
  setOptions("ram.size", (resources.ram ?? 0) / 1024);
  setOptions("disk.size", resources.disk ?? (minDisk ?? 20) * 1024);

  const osKey = Object.keys(images.value)[0];
  const osName = images.value[osKey].name;
  setOptions("os.id", +osKey);
  setOptions("os.name", osName);

  const name = `VPN Server ${osName}`;

  let count = 1;
  instancesStore.instances.forEach((instance) => {
    if (instance.title.startsWith(name)) {
      count++;
    }
  });

  authData.value.vmName = name + (count > 1 ? " " + count : "");

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
