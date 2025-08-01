import { computed, reactive, ref, watch } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { useAuthStore } from "./auth.js";
import { useSpStore } from "./sp.js";
import { usePlansStore } from "./plans.js";
import { useNamespasesStore } from "./namespaces.js";
import { useInstancesStore } from "./instances.js";
import useCreateInstance from "@/hooks/instances/create.js";
import { checkPayg } from "@/functions.js";
import { usePromocodesStore } from "./promocodes.js";
import { useAddonsStore } from "./addons.js";
import useCurrency from "@/hooks/utils/currency.js";
import { useAppStore } from "./app.js";

export const useCloudStore = defineStore("cloud", () => {
  const router = useRouter();
  const i18n = useI18n();
  const { createInstance } = useCreateInstance();
  const { currency } = useCurrency();

  const authStore = useAuthStore();
  const spStore = useSpStore();
  const plansStore = usePlansStore();
  const namespacesStore = useNamespasesStore();
  const instancesStore = useInstancesStore();
  const promocodesStore = usePromocodesStore();
  const addonsStore = useAddonsStore();
  const appStore = useAppStore();

  const authData = reactive({
    vmName: "",
    username: "",
    hostname: "",
    password: "",
    password_valid: true,
    sshKey: undefined,
    score: null,
    is_username_valid: true,
  });
  const deployMessage = i18n.t("VM created successfully");

  const locationId = ref("Location");
  const showcaseId = ref("");
  const planId = ref();
  const promocode = ref();
  const planWithApplyedPromocode = ref();
  const serviceId = ref();
  const namespaceId = ref();

  const showcases = computed(() => {
    const result = [{ title: "all", uuid: "" }];

    spStore.showcases.forEach((showcase) => {
      if (showcase.locations.length < 1) return;

      result.push(showcase);
    });

    return result;
  });

  const locations = computed(() => {
    const locations = [];

    showcases.value.forEach((showcase) => {
      showcase.locations?.forEach((location) => {
        const sp = spStore.servicesProviders.find(
          ({ uuid, locations }) =>
            locations.find(
              ({ id, type }) =>
                location.id.includes(id) && location.type === type
            ) && showcase.items.find((item) => item.servicesProvider === uuid)
        );

        if (showcaseId.value === "" || showcaseId.value === showcase.uuid) {
          locations.push({
            ...location,
            sp: sp?.uuid,
            showcase: showcase.uuid,
          });
        }
      });
    });

    return locations;
  });

  const provider = computed(() => {
    const { sp } =
      locations.value.find(({ id }) => id === locationId.value) ?? {};

    return spStore.servicesProviders.find(({ uuid }) => uuid === sp) ?? null;
  });

  const plan = computed(
    () => plansStore.plans.find(({ uuid }) => uuid === planId.value) ?? {}
  );

  const service = computed(
    () =>
      instancesStore.services.find(({ uuid }) => uuid === serviceId.value) ?? {}
  );

  async function createOrder(options, product) {
    localStorage.removeItem("data");

    appStore.onLogin.redirect = "";
    appStore.onLogin.info = {};

    const [newInstance, newGroup] = setInstance(options, product);
    let instancesGroups;

    if (newGroup.type === "ovh") {
      newInstance.config = {
        ...options.config,
        type: plan.value.type.split(" ")[1],
        auto_renew: false,
      };

      if (newInstance.config.type === "cloud") {
        const { resources } = plan.value.products[newInstance.product];

        newInstance.config.auto_renew = true;
        newInstance.resources = { ...resources, ips_private: 0, ips_public: 1 };
      }
    } else if (newGroup.type === "keyweb") {
      newInstance.config = {
        ...options.config,
        auto_renew: checkPayg(newInstance),
      };
      newInstance.resources = {};
    }

    if (service.value?.instancesGroups?.length < 1) {
      service.value.instancesGroups = [newGroup];
    }

    if (serviceId.value) {
      const response = await updateService(newGroup, newInstance, options);

      instancesGroups = response.instancesGroups;
    } else {
      const response = await createService(newInstance);

      instancesGroups = response.instancesGroups;
    }

    if (!checkPayg(newInstance)) {
      const { instances } =
        instancesGroups.find(({ sp }) => sp === provider.value.uuid) ?? {};
      let instance;

      for (let i = instances.length - 1; i >= 0; i--) {
        const {
          title,
          billingPlan: { uuid },
        } = instances[i];
        const isIdsEqual = uuid === newInstance.billing_plan.uuid;

        if (title === newInstance.title && isIdsEqual) {
          instance = instances[i];
        }
      }
      const { access } = namespacesStore.namespaces.find(
        ({ uuid }) => uuid === namespaceId.value
      );
      const account = access.namespace ?? namespaceId.value;

      router.push({ path: "/billing" });
    } else {
      router.push({ path: "/services" });
    }
  }

  function setInstance(options, product) {
    const locationItem = locations.value.find(
      ({ id }) => id === locationId.value
    );
    const instance = {
      title: authData.vmName,
      config: {
        location: locationItem.title,
        template_id: options.os.id,
        username: authData.username,
        password: authData.password,
        auto_renew: false,
        auto_start: plan.value.meta.auto_start,
      },
      resources: {
        cpu: options.cpu.size,
        ram: options.ram.size * 1024,
        drive_type: options.disk.type,
        drive_size: options.disk.size,
        ips_private: options.network.private.count,
        ips_public: options.network.public.count,
      },
      billing_plan: plan.value,
      addons: options.addons,
    };

    instance.config.auto_renew = checkPayg(instance);

    if (plan.value.kind === "STATIC" || plan.value.type !== "ione") {
      instance.product = product.value.key;
    }
    if (authData.sshKey && plan.value.type === "ovh cloud") {
      instance.config.ssh = authData.sshKey;
    } else if (authData.sshKey) {
      instance.config.ssh_public_key = authData.sshKey;
    }

    const group = {
      title: authStore.userdata.title + Date.now(),
      resources: { ips_private: 0, ips_public: 0 },
      type: provider.value.type,
      instances: [],
      sp: provider.value.uuid,
    };

    return [instance, group];
  }

  function createService(newInstance) {
    const orderData = {
      namespace: namespaceId.value,
      service: {
        title: authStore.userdata.title,
        context: {},
        version: "1",
        instancesGroups: [
          {
            title: authStore.userdata.title + Date.now(),
            resources: {
              ips_private: newInstance.resources.ips_private,
              ips_public: newInstance.resources.ips_public,
            },
            type: provider.value.type,
            instances: [],
            sp: provider.value.uuid,
          },
        ],
      },
    };

    return createInstance(
      "create",
      orderData,
      newInstance,
      provider.value.uuid,
      promocode.value?.uuid,
      null,
      deployMessage
    );
  }

  function updateService(newGroup, newInstance) {
    const orderData = Object.assign({}, service.value);
    let group = orderData.instancesGroups.find(
      (el) => el.sp === provider.value.uuid && !el.data?.imported
    );

    if (!group) {
      orderData.instancesGroups.push(newGroup);
      group = orderData.instancesGroups.at(-1);
    }

    const res = group.instances.reduce(
      (prev, curr) => ({
        private: prev.private + (curr.resources.ips_private ?? 0),
        public: prev.public + (curr.resources.ips_public ?? 0),
      }),
      {
        private: newInstance.resources.ips_private ?? 0,
        public: newInstance.resources.ips_public ?? 0,
      }
    );

    group.resources.ips_private = res.private;
    group.resources.ips_public = res.public;

    return createInstance(
      "update",
      orderData,
      newInstance,
      provider.value.uuid,
      promocode.value?.uuid,
      null,
      deployMessage
    );
  }

  watch([promocode, currency, planId], async () => {
    if (!promocode.value || !planId.value) {
      planWithApplyedPromocode.value = null;
      return;
    }

    const response = await promocodesStore.applyToPlan({
      promocodes: [promocode.value.uuid],
      billingPlan: planId.value,
      addons: addonsStore.addons.map((a) => a.uuid),
    });

    planWithApplyedPromocode.value = response.toJson().billingPlans[0];
  });

  watch(planId, () => {
    promocode.value = null;
  });

  return {
    authData,
    provider,
    plan,

    locationId,
    showcaseId,

    planId,
    promocode,
    planWithApplyedPromocode,
    serviceId,
    namespaceId,

    showcases,
    locations,

    createOrder,
    $reset: () => {
      authData.vmName = "";
      authData.username = "";
      authData.password = "";
      authData.sshKey = null;
      authData.score = null;

      locationId.value = "Location";
      showcaseId.value = "";
      planId.value = null;
      promocode.value = null;
      serviceId.value = null;
      namespaceId.value = null;
    },
  };
});
