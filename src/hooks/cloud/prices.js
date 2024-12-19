import { computed, ref, watch } from "vue";
import { useCloudStore } from "@/stores/cloud.js";
import { getDisk, getTarification } from "@/functions.js";

function useCloudPrices(
  currentProduct,
  tarification,
  activeKey,
  options,
  priceOVH
) {
  const cloudStore = useCloudStore();

  const startPrice = ref();
  const startPriceWithSale = ref();
  const periodicPrice = ref();

  const plan = computed(() => cloudStore.plan ?? {});

  const planWithSale = computed(
    () => cloudStore.planWithApplyedPromocode ?? plan.value
  );

  const isSaleApply = computed(() => !!cloudStore.planWithApplyedPromocode);

  const product = computed(() => {
    const isActiveKeyNotLoc = activeKey.value !== "location";
    const isTarificationValid = tarification.value !== "-";

    if (isActiveKeyNotLoc && isTarificationValid) {
      return currentProduct.value;
    }

    return getMinProduct(plan.value);
  });

  function setDriveType(target) {
    if (!target.resources.drive_type) {
      if (plan.value.type === "ovh dedicated") {
        target.resources.drive_type = getResource("disk-type", target);
      } else if (plan.value.type === "ovh vps") {
        target.resources.drive_type = "SSD";
      } else {
        target.resources.drive_type = getDriveType();
      }
    }
  }

  function setDriveSize(target) {
    if (!target.resources.drive_size) {
      if (plan.value.type === "ovh dedicated") {
        target.resources.drive_size = getResource("disk-size", target);
      } else if (plan.value.type === "keyweb") {
        target.resources.drive_size = 0;
      } else if (target.resources.disk) {
        target.resources.drive_size = target.resources.disk;
      } else {
        const minDisk = (plan.value.meta.minDiskSize ?? {})[
          target.resources.drive_type
        ];

        target.resources.drive_size = (minDisk ?? 20) * 1024;
      }
    }
  }

  function getDriveType() {
    const drive = { type: "HDD", price: Infinity };

    plan.value.resources.forEach(({ key, price }) => {
      if (key.includes("drive") && price < drive.price) {
        drive.price = price;
        drive.type = key.split("_").at(-1).toUpperCase();
      }
    });

    return drive.type;
  }

  function getResource(type, product) {
    let key = "";

    switch (type) {
      case "ram":
        key = getMinResource("ram", product);

        return parseInt(key.split(" ").at(-1).split("-")[1] ?? 0);

      case "disk-size":
        key = getMinResource("raid", product);

        return getDisk(key) * 1024;

      case "disk-type":
        key = getMinResource("raid", product);

        if (key.includes("hybrid")) return "SSD + HDD";
        else if (key.match(/[0-9]x[0-9]{1,}sa/g)) return "HDD";
        else return "SSD";
    }
  }

  function getMinResource(type, product) {
    const addons = plan.value.resources.filter(
      ({ key }) => key.includes(type) && product.meta.addons.includes(key)
    );

    addons.sort((a, b) => a.price - b.price);
    return addons[0]?.key ?? "";
  }

  function getResourcesPrice(plan) {
    const product = getProduct(plan);

    const price = [];
    for (const resource of plan.resources ?? []) {
      const key = resource.key.toLowerCase();

      if (key.includes("ip")) {
        const { count } =
          activeKey.value !== "location"
            ? options.network.public
            : { count: 1 };

        price.push((resource.price / resource.period) * 3600 * count);
      } else if (key.includes("drive")) {
        const { size } =
          activeKey.value === "location"
            ? {
                size: product.resources?.drive_size ?? options.disk.min * 1024,
              }
            : options.disk;
        const type =
          activeKey.value === "location"
            ? getDriveType().toLowerCase()
            : options.disk.type.toLowerCase();

        if (key !== `drive_${type}`) continue;
        price.push((resource.price / resource.period) * 3600 * (size / 1024));
      } else {
        const { size } =
          activeKey.value === "location"
            ? { size: options[key]?.min ?? 0 }
            : options[key] ?? { size: 0 };

        price.push((resource.price / resource.period) * 3600 * size);
      }
    }
    return price.reduce((accum, item) => accum + item, 0);
  }

  function getProduct(plan) {
    const isActiveKeyNotLoc = activeKey.value !== "location";
    const isTarificationValid = tarification.value !== "-";

    if (isActiveKeyNotLoc && isTarificationValid) {
      return plan.products[currentProduct.value.key];
    }

    return getMinProduct(plan);
  }

  function getMinProduct(plan) {
    const config = options.config.configuration ?? {};
    const datacenter = Object.keys(config).find((key) =>
      key.includes("datacenter")
    );
    const values = Object.values(plan.products ?? {}).filter(
      (product) => product.public
    );

    values.sort((a, b) => a.price - b.price);
    const result = values.find(
      ({ period, meta = {} }) =>
        tarification.value === getTarification(period) &&
        (meta.datacenter?.includes(config[datacenter]) ||
          !plan.type.includes("ovh"))
    );

    if (!result) return {};
    if (result.meta?.cpu) result.resources.cpu = result.meta?.cpu;

    if (!result.resources.ram) {
      result.resources.ram = getResource("ram", result);
    }

    setDriveType(result);
    setDriveSize(result);
    return result;
  }

  function getProductPrice(plan) {
    if (!plan) return 0;
    const values = Object.values(plan.products ?? {}).filter(
      (product) => product.public
    );
    const product = getProduct(plan);
    const value =
      activeKey.value !== "location"
        ? values.find(({ title }) => title === product.title)
        : product;

    if (!value) return 0;
    return (value.price / value.period) * 3600 * 24 * 30;
  }

  function getOvhprice(plan) {
    const { value, addons } = priceOVH;
    const addonsPrice = Object.values(addons).reduce((a, b) => a + b, 0);

    if (activeKey.value === "location") {
      const product = getProduct(plan);
      return product.price ?? value;
    }

    return value + addonsPrice;
  }

  function getFullPrice(plan, withInstallationFee = false) {
    const resourcesPrice =
      plan.type === "ione" ? getResourcesPrice(plan) * 24 * 30 : 0;
    const addonsPrice = Object.values(priceOVH.addons).reduce(
      (result, value) => result + value,
      0
    );

    let price = 0;
    let period = "";

    switch (tarification.value) {
      case "Annually":
        period = "year";
        break;
      case "Biennially":
        period = "2 years";
        break;
      case "Monthly":
        period = "month";
        break;
      case "Daily":
        period = "day";
        break;
      case "Hourly":
        period = "hour";
        price = getResourcesPrice(plan);
    }

    if (plan.type?.includes("ovh") || plan.type === "keyweb") {
      period = "hour";
      price = getOvhprice(plan);
    } else if (plan.kind === "STATIC") {
      price = getProductPrice(plan);
    }
    if (withInstallationFee) {
      const product = getProduct(plan);
      price += product.installationFee ?? 0;
    }

    switch (period) {
      case "minute":
        return price / 60;
      case "week":
        return (price / 30) * 7;
      case "hour":
        return price;
      case "day":
        return (price + resourcesPrice) / 30 + addonsPrice;
      case "month":
        return price + resourcesPrice + addonsPrice;
      case "year":
        return ((price + resourcesPrice) / 30) * 365 + addonsPrice;
      case "2 years":
        return ((price + resourcesPrice) / 30) * 365 * 2 + addonsPrice;
      default:
        console.error("[VDC Calculator]: Wrong period in calc.", period);
        return 0;
    }
  }

  watch([plan, planWithSale, currentProduct, product, options], () => {
    periodicPrice.value = getFullPrice(plan.value);
    startPrice.value = getFullPrice(plan.value, true);
    startPriceWithSale.value = getFullPrice(planWithSale.value, true);
  });

  return {
    minProduct: product,
    startPrice,
    periodicPrice,
    isSaleApply,
    startPriceWithSale,
  };
}

export default useCloudPrices;
