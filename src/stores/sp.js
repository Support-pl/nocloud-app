import { computed, ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api.js";

export const useSpStore = defineStore("sp", () => {
  const servicesProviders = ref([]);
  const showcases = ref([]);
  const isLoading = ref(false);
  const isShowcasesLoading = ref(false);

  const getShowcases = computed(() => {
    const result = {};

    showcases.value.forEach((showcase) => {
      showcase.items.forEach((item) => {
        const key = `${showcase.uuid}-${item.servicesProvider}`;
        const { plans = [] } = result[key] ?? {};

        result[key] = {
          locations: showcase.locations.filter((location) =>
            item.locations.includes(location.id)
          ),
          plans: [...plans, item.plan],
          title: showcase.title,
          uuid: showcase.uuid,
          icon: showcase.icon,
          promo: showcase.promo,
          meta: showcase.meta,
        };
      });
    });

    return Object.entries(result).map(([key, showcase]) => ({
      ...showcase,
      servicesProvider: key,
    }));
  });

  return {
    servicesProviders,
    showcases,
    isLoading,
    isShowcasesLoading,
    getShowcases,

    async fetch(anonymously = false) {
      try {
        isLoading.value = true;
        const response = await api.servicesProviders.list({ anonymously });

        servicesProviders.value = response.pool;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },

    async fetchShowcases(anonymously = false) {
      try {
        isShowcasesLoading.value = true;
        const response = await api.showcases.list({ anonymously });

        showcases.value = response.showcases;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isShowcasesLoading.value = false;
      }
    },

    $reset() {
      servicesProviders.value = [];
      showcases.value = [];
      isLoading.value = false;
      isShowcasesLoading.value = false;
    },
  };
});
