import { ref } from "vue";

import api from "@/api.js";
import { useAuthStore } from "@/stores/auth.js";

// Live OVH stock for the picked datacenter: the catalog datacenter list on
// product.meta says "we sell it there", this says "OVH can deliver it now".
// ponytail: module-level state, both the plan and the os panel read the same slice
const plans = ref({});
const cache = new Map();

function useVpsAvailability() {
  async function fetchAvailability(sp, datacenter, planCodes) {
    if (!sp || !datacenter || planCodes.length < 1) return;
    // the invoke is for authorized users only
    if (!useAuthStore().isLogged) return;

    const key = `${sp}|${datacenter}|${planCodes.join(",")}`;
    if (cache.has(key)) {
      plans.value = cache.get(key);
      return;
    }

    let result = {};
    try {
      const { meta } = await api.servicesProviders.action({
        uuid: sp,
        action: "get_vps_availability",
        params: { datacenter, planCodes },
      });

      result = meta?.plans ?? {};
    } catch (error) {
      // no answer means no greying: an unknown planCode, an expired token or a
      // sulking OVH must never block an order that would actually go through
      console.error(error);
    }

    cache.set(key, result);
    plans.value = result;
  }

  function isPlanAvailable(planCode) {
    return plans.value[planCode]?.available !== false;
  }

  function isOsAvailable(planCode, osName = "") {
    const plan = plans.value[planCode];

    if (!plan) return true;

    const status = /windows/i.test(osName)
      ? plan.windowsStatus
      : plan.linuxStatus;

    return status === undefined || status === "available";
  }

  // a tariff whose whole OS list is out of stock is not orderable either: the
  // plan-level status only covers the range, not the images bound to it
  function hasOrderableOs(planCode, osNames) {
    if (!plans.value[planCode] || osNames.length < 1) return true;

    return osNames.some((name) => isOsAvailable(planCode, name));
  }

  return {
    availability: plans,
    fetchAvailability,
    isPlanAvailable,
    isOsAvailable,
    hasOrderableOs,
  };
}

export default useVpsAvailability;
