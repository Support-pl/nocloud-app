import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { createPromiseClient } from "@connectrpc/connect";

import { AddonsService } from "nocloud-proto/proto/es/billing/billing_connect";
import { ListAddonsRequest } from "nocloud-proto/proto/es/billing/addons/addons_pb";
import { useAppStore } from "./app.js";

export const useAddonsStore = defineStore("addons", () => {
  const app = useAppStore();
  const addonsApi = createPromiseClient(AddonsService, app.transport);
  const addons = ref([]);
  const isLoading = ref(false);

  async function fetch(options) {
    isLoading.value = true;
    try {
      const response = await addonsApi.list(
        ListAddonsRequest.fromJson(options)
      );

      addons.value = response.addons.map((addon) => addon.toJSON());
      return response;
    } catch (error) {
      console.debug(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  const loading = computed(() => isLoading.value);

  return {
    addons,
    loading,

    fetch,
  };
});
