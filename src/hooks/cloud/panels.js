import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useCloudStore } from "@/stores/cloud.js";

function useCloudPanels(tarification, options, productSize) {
  const i18n = useI18n();
  const route = useRoute();
  const cloudStore = useCloudStore();

  const region = computed(() => {
    const { extra, title } =
      cloudStore.provider?.locations.find(({ id }) =>
        cloudStore.locationId.includes(id)
      ) ?? {};

    if (!extra) return null;
    return { value: extra.region, title };
  });

  const locationHeader = computed(() => {
    if (!cloudStore.provider) {
      return " ";
    }
    return cloudStore.provider.type === "ione"
      ? ` (${cloudStore.provider.locations[0].title})`
      : ` (${region.value.title})`;
  });

  const planHeader = computed(() => {
    if (cloudStore.provider && cloudStore.plan) {
      if (cloudStore.provider.type !== "ione") {
        return productSize.value ? ` (${productSize.value})` : " ";
      }

      return tarification.value === "Hourly"
        ? ` (VDC ${i18n.t("Pay-as-you-Go")})`
        : ` (VDS ${i18n.t("Pre-Paid")})`;
    }
    return " ";
  });

  const osHeader = computed(() => {
    const osNotExist =
      options.os.name === "" || options.os.name.includes("none");

    return osNotExist ? " " : ` (${options.os.name})`;
  });

  const networkHeader = computed(() => {
    const pub = options.network.public;
    const priv = options.network.private;

    if (!cloudStore.provider) {
      return " ";
    }
    if (pub.status && priv.status) {
      return ` (Public - ${pub.count}, Private - ${priv.count})`;
    }
    if (pub.status) {
      return ` (Public - ${pub.count})`;
    }
    if (priv.status) {
      return ` (Private - ${priv.count})`;
    }
    return " ";
  });

  const isProductExist = computed(() => {
    if (cloudStore.plan.type === "ione") return;
    return !route.query.product && cloudStore.plan.type?.includes("dedicated");
  });

  const panels = computed(() => ({
    location: {
      title: `${i18n.t("Location")}: ${locationHeader.value}`,
    },
    plan: {
      title: `${i18n.t("Plan")}: ${planHeader.value}`,
      disabled: cloudStore.provider ? null : "disabled",
      visible: cloudStore.plan?.type !== "ione-vpn",
    },
    os: {
      title: `${i18n.t(
        cloudStore.plan.type === "ovh dedicated" ? "config" : "os"
      )}: ${osHeader.value}`,
      disabled:
        !cloudStore.provider || !cloudStore.plan || isProductExist.value
          ? "disabled"
          : null,
      visible: cloudStore.plan?.type !== "ione-vpn",
    },
    network: {
      title: `${i18n.t("Network")}: ${networkHeader.value}`,
      disabled: cloudStore.provider ? null : "disabled",
      visible: false, // cloudStore.plan.kind === 'STATIC'
    },
    addons: {
      title: `${i18n.t("Addons")}:`,
      disabled:
        !cloudStore.provider || !cloudStore.plan || isProductExist.value
          ? "disabled"
          : null,
      visible: !["ovh cloud"].includes(cloudStore.plan?.type),
    },
  }));

  return { panels };
}

export default useCloudPanels;
