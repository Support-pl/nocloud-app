import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { createPromiseClient } from "@connectrpc/connect";
import { useAppStore } from "./app.js";
import { DescriptionsService } from "nocloud-proto/proto/es/billing/billing_connect";

export const useDescriptionsStore = defineStore("descriptions", () => {
  const app = useAppStore();

  const descriptionsApi = computed(() =>
    createPromiseClient(DescriptionsService, app.transport)
  );
  const cachedADescriptions = ref({});
  const isLoading = ref(false);

  async function fetchById(uuid) {
    isLoading.value = true;
    try {
      if (cachedADescriptions.value[uuid]) {
        return cachedADescriptions.value[uuid];
      }
      cachedADescriptions.value[uuid] = descriptionsApi.value.get({
        uuid: uuid,
      });
      const description = await cachedADescriptions.value[uuid];

      cachedADescriptions.value[uuid] = description;

      return description;
    } catch (error) {
      console.debug(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    fetchById,
    cachedADescriptions,
  };
});
