<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="instance">
          <div class="service-page__header">
            <div class="service-page__title">
              {{ instance.title }}
            </div>

            <div class="service-page__info">
              <div class="service-page__info-title">
                {{ capitalize(t("status")) }}:
                <a-tag size="large" :color="instanceStatus.color">
                  <span style="font-size: 1rem">
                    {{ t(capitalize(instanceStatus.title)) }}
                  </span>
                </a-tag>
              </div>
            </div>

            <div class="service-page__actions">
              <a-button
                @click="startInstance"
                :loading="loadingAction == 'start'"
                :disabled="isStartDisabled"
                :icon="h(startIcon)"
                >Start</a-button
              >
              <a-button
                :loading="loadingAction == 'stop'"
                :disabled="isStopDisabled"
                @click="stopInstance"
                :icon="h(stopIcon)"
                >Stop</a-button
              >
              <a-button
                @click="isHardResetOpen = true"
                :loading="loadingAction == 'hard-reset'"
                danger
                :icon="h(hardResetIcon)"
                >Hard reset</a-button
              >
              <a-button
                @click="deleteInstance"
                :loading="loadingAction == 'delete'"
                danger
                :icon="h(deleteIcon)"
                >Delete</a-button
              >
            </div>

            <div v-if="wgConfig" class="connect_window">
              <div class="instruction">
                <span>Insert the config into the Wireguard application</span>
                <span>Bla bla bla bla bla bla bla bla bla</span>
                <span>Bla bla bla bla bla bla bla bla bla</span>
              </div>

              <div class="copy-button">
                <a-button
                  @click="copyConfigToClipboard"
                  style="margin-right: 10px"
                  >Copy to clipboard</a-button
                >
                <a-button @click="downloadConfigFile">Download file</a-button>
              </div>

              <div class="or">
                <span>Or</span>
              </div>

              <div class="qr-code">
                <a-qrcode
                  :value="wgConfig"
                  :size="300"
                  error-level="M"
                  type="svg"
                />
                <span>
                  {{ t("your QR code") }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <loading v-else />
      </div>
    </div>

    <a-modal
      v-model:open="isHardResetOpen"
      title="Hard reset"
      @ok="hardResetInstance"
    >
      <div>
        <span>{{
          t(
            "Your vpn will be full delete & full install bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla"
          )
        }}</span>

        <div class="hard_reset_override">
          <span style="margin-right: 10px">Change data</span>
          <a-switch v-model:checked="hardResetData.isOverride" />
        </div>

        <div class="hard_reset_config">
          <a-input
            class="config__field"
            :disabled="!hardResetData.isOverride"
            v-model:value="hardResetData.config.username"
            placeholder="Username"
          />
          <a-input-password
            class="config__field"
            :disabled="!hardResetData.isOverride"
            v-model:value="hardResetData.config.password"
            placeholder="Password"
            type="password"
          />
          <a-input
            class="config__field"
            :disabled="!hardResetData.isOverride"
            v-model:value="hardResetData.config.host"
            placeholder="Host"
          />
          <a-input
            class="config__field"
            :disabled="!hardResetData.isOverride"
            v-model:value="hardResetData.config.port"
            placeholder="Port"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import Loading from "@/components/ui/loading.vue";
import { useInstancesStore } from "@/stores/instances";
import { Modal, notification } from "ant-design-vue";
import {
  capitalize,
  computed,
  defineAsyncComponent,
  h,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { UpdateRequest } from "nocloud-proto/proto/es/instances/instances_pb";
import { removeEmptyValues } from "@/functions";

const startIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlayCircleOutlined")
);
const stopIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PauseCircleOutlined")
);
const hardResetIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ReloadOutlined")
);
const deleteIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DeleteOutlined")
);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const instancesStore = useInstancesStore();

const instance = ref();
const nowDate = ref();
const loadingAction = ref("");
const isHardResetOpen = ref(false);
const hardResetData = ref({
  isOverride: false,
  config: {},
});

onMounted(async () => {
  setInstance();

  if (instance.value) {
    return;
  }

  try {
    await instancesStore.fetch();
    setInstance();

    if (!instance.value) {
      throw new Error();
    }
  } catch {
    router.replace({ name: "services" });
  }
});

const lastMonitoring = computed(() => {
  return +instance.value?.state?.meta?.monitored;
});

const instanceStatus = computed(() => {
  if (lastMonitoring.value === 0) {
    return { color: "orange", title: "stopped" };
  }

  if (!lastMonitoring.value) {
    return { color: "orange", title: "init" };
  }

  if (lastMonitoring.value == -1) {
    return { color: "error", title: "error" };
  }

  return nowDate.value - lastMonitoring.value < 60 * 6
    ? { color: "success", title: "active" }
    : { color: "error", title: "unreachable" };
});

const isStartDisabled = computed(
  () =>
    instanceStatus.value.title !== "stopped" ||
    (!!loadingAction.value && loadingAction.value != "start")
);
const isStopDisabled = computed(
  () =>
    instanceStatus.value.title !== "active" ||
    (!!loadingAction.value && loadingAction.value != "stop")
);

