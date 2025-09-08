import { useSpStore } from "@/stores/sp.js";
import { storeToRefs } from "pinia";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

function useServiceId(type = "bots") {
  const spStore = useSpStore();
  const { servicesProviders, getShowcases } = storeToRefs(spStore);

  const route = useRoute();
  const router = useRouter();

  const serviceId = computed(() => {
    const filtredSp = servicesProviders.value.filter((sp) => sp.type === type);

    return getShowcases.value.find(
      (showcase) => showcase.uuid === route.query.service
    )
      ? route.query.service
      : getShowcases.value.find((showcase) =>
          filtredSp.find((sp) => showcase.servicesProvider.includes(sp.uuid))
        )?.uuid;
  });

  watch(serviceId, () => {
    if (serviceId.value !== route.query.service) {
      router.replace({ query: { ...route.query, service: serviceId.value } });
    }
  });

  return {
    serviceId,
  };
}

export default useServiceId;
