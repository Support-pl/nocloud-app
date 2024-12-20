import { defineStore } from "pinia";
import { createPromiseClient } from "@connectrpc/connect";

import { PromocodesService } from "nocloud-proto/proto/es/billing/billing_connect";
import { useAppStore } from "./app.js";
import { ApplySaleRequest } from "nocloud-proto/proto/es/billing/billing_pb";

export const usePromocodesStore = defineStore("promocdes", () => {
  const app = useAppStore();
  const promocodesApi = createPromiseClient(PromocodesService, app.transport);

  function applyToPlan({ promocodes, billingPlan, addons }) {
    return promocodesApi.applySale(
      ApplySaleRequest.fromJson({
        promocodes,
        billingPlan,
        addons,
      })
    );
  }

  return {
    promocodesApi,

    applyToPlan,
  };
});
