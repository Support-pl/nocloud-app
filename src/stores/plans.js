import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api.js";
import { BillingService } from "nocloud-proto/proto/es/billing/billing_connect";
import { useAppStore } from "./app.js";
import { createPromiseClient } from "@connectrpc/connect";

export const usePlansStore = defineStore("plans", () => {
  const app = useAppStore();
  const plans = ref([]);
  const isLoading = ref(false);

  const plansApi = createPromiseClient(BillingService, app.transport);

  function setPlans(value) {
    plans.value = value.map((plan) => {
      plan.resources = plan.resources.map((resource) => ({
        ...resource,
        price: +resource.price.toFixed(2),
      }));

      Object.entries(plan.products).forEach(([key, product]) => {
        plan.products[key].price = +product.price.toFixed(2);
      });

      return plan;
    });
  }

  return {
    plans,
    isLoading,
    setPlans,

    async fetch(params) {
      try {
        isLoading.value = true;
        const response = await api.plans.list(params);

        plans.value = response.pool;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },

    async fetchById(id) {
      try {
        const headers = new Headers();
        headers.set("NoCloud-Primary-Currency-Precision-Override", 8);

        // await client.say({ sentence: "Hello" }, { headers: headers });

        isLoading.value = true;

        const response = (
          await plansApi.getPlan({ uuid: id }, { headers: headers })
        ).toJSON();

        plans.value = response.pool;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },
  };
});
