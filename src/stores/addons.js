import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { createPromiseClient } from "@connectrpc/connect";

import { AddonsService } from "nocloud-proto/proto/es/billing/billing_connect";
import { ListAddonsRequest } from "nocloud-proto/proto/es/billing/addons/addons_pb";
import { useAppStore } from "./app.js";
import { Addon } from "nocloud-proto/proto/es/billing/addons/addons_pb.js";
import { DescriptionsService } from "nocloud-proto/proto/es/billing/billing_connect";
import { useDescriptionsStore } from "./descriptions.js";

export const useAddonsStore = defineStore("addons", () => {
  const app = useAppStore();
  const descriptionsStore = useDescriptionsStore();

  const addonsApi = computed(() =>
    createPromiseClient(AddonsService, app.transport)
  );

  const addons = ref([]);
  const cachedAddons = ref({});
  const isLoading = ref(false);

  async function fetch(options) {
    isLoading.value = true;
    try {
      const response = await addonsApi.value.list(
        ListAddonsRequest.fromJson(options)
      );

      const data = response.addons.map((addon) => addon.toJSON());

      await Promise.all(
        data
          .map((a) => ({ uuid: a.uuid, description: a.descriptionId }))
          .filter((v) => !!v.description)
          .map(async (a) => {
            const description = await descriptionsStore.fetchById(
              a.description
            );

            const dataIndex = data.findIndex((d) => d.uuid === a.uuid);
            data[dataIndex].description = description.text;
          })
      );

      addons.value = data;

      return response;
    } catch (error) {
      console.debug(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCached(uuids) {
    try {
      const response = await Promise.all(
        uuids.map((uuid) => addonsApi.value.get(Addon.fromJson({ uuid })))
      );

      response
        .map((addon) => addon.toJSON())
        .forEach((a) => (cachedAddons.value[a.uuid] = a));
      return response;
    } catch (error) {
      console.debug(error);
      throw error;
    }
  }

  const loading = computed(() => isLoading.value);

  return {
    addons,
    cachedAddons,
    loading,

    fetch,
    fetchCached,
  };
});
