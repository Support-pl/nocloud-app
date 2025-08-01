import { message as openMessage } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import { useInstancesStore } from "@/stores/instances.js";
import api from "@/api.js";
import { CreateRequest } from "nocloud-proto/proto/es/instances/instances_pb";
import { removeEmptyValues } from "@/functions.js";

function useCreateInstance() {
  const i18n = useI18n();
  const store = useInstancesStore();
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
    action,
    service,
    instance,
    sp,
    promocode,
    message,
    deployMessage
  ) {
    try {
      console.log(
        instance.billing_plan.meta,
        instance.billing_plan.properties,
        instance.config
      );

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

      instance.billing_plan = {
        uuid: instance.billing_plan.uuid,
      };

      let response;

      if (action === "create") {
        response = await store[`createService`](service);
      } else if (action === "update") {
        response = await store[`updateService`](service);
      }

      const ig = response.instancesGroups.find(
        (el) => el.sp === sp && !el.data?.imported
      );

      const data = { ig: ig.uuid, instance };
      if (promocode) {
        data.promocode = promocode;
      }

      await store.instancesApi.create(
        CreateRequest.fromJson(removeEmptyValues(data))
      );

      if (response.uuid) {
        if (message) openMessage.success(message);
        await deployService(response.uuid, deployMessage);

        return response;
      } else {
        throw new Error("[Error]: Service uuid not found");
      }
    } catch (error) {
      const matched = (
        error.response?.data?.message ??
        error.message ??
        ""
      ).split(/error:"|error: "/);
      const message = matched.at(-1).split('" ').at(0);

      if (message) {
        openNotification("error", { message });
      } else {
        const message = error.response?.data?.message ?? error.message ?? error;

        openNotification("error", { message });
      }

      throw new Error();
    }
  }

  return {
    deployService,

    createInstance,
  };
}

export default useCreateInstance;
