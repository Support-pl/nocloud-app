import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import api from "@/api.js";
import { useRoute } from "vue-router";
import { isUUUID } from "@/functions.js";

export const useSpStore = defineStore("sp", () => {
  const route = useRoute();

  const servicesProviders = ref([]);
  const showcases = ref([]);
  const categories = ref([]);
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
          promo: showcase.promo || {},
          meta: showcase.meta,
        };
      });
    });

    return Object.entries(result).map(([key, showcase]) => ({
      ...showcase,
      servicesProvider: key,
    }));
  });

  async function fetchCategories() {
    try {
      if (categories.value.length) {
        return categories.value;
      }

      const { categories: newCategories } = await api.get(
        "/showcase_categories",
        {
          params: { anonymously: true },
        }
      );

      categories.value = newCategories;
      return categories.value;
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchShowcase(uuid) {
    let index = showcases.value.findIndex((s) => s.uuid === uuid);
    if (showcases.value[index]?.full || !isUUUID(uuid)) {
      return;
    }

    try {
      isShowcasesLoading.value = true;
      const [response] = await Promise.all([
        api.showcases.get(uuid),
        fetchCategories(),
      ]);

      response.full = true;

      index = showcases.value.findIndex((s) => s.uuid === uuid);

      response.categories = (categories.value || []).filter((category) =>
        category.showcases.includes(response.uuid)
      );

      if (index === -1) {
        showcases.value.push(response);
      } else {
        showcases.value[index] = response;
      }

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      isShowcasesLoading.value = false;
    }
  }

  watch(
    () => route.query,
    (val) => {
      if (val.service) {
        fetchShowcase(val.service);
      }
    }
  );

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
        const [{ showcases: newShowcases }] = await Promise.all([
          api.showcases.list({
            anonymously,
            omitPromos: true,
          }),
          fetchCategories(),
        ]);

        newShowcases.forEach((showcase) => {
          const index = showcases.value.findIndex(
            (s) => s.uuid === showcase.uuid
          );

          showcase.categories = (categories.value || []).filter((category) =>
            category.showcases.includes(showcase.uuid)
          );

          if (index === -1) {
            showcases.value.push(showcase);
          } else {
            const promo = { ...showcases.value[index].promo };
            for (const key in Object.keys(showcase.promo)) {
              if (!!promo[key]?.preview) {
                continue;
              }

              promo[key] = showcase.promo[key];
            }

            showcases.value[index] = {
              ...showcase,
              promo: promo,
            };
          }
        });

        return showcases;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isShowcasesLoading.value = false;
      }
    },

    fetchShowcase,

    $reset() {
      servicesProviders.value = [];
      showcases.value = [];
      isLoading.value = false;
      isShowcasesLoading.value = false;
    },
  };
});
