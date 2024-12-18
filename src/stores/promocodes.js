import { defineStore } from "pinia";
import { createPromiseClient } from "@connectrpc/connect";

import { PromocodesService } from "nocloud-proto/proto/es/billing/billing_connect";
import { useAppStore } from "./app.js";

export const usePromocodesStore = defineStore("promocdes", () => {
  const app = useAppStore();
  const promocodesApi = createPromiseClient(PromocodesService, app.transport);

  return {
    promocodesApi,
  };
});