const wgConfig = computed(() => instance.value.state?.meta?.wireguard_config);

const setInstance = () => {
  instance.value = instancesStore.instances.find(
    (instance) => instance.uuid === route.params.uuid
  );
  nowDate.value = Date.now() / 1000;
};

const stopInstance = async () => {
  try {
    loadingAction.value = "stop";

    await instancesStore.invokeAction({
      uuid: instance.value.uuid,
      action: "vpn",
      params: {
        action: "stop",
      },
    });
  } finally {
    loadingAction.value = "";
  }
};

const startInstance = async () => {
  try {
    loadingAction.value = "start";

    await instancesStore.invokeAction({
      uuid: instance.value.uuid,
      action: "vpn",
      params: {
        action: "start",
      },
    });
  } finally {
    loadingAction.value = "";
  }
};

const hardResetInstance = async () => {
  try {
    loadingAction.value = "hard-reset";

    let data;

    if (hardResetData.value.isOverride) {
      data = { ...hardResetData.value.config };
    } else {
      data = {
        password: instance.value.config.password,
        username: instance.value.config.username,
        host: instance.value.config.host,
        port: instance.value.config.port,
      };
    }

    isHardResetOpen.value = false;

    const response = await instancesStore.invokeAction({
      uuid: instance.value.uuid,
      action: "vpn",
      params: {
        ...data,
        action: "hard_reset",
      },
    });

    if (response?.meta?.errors) {
      throw new Error(response.meta.errors[0].code);
    }

    if (hardResetData.value.isOverride) {
      const updateData = removeEmptyValues({
        ...instance.value,
        config: { ...instance.value.config, ...data },
      });
      delete updateData.uuidService;
      delete updateData.estimate;
      delete updateData.sp;
      delete updateData.type;

      await instancesStore.instancesApi.update(
        UpdateRequest.fromJson({
          instance: updateData,
        })
      );
    }
  } catch (err) {
    console.log(err);

    let title = "",
      message = "";

    switch (err.message) {
      case "UNREACHABLE": {
        title = "UNREACHABLE";
        message =
          "Please check your sdcnjscndjsccsdvd,bdl v,wedlfm gdkemdqkf dmfkqwmf jd";
        break;
      }
      default: {
        title = "Unknown error";
        message = "Please try again later";
        break;
      }
    }
    Modal.error({ title, content: h("span", message) });
  } finally {
    loadingAction.value = "";
  }
};

const deleteInstance = async () => {
  Modal.confirm({
    title: t("Do you want to delete this service?"),
    content: t("All data will be deleted!"),
    onOk: async () => {
      try {
        loadingAction.value = "delete";

        await instancesStore.deleteInstance({
          uuid: instance.value.uuid,
        });

        notification.success({ message: t("Done"), duration: 1 });
        router.push({ name: "services" });
      } finally {
        loadingAction.value = "";
      }
    },
  });
};

const copyConfigToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(wgConfig.value);
    notification.success({ message: t("Done"), duration: 1 });
  } catch (err) {
    console.log(err);
  }
};

const downloadConfigFile = async () => {
  try {
    const filename = `${instance.value.title}_wireguard.conf`;
    const element = document.createElement("a");

    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(wgConfig.value)}`
    );
    element.setAttribute("download", filename);
    element.style.display = "none";

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => {
      notification.success({ message: t("Done"), duration: 1 });
    }, 0);
  } catch (err) {
    console.log(err);
  }
};

watch(instance, () => {
  if (instance.value) {
    instancesStore.subscribeWebSocket(instance.value.uuidService);
  }
});

watch(lastMonitoring, () => {
  nowDate.value = Date.now() / 1000;
});

watch(isHardResetOpen, () => {
  hardResetData.value.config = {
    password: instance.value.config.password,
    username: instance.value.config.username,
    host: instance.value.config.host,
    port: instance.value.config.port,
  };
});
</script>

<style scoped>
.service-page {
  padding-top: 20px;
}

.service-page-card {
  background: var(--bright_font);
  border-radius: 10px;
  padding: 10px 15px 15px;
}

.service-page__header {
  margin-bottom: 10px;
}

.service-page__title {
  font-size: 1.6rem;
}

.service-page__domain {
  font-size: 1rem;
}

.service-page__info:not(:last-of-type) {
  margin-bottom: 5px;
}

.service-page__info-title {
  font-weight: bold;
}

.service-page__info-value {
  font-size: 1.1rem;
}

.service-page__info-value div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.service-page__actions button {
  margin: 0px 5px;
}

.connect_window .qr-code {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.connect_window .or {
  display: flex;
  justify-content: center;
  font-size: 1.3rem;
  margin-bottom: 10px;
}

.connect_window .instruction {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-size: 1.3rem;
  margin: 10px 0px;
}

.connect_window .copy-button {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

@media screen and (max-width: 768px) {
  .service-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}

.hard_reset_config {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  grid-row-gap: 10px;
}
.hard_reset_override {
  margin: 10px 0px;
}
</style>
