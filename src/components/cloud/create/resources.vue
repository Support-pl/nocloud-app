<template>
  <transition v-for="(item, key) in resources" :key="key" name="networkApear">
    <a-row
      v-if="item.visible ?? true"
      justify="space-between"
      style="font-size: 1.2rem"
      :style="item.style"
    >
      <a-col>{{ capitalize(item.title) }}:</a-col>
      <a-col>{{ item.value }}</a-col>
    </a-row>
  </transition>
</template>

<script setup>
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useCurrency } from "@/hooks/utils";
import { useCloudStore } from "@/stores/cloud.js";

const props = defineProps({
  productSize: { type: String, required: true },
  tarification: { type: String, required: true },
  minProduct: { type: Object, default: () => ({}) },
  // true while showing the cheapest-matching-plan preview before the user
  // has actually picked a tariff - the tariff name and its traffic/network
  // limits shouldn't be presented as already decided at that point
  isPreview: { type: Boolean, default: false },
});

const i18n = useI18n();
const { currency } = useCurrency();
const cloudStore = useCloudStore();

const [product] = inject("useProduct", () => [])();
const [options] = inject("useOptions", () => [])();
const [priceOVH] = inject("usePriceOVH", () => [])();

const locationTitle = computed(() => {
  if (cloudStore.provider?.type !== "ovh") {
    return cloudStore.provider?.locations[0].title;
  }

  const { configuration = {} } = options.config;
  const key = Object.keys(configuration).find((el) =>
    el.includes("datacenter")
  );

  return cloudStore.provider.locations?.find(
    ({ extra }) =>
      `${extra.region}`.toLowerCase() === `${configuration[key]}`.toLowerCase()
  )?.title;
});

const tariffTitle = computed(() => props.minProduct.title ?? props.productSize);

const cpuSize = computed(() => {
  const result = props.minProduct.resources?.cpu ?? options.cpu.size;
  const text = options.highCPU ? "hCPU" : "vCPU";

  return `${result} ${isNaN(+result) ? "" : text}`;
});

const ramSize = computed(() => {
  const ram = props.minProduct.resources?.ram ?? options.ram.size;
  const size = ram / 1024;

  if (isNaN(size)) return ram;
  if (size > 1024) return `${+(size / 1024).toFixed(1)} Tb`;
  if (size >= 1) return `${+size.toFixed(1)} Gb`;
  return `${+ram.toFixed(1)} Gb`;
});

const gpuSize = computed(() => {
  const { resources } = props.minProduct ?? product.value ?? {};

  if (resources?.gpu_name) {
    return `${resources.gpu_name} (x${resources.gpu_count})`;
  }

  if (resources?.gpu_name) {
    return `${resources.gpu_name} (x${resources.gpu_count})`;
  }

  return false;
});

const diskSize = computed(() => {
  // const x = (cloudStore.plan.type === 'ovh cloud') ? 1000 : 1024
  const disk = props.minProduct.resources?.drive_size ?? options.disk.size;
  const size = disk / 1024;

  if (isNaN(size)) return disk;
  if (size > 1024) return `${(size / 1024).toFixed(1)} Tb`;
  if (size >= 1) return `${size.toFixed(1)} Gb`;
  return `${disk.toFixed(1)} Mb`;
});

const diskType = computed(
  () => options.disk.type ?? props.minProduct.resources?.drive_type
);

const trafficSize = computed(() => {
  const resources = props.minProduct.resources ?? product.value?.resources;
  const tb = resources?.traffic;
  if (tb === undefined || tb === null) return undefined;
  if (tb === 0) return i18n.t("unlimited");

  const size = tb < 1 ? `${tb * 1000} GB` : `${tb} TB`;
  return `${size}/${i18n.t("period.month")}`;
});

const networkSpeed = computed(() => {
  const resources = props.minProduct.resources ?? product.value?.resources;
  const mbps = resources?.network;
  if (!mbps) return undefined;

  return mbps >= 1000 ? `${mbps / 1000} Gbps` : `${mbps} Mbps`;
});

const resources = computed(() => ({
  location: {
    title: i18n.t("location"),
    value: locationTitle.value,
    style: {
      paddingBottom: "5px",
      marginBottom: "10px",
      borderBottom: "1px solid #e8e8e8",
    },
  },
  tarif: {
    title: i18n.t("tariff"),
    value: tariffTitle.value,
    visible: !props.isPreview,
  },

  cpu: {
    title: i18n.t("cpu"),
    value: cpuSize.value,
    visible: parseFloat(cpuSize.value) !== 0,
  },
  ram: {
    title: i18n.t("ram"),
    value: ramSize.value,
    visible: parseFloat(ramSize.value),
  },
  gpu: {
    title: i18n.t("gpu"),
    value: gpuSize.value,
    visible: parseFloat(gpuSize.value),
  },

  drive: {
    title: i18n.t("Drive"),
    value: `${diskType.value} ${diskSize.value}`,
    visible: parseFloat(diskSize.value),
    style: { marginBottom: "5px" },
  },
  traffic: {
    title: i18n.t("traffic"),
    value: trafficSize.value,
    visible: !props.isPreview && !!trafficSize.value,
  },
  network: {
    title: i18n.t("network speed"),
    value: networkSpeed.value,
    visible: !props.isPreview && !!networkSpeed.value,
  },
  os: {
    title: i18n.t("os"),
    value: `${options.os.name} ${
      priceOVH.addons.os
        ? `(${priceOVH.addons.os} ${currency.value.title})`
        : ""
    }`,
    visible: options.os.name && !options.os.name.includes("none"),
    style: { fontSize: "1.1rem" },
  },

  public: {
    title: `${i18n.t("public")} IPv4${
      props.tarification === "Hourly" ? "*" : ""
    }`,
    value: options.network.public.count,
    visible:
      options.network.public.status && cloudStore.provider?.type !== "ovh",
    style: { fontSize: "1.1rem" },
  },
  private: {
    title: `${i18n.t("private")} IPv4`,
    value: options.network.private.count,
    visible: options.network.private.status,
    style: { fontSize: "1.1rem" },
  },
}));
</script>

<script>
export default { name: "CloudResources" };
</script>
