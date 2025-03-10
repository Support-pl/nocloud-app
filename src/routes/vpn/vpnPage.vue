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
                  <div
                    :style="{
                      display: ' flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: isInstanceInit ? '' : '5px',
                    }"
                  >
                    <span style="font-size: 1rem">
                      {{ t(`vpn.status.${instanceStatus.title}`) }}
                    </span>

                    <a-spin
                      :indicator="indicator"
                      style="margin-left: 5px; margin-top: 5px; color: orange"
                      v-if="isInstanceInit"
                    />
                  </div>
                </a-tag>
              </div>
            </div>

            <div class="service-page__actions">
              <a-button
                @click="startInstance"
                :loading="loadingAction == 'start'"
                :disabled="isStartDisabled"
                v-if="!isStartDisabled"
                :icon="h(startIcon)"
                >{{ t("vpn.actions.start") }}</a-button
              >
              <a-button
                type="primary"
                v-else-if="wgEasyLink"
                @click="goToAdminMenu"
                :icon="h(controlPanelIcon)"
              >
                {{ t("vpn.actions.go_to_admin_menu") }}
              </a-button>

              <a-button
                @click="isSettingsOpen = true"
                :loading="loadingAction == 'settings'"
                :disabled="isInstancePending || isInstanceInit"
                :icon="h(settingsIcon)"
                >{{ t("vpn.actions.settings") }}</a-button
              >

              <a-button
                :loading="loadingAction == 'stop'"
                :disabled="isStopDisabled"
                @click="stopInstance"
                :icon="h(stopIcon)"
              >
                {{ t("vpn.actions.stop") }}
              </a-button>
              <a-button
                @click="isHardResetOpen = true"
                :loading="loadingAction == 'hard-reset'"
                danger
                :disabled="isInstancePending || isInstanceInit"
                :icon="h(hardResetIcon)"
                >{{ t("vpn.actions.hard_reset") }}</a-button
              >
              <a-button
                @click="deleteInstance"
                :loading="loadingAction == 'delete'"
                danger
                :icon="h(deleteIcon)"
                >{{ t("vpn.actions.delete") }}</a-button
              >
            </div>

            <div v-if="isConnectVisible" class="connect_window">
              <div class="instruction">
                {{ t("vpn.labels.connect_to_vpn_instruction") }}

                <a
                  style="display: block"
                  target="_blank"
                  href="https://blog.support.by/instructions/%d0%9a%d0%b0%d0%ba-%d0%b7%d0%b0%d0%ba%d0%b0%d0%b7%d0%b0%d1%82%d1%8c-vds-%d1%81-vpn/"
                >
                  {{ t("vpn.labels.links.full_instruction") }}
                </a>

                <a
                  style="display: block"
                  target="_blank"
                  href="https://www.wireguard.com/install/"
                >
                  {{ t("vpn.labels.links.official_site") }}
                </a>

                <a
                  style="display: block"
                  target="_blank"
                  href="https://youtu.be/eVsS_7kpd0s"
                >
                  {{ t("vpn.labels.links.video_connect") }}
                </a>

                <a
                  style="display: block"
                  target="_blank"
                  href="https://youtu.be/Ea6xkQ-7-bk"
                >
                  {{ t("vpn.labels.links.video_manage") }}
                </a>
              </div>

              <div class="copy-button">
                <a-button
                  @click="copyConfigToClipboard"
                  style="margin-right: 10px"
                  >{{ t("vpn.actions.copy_config") }}</a-button
                >
                <a-button @click="downloadConfigFile">{{
                  t("vpn.actions.download_config_file")
                }}</a-button>
              </div>

              <div class="or">
                <span>{{ t("vpn.labels.or") }}</span>
              </div>

              <div class="qr-code">
                <a-qrcode
                  :value="wgConfig"
                  :size="300"
                  error-level="M"
                  type="svg"
                />
                <span>
                  {{ t("vpn.labels.configuration_qr_code") }}
                </span>
              </div>
            </div>

            <div class="error_state_message" v-if="isWarningMessageVisible">
              <warning-icon class="warning_icon" />
              <span>
                {{ t("vpn.labels.error_state_message") }}
              </span>
            </div>

            <!-- 
            <iframe
              width="100%"
              height="600px"
              style="border: none; display: none"
              onload="this.style.display = 'block';"
              v-if="iframeWgEasyLink"
              :src="iframeWgEasyLink"
            />
            -->
          </div>
        </template>

        <loading v-else />
      </div>
    </div>

    <a-modal
      v-model:open="isHardResetOpen"
      :title="t('vpn.actions.hard_reset')"
      @ok="hardResetInstance"
      :ok-text="t('Ok')"
      :cancel-text="t('Cancel')"
    >
      <div>
        <span>{{ t("vpn.labels.hard_reset_help_message") }}</span>

        <div v-if="isInstanceConfigData" class="hard_reset_override">
          <span style="margin-right: 10px">{{
            t("vpn.labels.change_client_info")
          }}</span>
          <a-switch v-model:checked="hardResetData.isOverride" />
        </div>

        <a-form
          v-if="isInstanceConfigData"
          ref="hardResetForm"
          class="hard_reset_config_form"
          :model="hardResetData.config"
          name="basic"
          autocomplete="off"
          :disabled="!hardResetData.isOverride"
        >
          <a-form-item
            class="config__field"
            name="username"
            :label="t('vpn.fields.username')"
            :rules="[requiredRule]"
          >
            <a-input
              v-model:value="hardResetData.config.username"
              :placeholder="t('vpn.fields.username')"
            />
          </a-form-item>

          <a-form-item
            name="password"
            :rules="[requiredRule]"
            class="config__field"
            :label="t('vpn.fields.password')"
          >
            <a-input-password
              v-model:value="hardResetData.config.password"
              :placeholder="t('vpn.fields.password')"
            />
          </a-form-item>

          <a-form-item
            name="host"
            :rules="[requiredRule]"
            class="config__field"
            :label="t('vpn.fields.host')"
          >
            <a-input
              v-model:value="hardResetData.config.host"
              :placeholder="t('vpn.fields.host')"
            />
          </a-form-item>

          <a-form-item
            :label="t('vpn.fields.port')"
            name="port"
            :rules="[requiredRule]"
            class="config__field"
          >
            <a-input
              v-model:value="hardResetData.config.port"
              :placeholder="t('vpn.fields.port')"
              type="number"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <a-modal
      v-model:open="isSettingsOpen"
      :title="t('vpn.labels.settings')"
      @ok="updateSettins"
      :ok-text="t('Save')"
      :cancel-text="t('Cancel')"
    >
      <div>
        <a-form
          ref="settingsForm"
          class="settings_form"
          :model="settingsData"
          name="basic"
          autocomplete="off"
        >
          <a-form-item
            class="config__field"
            name="wg_port"
            :label="t('vpn.fields.wg_port')"
            :rules="[requiredRule]"
          >
            <a-input
              v-model:value="settingsData.wg_port"
              :placeholder="t('vpn.fields.wg_port')"
            />
          </a-form-item>
        </a-form>
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
import { storeToRefs } from "pinia";

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
const warningIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/WarningOutlined")
);
const controlPanelIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ControlOutlined")
);
const settingsIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SettingOutlined")
);

const loadingOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);

const indicator = h(loadingOutlined, {
  style: {
    fontSize: "24px",
  },
  spin: true,
});

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const instancesStore = useInstancesStore();
const { instances } = storeToRefs(useInstancesStore());

const wgConfig = ref("");
const nowDate = ref();
const loadingAction = ref("");
const isHardResetOpen = ref(false);
const hardResetData = ref({
  isOverride: false,
  config: {},
});
const hardResetForm = ref(null);
const isSettingsOpen = ref(false);
const settingsForm = ref(null);
const settingsData = ref({
  wg_port: "",
});

onMounted(async () => {
  if (instance.value) {
    nowDate.value = Date.now() / 1000;
    subscribeToUpdates();
    return;
  }

  try {
    await instancesStore.fetch();

    if (!instance.value) {
      throw new Error();
    }

    subscribeToUpdates();
  } catch {
    router.replace({ name: "services" });
  }
});

const instance = computed(() =>
  instances.value.find((instance) => instance.uuid === route.params.uuid)
);

const lastMonitoring = computed(() => {
  return +instance.value?.state?.meta?.monitored;
});

const instanceStatus = computed(() => {
  if (instance.value?.state?.state != "RUNNING") {
    return { color: "blue", title: "pending" };
  }

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

const isInstancePending = computed(
  () => instanceStatus.value.title === "pending"
);

const isInstanceInit = computed(() => instanceStatus.value.title === "init");

const isConnectVisible = computed(
  () =>
    !["error", "init", "stopped", "unreachable"].includes(
      instanceStatus.value.title
    ) && wgConfig.value
);

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

const isWarningMessageVisible = computed(() => {
  return ["error", "unreachable"].includes(instanceStatus.value.title);
});

const wgEasyHost = computed(
  () => `http://${instanceConnectData.value.host}:51821`
);

const wgEasyLink = computed(() => {
  if (
    !instance.value.config.meta?.wg_easy_password ||
    instanceStatus.value.title !== "active"
  ) {
    return "";
  }

  return `${wgEasyHost.value}/?password=${btoa(
    instance.value.config.meta?.wg_easy_password
  )}&theme=${localStorage.getItem("theme")}&lang=${locale.value}`;
});

const parentInstance = computed(() =>
  instances.value.find(({ uuid }) => uuid === instance.value.config.instance)
);

const isInstanceConfigData = computed(
  () =>
    instance.value.config.host &&
    instance.value.config.password &&
    instance.value.config.username &&
    instance.value.config.port
);

const instanceConnectData = computed(() => {
  if (isInstanceConfigData.value) {
    return {
      password: instance.value.config.password,
      username: instance.value.config.username,
      host: instance.value.config.host,
      port: instance.value.config.port,
    };
  }

  if (parentInstance) {
    const { host, port } = parentInstance.value.state?.interfaces?.find(
      (int) => int.kind == "SSH"
    )?.data;

    return {
      password: parentInstance.value.config.password,
      username: parentInstance.value.config.username,
      host: host || "",
      port: port || "",
    };
  }

  return {};
});

const requiredRule = computed(() => ({
  required: true,
  message: t("ssl_product.field is required"),
  trigger: "blur",
}));

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

const subscribeToUpdates = () => {
  instancesStore.subscribeWebSocket(instance.value.uuidService);
  wgConfig.value = instance.value.state?.meta?.wireguard_config;
};

watch(
  () => instance.value?.state?.meta?.wireguard_config,
  (value) => {
    wgConfig.value = value;
  }
);

const updateSettins = async () => {
  await settingsForm.value?.validate();

  try {
    loadingAction.value = "settings";

    isSettingsOpen.value = false;

    const response = await instancesStore.invokeAction({
      uuid: instance.value.uuid,
      action: "vpn",
      params: {
        wg_port: settingsData.value.wg_port,
        action: "create",
      },
    });

    if (response?.meta?.errors) {
      throw new Error(response.meta.errors[0].code);
    }
  } catch (err) {
    let title = "",
      message = "";

    switch (err.message) {
      case "UNREACHABLE": {
        title = "vpn.errors.unreachable.title";
        message = "vpn.errors.unreachable.message";
        break;
      }
      default: {
        title = "vpn.errors.unknown.title";
        message = "vpn.errors.unknown.message";
        break;
      }
    }
    Modal.error({ title, content: h("span", t(message)) });
  } finally {
    loadingAction.value = "";
  }
};

const hardResetInstance = async () => {
  await hardResetForm.value?.validate();

  try {
    loadingAction.value = "hard-reset";

    let data;

    if (hardResetData.value.isOverride) {
      data = { ...hardResetData.value.config };
    } else {
      data = {
        ...instanceConnectData.value,
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

    if (hardResetData.value.isOverride && isInstanceConfigData.value) {
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
    let title = "",
      message = "";

    switch (err.message) {
      case "UNREACHABLE": {
        title = "vpn.errors.unreachable.title";
        message = "vpn.errors.unreachable.message";
        break;
      }
      default: {
        title = "vpn.errors.unknown.title";
        message = "vpn.errors.unknown.message";
        break;
      }
    }
    Modal.error({ title, content: h("span", t(message)) });
  } finally {
    loadingAction.value = "";
  }
};

const deleteInstance = async () => {
  Modal.confirm({
    title: t("Do you want to delete this service?"),
    content: t("All data will be deleted!"),
    okText: t("Confirm"),
    okType: "danger",
    cancelText: t("Cancel"),
    onOk: async () => {
      try {
        loadingAction.value = "delete";

        await instancesStore.deleteInstance(instance.value.uuid);
        if (!isInstanceConfigData.value) {
          await instancesStore.deleteInstance(instance.value.config.instance);
        }

        router.go(-1);

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

const goToAdminMenu = () => {
  window.open(wgEasyLink.value, "_blanc");
};

watch(lastMonitoring, () => {
  nowDate.value = Date.now() / 1000;
});

watch(instanceStatus, (curr, prev) => {
  if (curr.title == "active" && !["active", "pending"].includes(prev.title)) {
    instancesStore.fetchOne(false, { uuid: instance.value.uuid });
  }
});

watch(isHardResetOpen, () => {
  hardResetData.value.config = {
    ...instanceConnectData.value,
  };
});

watch(isSettingsOpen, () => {
  settingsData.value.wg_port = /ListenPort = \w+/
    .exec(wgConfig.value)?.[0]
    .split(" = ")?.[1];
});

watch(
  () => instance.value?.state?.meta?.wireguard_config,
  (val) => {
    wgConfig.value = "";

    setTimeout(() => {
      wgConfig.value = val;
    }, 1);
  }
);

// watch(instanceStatus, async (state) => {
//   if (state.title === "active") {
//     wgEasyToken.value = "";

//     const response = await api.post(`${wgEasyHost.value}/api/token`, {
//       password: instance.value.config.meta.wg_easy_password,
//     });

//     wgEasyToken.value = response.data.token;
//   } else {
//     wgEasyToken.value = "";
//   }
// });
</script>

<style scoped>
.service-page {
  padding-top: 20px;
}

.service-page .container {
  max-width: 900px;
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
  margin: 5px 5px;
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
  font-size: 1.3rem;
  margin: 10px 0px;
  text-align: center;
}

.connect_window .instruction a {
  font-size: 1rem;
  margin: 5px 0px;
  text-align: center;
}

.connect_window .copy-button {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.connect_window .copy-button button {
  margin: 5px 0px;
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

.error_state_message {
  display: flex;
  margin-top: 10px;
  flex-direction: column;
  min-height: 20vh;
  justify-content: center;
  align-items: center;
}

.error_state_message span {
  text-align: center;
  font-size: 1.5rem;
  max-width: 450px;
}

.error_state_message .warning_icon {
  font-size: 2rem;
  color: var(--err);
}
</style>

<style>
.ant-col.ant-form-item-label {
  min-width: 90px;
  display: flex;
}
</style>
