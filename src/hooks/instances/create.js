import { message as openMessage } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import { useInstancesStore } from "@/stores/instances.js";
import api from "@/api.js";
import { CreateRequest } from "nocloud-proto/proto/es/instances/instances_pb";
import { removeEmptyValues } from "@/functions.js";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.js";
import { useNamespasesStore } from "@/stores/namespaces.js";

function useCreateInstance() {
  const i18n = useI18n();
  const instancesStore = useInstancesStore();
  const { services } = storeToRefs(instancesStore);
  const authStore = useAuthStore();
  const namespasesStore = useNamespasesStore();

  const { openNotification } = useNotification();

  async function deployService(uuid, message) {
    try {
      await api.services.up(uuid);

      if (message) openMessage.success(message);
      else openNotification("success", { message: i18n.t("Done") });
    } catch (error) {
      const message = error.response?.data?.message ?? error.message ?? error;

      openNotification("error", { message: i18n.t(message) });
    }
  }

  async function createInstance(
    instance,
    { provider, instancesGroupType, promocode }
  ) {

    //original values
    const service = services.value.filter((s) => s.status !== "DEL")[0];
    const namespace = namespasesStore.namespaces[0];

    //Instance title make unique
    const same = instancesStore.getInstances.filter((inst) =>
      inst.title.startsWith(instance.title)
    );

    if (same.length > 0) {
      instance.title = `${instance.title} ${same.length + 1}`;
    }

    //Add some base data as AutoRenew & AutoStart
    if (instance.billing_plan?.meta) {
      if (!instance.config) {
        instance.config = {};
      }
      instance.config.auto_start = !!instance.billing_plan.meta.auto_start;
    }

    if (instance.billing_plan?.properties) {
      if (!instance.meta) {
        instance.meta = {};
      }
      instance.meta.autoRenew = !!instance.billing_plan.properties.autoRenew;
    }

    //update or create Service & Instance Group block
    const newService = !service
      ? {
          title: authStore.userdata.title,
          context: {},
          version: "1",
          instancesGroups: [],
        }
      : JSON.parse(JSON.stringify(service));

    let currentGroup = newService.instancesGroups.find(
      ({ sp }) => sp === provider
    );

    if (!currentGroup) {
      newService.instancesGroups.push({
        title: authStore.userdata.title + Date.now(),
        type: instancesGroupType || instance.billing_plan?.type,
        sp: provider,
        instances: [],
      });
      currentGroup = newService.instancesGroups.at(-1);
    }

    //ione fix ips
    if (instance.billing_plan?.type === "ione") {
      if (!currentGroup.resources) {
        currentGroup.resources = {};
      }
      const res = currentGroup.instances.reduce(
        (prev, curr) => ({
          private: prev.private + (curr.resources.ips_private ?? 0),
          public: prev.public + (curr.resources.ips_public ?? 0),
        }),
        {
          private: instance.resources.ips_private ?? 0,
          public: instance.resources.ips_public ?? 0,
        }
      );

      currentGroup.resources.ips_private = res.private;
      currentGroup.resources.ips_public = res.public;
    }

    //real service with uuid & all staff
    let resultService;
    if (!service) {
      resultService = await instancesStore[`createService`]({
        service: newService,
        namespace: namespace.uuid,
      });
    } else {
      resultService = await instancesStore[`updateService`](newService);
    }

    const ig = resultService.instancesGroups.find(
      (el) => el.sp === provider && !el.data?.imported
    );

    //trim instance billing_plan
    instance.billing_plan = {
      uuid: instance.billing_plan.uuid,
    };

    const data = { ig: ig.uuid, instance };
    if (promocode) {
      data.promocode = promocode;
    }

    await instancesStore.instancesApi.create(
      CreateRequest.fromJson(removeEmptyValues(data))
    );

    if (resultService.uuid) {
      await deployService(resultService.uuid);

      return resultService;
    } else {
      throw new Error("[Error]: Service uuid not found");
    }
  }

  return {
    deployService,

    createInstance,
  };
}

export default useCreateInstance;
