import { nextTick, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useAuthStore } from "@/stores/auth.js";
import { useCloudStore } from "@/stores/cloud.js";

import { useInstancesStore } from "@/stores/instances.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useSpStore } from "@/stores/sp.js";

function useCloudOptions(activeKey, tarification) {
  const route = useRoute();

  const authStore = useAuthStore();
  const cloudStore = useCloudStore();

  const instancesStore = useInstancesStore();
  const namespasesStore = useNamespasesStore();
  const spStore = useSpStore();

  const dataLocalStorage = ref("");
  const options = reactive({
    highCPU: false,
    cpu: { size: 1, min: 1, max: 8 },
    ram: { size: 1, min: 1, max: 12 },
    disk: { type: "SSD", step: 1, size: 1, min: 20, max: 480 },
    os: { id: -1, name: "" },
    network: {
      public: { status: true, count: 1 },
      private: { status: false, count: 0 },
    },
    config: { addons: [], configuration: {} },
    addons: [],
  });

  watch(
    () => options.os.name,
    () => {
      if (cloudStore.plan.type !== "ione") return;
      if (options.disk.min > 0) return;
      const { id } = options.os;
      const { min_size: minSize } =
        cloudStore.provider.publicData.templates[id] || {};

      options.disk.min = minSize / 1024;
    }
  );

  watch(
    () => options.disk.size,
    () => {
      options.disk.step = 10;
    }
  );

  watch(
    () => [cloudStore.provider, cloudStore.locationId],
    async () => {
      if (!dataLocalStorage.value.config) {
        options.os = { id: -1, name: "" };
      }
      options.config = { configuration: {}, addons: [] };
      options.addons = [];
    }
  );

  watch(
    () => cloudStore.provider,
    (value) => {
      const { min_drive_size: minSize, max_drive_size: maxSize } =
        value?.vars || {};

      if (minSize) {
        options.disk.min = minSize.value[options.disk.type];
      }
      if (maxSize) {
        options.disk.max = maxSize.value[options.disk.type];
      }
    }
  );

  watch(() => options.disk.type, setMinMaxDisk);
  watch(
    () => cloudStore.plan,
    () => {
      setMinMaxDisk();
      setSshKey(cloudStore.serviceId);
    }
  );

  watch(() => cloudStore.serviceId, setSshKey);

  function setSshKey(serviceId) {
    if (!serviceId) return;

    const service = instancesStore.services.find(
      ({ uuid }) => uuid === serviceId
    );
    const group =
      service.instancesGroups.find(({ type }) =>
        cloudStore.plan.type?.includes(type)
      ) ?? {};

    if (group.config?.ssh) {
      cloudStore.authData.sshKey = group.config.ssh;
    }
  }

  function setMinMaxDisk() {
    const { minDiskSize, maxDiskSize } = cloudStore.plan.meta ?? {};

    if (minDiskSize) {
      options.disk.min = +minDiskSize[options.disk.type];
    } else {
      options.disk.min = 20;
    }
    if (maxDiskSize) {
      options.disk.max = +maxDiskSize[options.disk.type];
    }
  }

  async function fetch() {
    await spStore.fetchShowcases(!authStore.isLogged);
    await spStore.fetch(!authStore.isLogged).then(setReadyData);

    if (authStore.isLogged) {
      const [services, namespaces] = await Promise.all([
        instancesStore.fetch(),
        namespasesStore.fetch(),
        authStore.fetchBillingData(),
      ]);

      if (services.pool.length >= 1) {
        cloudStore.serviceId = services.pool[0].uuid;
      }
      if (namespaces.pool.length >= 1) {
        cloudStore.namespaceId = namespaces.pool[0].uuid;
      }
    }
  }

  async function setReadyData() {
    const data = localStorage.getItem("data") ?? route.query.data;

    if (!data) return;
    try {
      await nextTick();
      dataLocalStorage.value = JSON.parse(data);

      tarification.value = dataLocalStorage.value.tarification ?? "";
      cloudStore.authData.vmName = dataLocalStorage.value.titleVM ?? "";
      cloudStore.locationId =
        cloudStore.locations.find(({ id }) => {
          const locationId = dataLocalStorage.value.locationId.split("-");

          locationId.shift();
          return id.includes(locationId.join("-"));
        })?.id ?? "Location";
      activeKey.value = null;

      if (dataLocalStorage.value.config) {
        options.os.id = dataLocalStorage.value.config.template_id;
        options.os.name = dataLocalStorage.value.config.template_name;
      }

      if (dataLocalStorage.value.ovhConfig) {
        options.config = dataLocalStorage.value.ovhConfig;
      }

      if (dataLocalStorage.value.resources) {
        options.disk.size = dataLocalStorage.value.resources.drive_size;
        options.disk.type = dataLocalStorage.value.resources.drive_type;
      }
    } catch {
      localStorage.removeItem("data");
    }
  }

  return { options, dataLocalStorage, fetch };
}

export default useCloudOptions;
