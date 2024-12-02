import { computed, nextTick, ref, watch } from "vue";

import { useAuthStore } from "@/stores/auth.js";
import { useCloudStore } from "@/stores/cloud.js";
import { usePlansStore } from "@/stores/plans.js";

import { useNotification } from "@/hooks/utils";
import { getTarification } from "@/functions.js";
import { useAddonsStore } from "@/stores/addons.js";
import { storeToRefs } from "pinia";
import { useCurrenciesStore } from "@/stores/currencies.js";

function useCloudPlans(tarification, options) {
  const { openNotification } = useNotification();

  const authStore = useAuthStore();
  const plansStore = usePlansStore();
  const {
    locationId,
    locations,
    provider,
    plan,
    planId,
    showcases,
    showcaseId,
  } = storeToRefs(useCloudStore());
  const addonsStore = useAddonsStore();
  const { userCurrency } = storeToRefs(useCurrenciesStore());

  const isPlansLoading = ref(false);
  const productSize = ref("");
  const product = ref({});
  const cachedPlans = ref({});

  const filteredPlans = computed(() => {
    const locationItem = locations.value.find(
      ({ id }) => id === locationId.value
    );

    const { items } =
      showcases.value.find(({ uuid }) => {
        if (showcaseId.value === "") {
          return uuid === locationItem?.showcase;
        }
        return uuid === showcaseId.value;
      }) ?? {};
    const plans = [];
    const publicPlans = plansStore.plans.filter((plan) => plan.public);

    if (!items) return publicPlans;
    items.forEach(({ servicesProvider, plan }) => {
      if (servicesProvider === provider.value?.uuid) {
        plans.push(plan);
      }
    });

    if (plans.length < 1) return publicPlans;
    return publicPlans.filter(
      ({ uuid, type }) => locationItem?.type === type && plans.includes(uuid)
    );
  });

  async function setProduct() {
    await nextTick();
    if (plan.value.type?.includes("cloud")) {
      const period = options.config.monthlyBilling ? "P1M" : "P1H";
      const { planCode } = options.config;

      product.value = {
        ...plan.value.products[`${period} ${planCode}`],
        key: `${period} ${planCode}`,
      };
    } else {
      if (!tarification.value || !productSize.value) return;

      for (let plan of filteredPlans.value) {
        const isHourly = tarification.value === "Hourly";
        const isDynamic = plan.kind === "DYNAMIC";
        const isIone = plan.type === "ione";
        let result = false;
        let uuid = null;

        if (isDynamic && isIone && isHourly) {
          uuid = plan.uuid;
          plan = plansStore.plans.find(
            ({ uuid }) => uuid === plan.meta.linkedPlan
          );
        }

        for (const [key, item] of Object.entries(plan.products)) {
          const { period, title } = item;
          const isEqualKey = plan.type.includes("ovh")
            ? key.split(" ").at(-1) === options.config.planCode
            : true;

          const isEqualSize = title === productSize.value;
          const isHighCpu = options.highCPU === (plan.meta.highCPU ?? false);
          let isEqualPeriod = getTarification(period) === tarification.value;

          if (isDynamic && isIone && isHourly) {
            isEqualPeriod = true;
          }

          if (isEqualPeriod && isEqualKey && isEqualSize && isHighCpu) {
            product.value = { ...item, key };
            planId.value = uuid ?? plan.uuid;

            result = true;
            break;
          }
        }
        if (result) break;
      }
    }
  }

  watch(
    [
      () => options.highCPU,
      () => options.config.planCode,
      tarification,
      productSize,
    ],
    setProduct
  );

  watch([provider, locationId, userCurrency], async ([value]) => {
    if (!value?.uuid) return;

    const cacheKey = `${value.uuid}_${userCurrency.value.code}`;

    options.highCPU = false;

    try {
      isPlansLoading.value = true;

      if (cachedPlans.value[cacheKey]) {
        plansStore.setPlans(cachedPlans.value[cacheKey]);

        const { items } =
          showcases.value.find(({ uuid }) => uuid === showcaseId.value) ?? {};
        const { plan } =
          items?.find((item) => item.locations.includes(locationId.value)) ??
          {};

        planId.value = plan ?? filteredPlans.value[0]?.uuid ?? "";
      } else {
        const { pool } = await plansStore.fetch({
          sp_uuid: provider.uuid,
          anonymously: !authStore.isLogged,
        });
        cachedPlans.value[cacheKey] = pool;
        planId.value = filteredPlans.value[0]?.uuid ?? pool[0]?.uuid ?? "";
      }

      await addonsStore.fetch({
        filters: { plan_uuid: [planId.value] },
      });
    } catch (error) {
      openNotification("error", {
        message: error.response?.data.message ?? error.message ?? error,
      });
    } finally {
      isPlansLoading.value = false;
    }
  });

  return { filteredPlans, product, productSize, isPlansLoading };
}

export default useCloudPlans;
