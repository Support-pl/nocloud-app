<template>
  <div class="cloud__fullscreen Fcloud">
    <transition name="opencloud" :duration="600">
      <div v-if="!vmsLoading && (VM.uuid || VM.id)" class="cloud__container">
        <component
          :is="template"
          ref="open-instance"
          :VM="VM"
          @update:password="(value) => (resources.password = value)"
        >
          <template #header>
            <div class="Fcloud__header">
              <div class="Fcloud__back-wrapper">
                <div
                  class="Fcloud__back icon__wrapper"
                  @click="$router.push('/services')"
                >
                  <left-icon />
                </div>
              </div>
              <div v-if="VM && VM.status" class="Fcloud__header-title">
                <div
                  class="Fcloud__status-color"
                  :class="{ 'glowing-animations': isActionLoading }"
                  :style="{ 'background-color': stateColor }"
                />
                <div class="Fcloud__title">
                  {{ VM.title ?? VM.vm_info.NAME ?? "-" }}
                </div>
                <div
                  class="Fcloud__status"
                  :class="{ 'glowing-animations': isActionLoading }"
                >
                  {{ stateVM }}
                </div>
              </div>
              <div class="Fcloud__menu-wrapper">
                <div class="Fcloud__menu-btn icon__wrapper">
                  <more-icon @click="changeModal('menu')" />
                  <a-modal
                    v-model:open="modal.menu"
                    :title="$t('Menu')"
                    :footer="null"
                  >
                    <a-button
                      v-for="btn in menuOptions"
                      :key="btn.title"
                      block
                      class="menu__button"
                      :danger="btn.isDanger"
                      :disabled="disabledMenu(btn.title.toLowerCase())"
                      :loading="btn.icon === 'delete' ? isDeleteLoading : false"
                      @click="btn.onclick(...btn.params)"
                    >
                      <template #icon>
                        <component :is="icons[btn.icon]" />
                      </template>
                      {{ $t(btn.title) }}
                    </a-button>
                  </a-modal>
                  <a-modal
                    v-model:open="modal.rename"
                    :confirm-loading="isRenameLoading"
                    :title="$t('Rename')"
                    @ok="sendRename"
                  >
                    <p>{{ $t("Enter new VM name") }}</p>
                    <a-input
                      v-model:value="renameNewName"
                      :placeholder="$t('input new name')"
                    />
                  </a-modal>
                  <a-modal
                    v-model:open="modal.reinstall"
                    :confirm-loading="isRenameLoading"
                    :title="$t('Reinstall')"
                    @ok="sendReinstall"
                  >
                    <a-spin :spinning="isRenameLoading && images.length < 1">
                      <p>{{ $t("select OS") }}</p>
                      <images-list
                        :images="images"
                        :os-name="reinstallOSName"
                        :set-o-s="setOS"
                      />
                    </a-spin>
                  </a-modal>
                  <a-modal
                    v-model:open="modal.expand"
                    :confirm-loading="isResizeLoading"
                    :title="$t('Resize VM')"
                    @ok="ResizeVM"
                  >
                    <a-row style="margin-bottom: 5px">
                      <a-col style="width: 75px"> CPU </a-col>
                      <a-col style="width: 100%">
                        <a-input-number
                          v-model:value="resize.VCPU"
                          style="width: 100%"
                          :min="1"
                          :max="32"
                          default-value="1"
                        />
                      </a-col>
                    </a-row>

                    <a-row style="margin: 10px 0; width: 100%">
                      <a-col style="width: 75px"> RAM (GB) </a-col>
                      <a-col style="width: 100%">
                        <a-input-number
                          v-model:value="resize.RAM"
                          style="width: 100%"
                          :min="1"
                          :max="64"
                          default-value="1"
                        />
                      </a-col>
                    </a-row>

                    <template
                      v-if="
                        VM.state &&
                        Object.keys(VM.state.meta.snapshots || {}).length > 0
                      "
                    >
                      <p>
                        {{
                          $t(
                            "You cannot change disk size while you have a snapshot"
                          )
                        }}
                      </p>
                      <p>{{ $t("Please delete snapshot and try again") }}</p>
                    </template>

                    <a-row v-else>
                      <a-col style="width: 75px"> {{ $t("disk") }} (GB) </a-col>
                      <a-col style="width: 100%">
                        <a-input-number
                          v-model:value="resize.size"
                          style="width: 100%"
                          :min="VM.resources && VM.resources.drive_size / 1024"
                          default-value="1"
                        />
                        <div
                          :style="{ color: 'var(--err)', textAlign: 'center' }"
                        >
                          {{ $t("Can't reduce disk size") }}
                        </div>
                      </a-col>
                    </a-row>
                  </a-modal>
                  <a-modal
                    v-model:open="modal.SSH"
                    :title="$t('SSH key')"
                    :footer="null"
                  >
                    <div>
                      <span style="font-weight: 700"
                        >{{ capitalize($t("key")) }}:
                      </span>
                      <span
                        class="ssh-text"
                        :title="$t('Click to copy')"
                        @click="addToClipboard"
                      >
                        {{ sshKey }}
                      </span>
                    </div>
                  </a-modal>
                  <a-modal
                    v-model:open="modal.logs"
                    :title="$t('Logs')"
                    :footer="null"
                  >
                    <a-spin
                      style="display: block; margin: 0 auto"
                      :tip="$t('loading')"
                      :spinning="isLogsLoading"
                    >
                      <template v-if="logs.length > 0">
                        <a-card
                          v-for="(log, i) of logs"
                          :key="log.date"
                          size="small"
                          :body-style="{ display: 'flex' }"
                          :style="{
                            marginBottom: logs.length - 1 !== i ? '24px' : null,
                          }"
                        >
                          <template #extra>
                            <a-badge
                              :status="
                                log.state === 'done' ? 'success' : 'error'
                              "
                            />
                          </template>
                          <template #title>
                            <span style="font-weight: 700">{{ log.type }}</span>
                          </template>
                          <span style="margin-right: auto">{{
                            log.date.replace("T", " ")
                          }}</span>
                          <span v-if="log.progress < 100">{{
                            `${log.progress}%`
                          }}</span>
                        </a-card>
                      </template>
                      <a-empty v-else />
                    </a-spin>
                  </a-modal>

                  <a-modal
                    v-model:open="modal.networkControl"
                    width="600px"
                    :title="$t('Network control')"
                    :footer="null"
                  >
                    <template
                      v-if="
                        VM.state &&
                        Object.keys(VM.state.meta.snapshots || {}).length > 0
                      "
                    >
                      <p>
                        {{
                          $t(
                            "You cannot change networks while you have a snapshot"
                          )
                        }}
                      </p>
                      <p>{{ $t("Please delete snapshot and try again") }}</p>
                    </template>
                    <network-control
                      v-else
                      :item-service="itemService"
                      :instance="VM"
                      @close-modal="modal.networkControl = false"
                    />
                  </a-modal>

                  <a-modal
                    v-model:open="modal.accessManager"
                    :title="$t('Access manager')"
                    :footer="null"
                  >
                    <access-manager :instance="VM" />
                  </a-modal>
                </div>
              </div>
            </div>
          </template>
        </component>
      </div>
      <loading
        v-else-if="vmsLoading"
        key="loading"
        color="var(--bright_font)"
        class="loading"
      />
    </transition>
  </div>
</template>

<script>
import { defineAsyncComponent, h } from "vue";
import { mapState, mapActions } from "pinia";
import * as icons from "@ant-design/icons-vue";
import { useNotification } from "@/hooks/utils";
import config from "@/appconfig.js";

import { useAuthStore } from "@/stores/auth.js";
import { useSpStore } from "@/stores/sp.js";

import { useChatsStore } from "@/stores/chats.js";
import { useProductsStore } from "@/stores/products.js";
import { useInstancesStore } from "@/stores/instances.js";

import networkControl from "@/components/cloud/options/networkControl.vue";
import accessManager from "@/components/cloud/options/accessManager.vue";
import loading from "@/components/ui/loading.vue";
import imagesList from "@/components/ui/images.vue";
import { getInstStatusColor } from "@/functions";

const leftIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LeftOutlined")
);
const moreIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/MoreOutlined")
);

export default {
  name: "OpenCloud",
  components: {
    loading,
    imagesList,
    networkControl,
    accessManager,
    leftIcon,
    moreIcon,
  },
  setup() {
    const { openNotification } = useNotification();

    return { openNotification };
  },
  data: () => ({
    icons,
    isDeleteLoading: false,
    isRenameLoading: false,
    isLogsLoading: false,
    isResizeLoading: false,
    reinstallOS: "",
    reinstallOSName: "",
    renameNewName: "",
    modal: {
      menu: false,
      reinstall: false,
      delete: false,
      expand: false,
      SSH: false,
      logs: false,
      networkControl: false,
      accessManager: false,
      rename: false,
      resize: false,
    },
    resize: {
      VCPU: 0,
      RAM: 0,
      size: 0,
      scale: "GB",
    },
    logs: [],
    images: [],
    resources: {},
    type: "",
  }),
  computed: {
    ...mapState(useInstancesStore, [
      "isActionLoading",
      "services",
      "getInstances",
      "isLoading",
      "socket",
    ]),
    ...mapState(useAuthStore, ["isLogged", "baseURL", "userdata"]),
    ...mapState(useChatsStore, ["getDefaults"]),
    ...mapState(useProductsStore, {
      products: "products",
      fetchProducts: "fetch",
      isInfoLoading: "isLoading",
    }),
    ...mapState(useSpStore, {
      sp: "servicesProviders",
      fetchProviders: "fetch",
    }),
    template() {
      const components = import.meta.glob(
        "@/components/cloud/modules/*/openInstance.vue"
      );
      const component = Object.keys(components).find((key) =>
        key.includes(`/${this.type}/`)
      );

      if (!component) return () => ({});
      return defineAsyncComponent(() => components[component]());
    },
    menuOptions() {
      let { type } = this.VM.billingPlan ?? {};
      const options = [
        {
          title: "Reinstall",
          onclick:
            type === "ovh vps" ? this.openVpsReinstall : this.sendReinstall,
          params: ["reinstall"],
          icon: "ExclamationOutlined",
          modules: ["ione", "custom", "ovh vps"],
        },
        {
          title: "Rename",
          onclick: this.changeModal,
          params: ["rename"],
          icon: "TagOutlined",
        },
        {
          title: "Resize VM",
          onclick: this.changeModal,
          params: ["expand"],
          icon: "ArrowsAltOutlined",
          forVNC: true,
          modules: ["ione"],
        },
        {
          title: "SSH key",
          onclick: this.changeModal,
          params: ["SSH"],
          icon: "SafetyOutlined",
          modules: ["ione", "ovh", "keyweb"],
        },
        {
          title: "Network control",
          onclick: this.changeModal,
          params: ["networkControl"],
          icon: "GlobalOutlined",
          forVNC: true,
          modules: [],
        },
        {
          title: "Access manager",
          onclick: this.changeModal,
          params: ["accessManager"],
          icon: "SafetyOutlined",
          modules: ["ione", "ovh vps", "ovh dedicated", "keyweb", "custom"],
        },
        {
          title: "Logs",
          onclick: this.getLogs,
          params: ["logs"],
          icon: "CodeOutlined",
          modules: ["ovh vps", "ovh dedicated"],
        },
        {
          title: "Delete",
          onclick: this.sendDelete,
          params: ["delete"],
          icon: "DeleteOutlined",
          isDanger: true,
          forVNC: true,
          modules: ["ione", "ovh", "keyweb"],
        },
      ];

      if (this.VM.server_on) type = "custom";
      return options.filter((el) => {
        if (!el.modules) return true;

        return el.modules.find((module) => type.includes(module));
      });
    },

    itemService() {
      return this.services.find((el) => this.VM.uuidService === el.uuid);
    },
    VM() {
      const vms = [...this.getInstances, ...this.products];

      for (const instance of vms) {
        if (instance.uuid === this.$route.params.uuid) {
          return instance;
        } else if (`${instance.id}` === `${this.$route.params.uuid}`) {
          return { ...instance, resources: this.resources };
        }
      }
      return {};
    },
    vmsLoading() {
      return this.isLoading || this.isInfoLoading;
    },
    sshKey() {
      const { config } = this.itemService.instancesGroups.find(
        ({ sp }) => sp === this.VM.sp
      );

      return this.VM.config?.ssh_public_key ?? config.ssh ?? this.$t("ip.none");
    },
    stateVM() {
      if (this.VM.server_on) {
        return this.VM.vm_info?.STATE?.replaceAll("_", " ") ?? "UNKNOWN";
      }

      if (!this.VM.state && !this.VM.data.is_monitored) {
        return "INIT";
      }
      if (!this.VM.state) return "UNKNOWN";

      const state = this.VM.state.meta?.lcm_state_str ?? this.VM.state.state;

      if (this.VM.state.meta.state === 1) return "PENDING";
      if (this.VM.state.meta.state === 5) return "SUSPENDED";
      if (this.VM.data.suspended_manually) return "SUSPENDED";
      if (this.VM.state.meta.state === "BUILD") return "BUILD";

      switch (state) {
        case "LCM_INIT":
          return "POWEROFF";
        default:
          return state.replaceAll("_", " ");
      }
    },
    stateColor() {
      if (!this.VM.state && !this.VM.vm_info?.STATE) return "var(--err)";
      if (this.VM.data?.suspended_manually) return "#ff9140";

      let state;
      if (this.VM?.billingPlan?.type === "ione") {
        state = this.VM.state.meta.lcm_state_str ?? this.VM.state.state;
      } else if (this.VM.server_on) {
        state = this.VM.vm_info.STATE;
      } else {
        state = this.VM.state.state;
      }

      return getInstStatusColor(state);
    },
  },
  watch: {
    "VM.uuidService": {
      handler(value) {
        if (!value) return;
        this.resize.VCPU = this.VM.resources.cpu;
        this.resize.RAM = this.VM.resources.ram / 1024;
        this.resize.size = Math.ceil(this.VM.resources.drive_size / 1024);

        this.renameNewName = this.VM.title;
        if (!this.socket) {
          this.subscribeWebSocket(value);
        }

        if (this.type === "") {
          this.type = (this.VM.billingPlan?.type ?? "ione").split("-")[0];
        }
      },
      immediate: true,
    },
    "VM.server_on": {
      handler(value) {
        if (!value) return;
        this.type = "whmcs";
      },
      immediate: true,
    },
  },
  created() {
    this.renameNewName = this.VM.vm_info?.NAME ?? this.VM.title ?? "";

    if (!this.socket && this.VM.uuidService) {
      this.subscribeWebSocket(this.VM.uuidService);
    }

    if (this.isLogged) {
      this.fetchBillingData().then(({ client_id: id }) => {
        this.fetchProducts(id);
      });

      this.fetchProviders();
      this.fetch();
    }
  },
  beforeUnmount() {
    if (!this.socket) return;
    this.socket.close(1000, "Work is done");
  },
  methods: {
    ...mapActions(useChatsStore, [
      "createChat",
      "sendMessage",
      "fetchDefaults",
    ]),
    ...mapActions(useAuthStore, ["fetchBillingData"]),
    ...mapActions(useInstancesStore, [
      "fetch",
      "subscribeWebSocket",
      "updateService",
      "deleteInstance",
      "invokeAction",
    ]),
    disabledMenu(menuName) {
      const states = ["RUNNING", "STOPPED", "POWEROFF", "SUSPENDED"];

      if (this.VM?.product && menuName === "resize") {
        return true;
      }
      if (states.find((state) => this.stateVM.includes(state))) {
        if (this.VM.data?.lock) return true;
        if (menuName === "delete") return false;
        if (
          this.VM.billingPlan?.kind === "DYNAMIC" &&
          this.stateVM === "SUSPENDED"
        )
          return true;
        return false;
      }
    },
    changeModal(name) {
      for (const key in this.modal) {
        this.modal[key] = false;
      }
      this.modal[name] = true;
    },
    closeModal(name) {
      this.modal[name] = false;
    },
    ResizeVM() {
      // if (Object.keys(this.VM.state?.meta?.snapshots ?? {}).length > 0) {
      //   this.$message.warn(
      //     this.$t('You cannot change resources while there are snapshots')
      //   )
      //   return
      // }

      const onOk = async () => {
        this.isResizeLoading = true;
        if (this.getDefaults.departments.length < 1) {
          await this.fetchDefaults();
        }

        const group = this.itemService.instancesGroups.find(
          (el) => el.sp === this.VM.sp
        );
        const instance = group.instances.find((el) => el.uuid === this.VM.uuid);
        const cpuEqual = instance.resources.cpu === +this.resize.VCPU;
        const ramEqual = instance.resources.ram === this.resize.RAM * 1024;
        const diskEqual =
          instance.resources.drive_size === this.resize.size * 1024;

        if (this.VM.billingPlan.kind === "DYNAMIC") {
          instance.resources.cpu = +this.resize.VCPU;
          instance.resources.ram = this.resize.RAM * 1024;
        } else if (!cpuEqual || !ramEqual) {
          const { departments } = this.getDefaults;
          const { admins } =
            departments.find(({ id }) => id === config.department) ?? {};
          const message = `
              1. ID: ${this.VM.uuid}
              2. Resources:
                - cpu: ${this.resize.VCPU}
                - ram: ${this.resize.RAM * 1024}
            `;

          try {
            const response = await this.createChat({
              admins,
              department: config.department,
              gateways: [],
              chat: {
                subject: `Resize VM: ${this.VM.title}`,
                message,
              },
            });

            await this.sendMessage({
              uuid: response.uuid,
              content: message,
              account: this.userdata.uuid,
              date: BigInt(Date.now()),
            });

            this.$message.success(this.$t("Ticket created successfully"));
          } catch (error) {
            const message =
              error.response?.data?.message ?? error.message ?? error;

            this.openNotification("error", { message: this.$t(message) });
            console.error(error);
          }
        }

        if (cpuEqual && ramEqual && diskEqual) {
          this.closeModal("expand");
          this.isResizeLoading = false;
          return;
        }

        if (diskEqual) {
          this.closeModal("expand");
          return;
        }
        instance.resources.drive_size = this.resize.size * 1024;
        this.updateService(this.itemService)
          .then((result) => {
            if (result) {
              this.openNotification("success", {
                message: this.$t("VM resized successfully"),
              });
              this.closeModal("expand");
            } else {
              this.openNotification("error", {
                message: this.$t("Can't VM resize to same size"),
              });
            }
          })
          .catch((err) => {
            const message = err.response?.data?.message ?? err.message ?? err;

            this.openNotification("error", {
              message: this.$t(
                `Can't VM resize to same size: [error] - ${message}`
              ),
            });
            console.error(err);
          })
          .finally(() => {
            this.isResizeLoading = false;
          });
      };

      this.$confirm({
        title: this.$t(
          "Service will be stopped after resize. Please restart manually!"
        ),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk,
        onCancel() {},
      });
    },
    sendRename() {
      if (this.renameNewName !== "") {
        const group = this.itemService?.instancesGroups.find(
          (el) => el.sp === this.VM.sp
        );
        const instance = group?.instances.find(
          (el) => el.uuid === this.VM.uuid
        );

        this.isRenameLoading = true;
        instance.title = this.renameNewName;

        const promise = this.VM.server_on
          ? this.$refs["open-instance"].sendAction("rename_vm", {
              vm_name: this.renameNewName,
            })
          : this.updateService(this.itemService);

        promise
          .then((result) => {
            if (result) {
              this.$message.success(this.$t("VM name changes successfully"));
              this.isRenameLoading = false;
              this.closeModal("rename");
              this.closeModal("menu");
            } else {
              this.openNotification("error", {
                message: this.$t("Can't VM name changes"),
              });
            }
          })
          .catch((err) => {
            const message = err.response?.data?.message ?? err.message ?? err;

            this.openNotification("error", {
              message: this.$t(message),
            });
          })
          .finally(() => {
            this.modal.confirmLoading = false;
          });
      }
    },
    sendReinstall() {
      this.$confirm({
        title: this.$t("Do you want to reinstall this virtual machine?"),
        okType: "danger",
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        content: () =>
          h(
            "div",
            { style: "color: red" },
            this.$t("All data will be deleted!")
          ),
        onOk: async () => {
          try {
            const { type } = this.VM.billingPlan;

            await this.invokeAction({
              uuid: this.VM.uuid,
              uuidService: this.VM.uuidService,
              action: type === "ovh vps" ? "rebuild" : "reinstall",
              params: type === "ovh vps" ? { imageId: this.reinstallOS } : {},
            });

            this.openNotification("success", {
              message: `${this.$t("Done")}!`,
            });
          } catch (error) {
            const message =
              error.response?.data?.message ?? error.message ?? error;

            this.openNotification("error", {
              message: this.$t(message),
            });
          } finally {
            this.modal.menu = false;
            this.modal.reinstall = false;
          }
        },
        onCancel: () => {
          this.modal.reinstall = false;
        },
      });
    },
    sendDelete() {
      this.$confirm({
        title: this.$t("Do you want to delete this virtual machine?"),
        okType: "danger",
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        content: () =>
          h(
            "div",
            { style: "color: red" },
            this.$t("All data will be deleted!")
          ),
        onOk: () => {
          this.isDeleteLoading = true;
          this.deleteInstance(this.VM.uuid)
            .then((result) => {
              if (result) {
                this.openNotification("success", {
                  message: this.$t("VM deleted successfully"),
                });

                this.$router.push({ path: "/services" });
              } else {
                this.openNotification("error", {
                  message: this.$t("Failed to delete VM"),
                });
              }
            })
            .catch((err) => {
              const message = err.response?.data?.message ?? err.message ?? err;

              this.openNotification("error", {
                message: this.$t(message),
              });
            })
            .finally(() => {
              this.isDeleteLoading = false;
            });
        },
        onCancel: () => {
          this.modal.delete = false;
        },
      });
    },
    openVpsReinstall() {
      this.getImages();
      this.changeModal("reinstall");
    },
    setOS({ id, name }) {
      this.reinstallOSName = name;
      this.reinstallOS = id;
    },
    async getImages() {
      this.isRenameLoading = true;
      try {
        const { meta } = await this.invokeAction({
          uuid: this.VM.uuid,
          uuidService: this.VM.uuidService,
          action: "images",
        });

        this.images = meta.images;
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error;

        this.openNotification("error", {
          message: this.$t(message),
        });
      } finally {
        this.isRenameLoading = false;
      }
    },
    getLogs() {
      this.isLogsLoading = true;
      this.changeModal("logs");
      this.invokeAction({ uuid: this.$route.params.uuid, action: "get_logs" })
        .then((response) => {
          response.meta?.logs?.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.logs = response.meta?.logs ?? [];
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          console.error(err);
          this.openNotification("error", {
            message: this.$t(message),
          });
        })
        .finally(() => {
          this.isLogsLoading = false;
        });
    },
    addToClipboard({ target }) {
      if (navigator?.clipboard) {
        navigator.clipboard
          .writeText(target.innerText)
          .then(() => {
            this.openNotification("success", {
              message: this.$t("Text copied"),
            });
          })
          .catch((res) => {
            console.error(res);
          });
      } else {
        this.openNotification("error", {
          message: this.$t("Clipboard is not supported"),
        });
      }
    },
  },
};
</script>
<style>
.cloud__container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cloud__fullscreen {
  background: var(--main);
  display: flex;
}

.cloud__fullscreen--while {
  background: var(--bright_font);
}

.loading {
  position: absolute;
  height: 100%;
  width: 100%;
}

.Fcloud {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.Fcloud__header {
  position: sticky;
  padding-top: 10px;
  color: var(--gloomy_font);
  top: 0;
  background-color: var(--main);
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: start;
}
.Fcloud__header-title {
  position: relative;
  transition: transform 0.3s ease;
}
.Fcloud__title {
  font-weight: bold;
  font-size: 24px;
  line-height: 1;
  word-wrap: anywhere;
}
.Fcloud__status {
  text-transform: uppercase;
  font-weight: bold;
  font-size: 14px;
  color: var(--gloomy_font);
  opacity: 0.7;
}
.Fcloud__status-color {
  position: absolute;
  height: 15px;
  width: 15px;
  background-color: var(--bright_font);
  border-radius: 50%;
  bottom: 5px;
  left: -25px;
}
.Fcloud__buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 20px;
}
.Fcloud__button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.Fcloud__BTN-icon {
  padding: 10px;
  background: var(--gloomy_font);
  color: var(--main);
  border-radius: 14px;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.2);
  transition: background-color 0.1s ease, box-shadow 0.1s ease;
}
.Fcloud__BTN-title {
  color: var(--gloomy_font);
  opacity: 0.8;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  transition: color 0.1s ease, text-shadow 0.1s ease, opacity 0.1s ease;
}
.Fcloud__button:hover .Fcloud__BTN-icon {
  background-color: var(--gloomy_font);
  box-shadow: 2px 2px 7px rgba(0, 0, 0, 0.2);
}
.Fcloud__button:hover .Fcloud__BTN-title {
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  opacity: 1;
}
.Fcloud__button:active {
  transform: scale(1.05);
}
.Fcloud__button.disabled {
  opacity: 0.8;
  transform: scale(0.8);
  color: #c9c9c9;
  pointer-events: none;
}
.Fcloud__button.disabled .Fcloud__BTN-title {
  color: var(--gloomy_font);
  opacity: 0.8;
}
.Fcloud__button.disabled:hover {
  transform: scale(0.81);
}
.Fcloud__info {
  background: var(--bright_bg);
  flex: 1 0;
  border-radius: 35px 35px 0 0;
  margin-top: 30px;
  padding: 10px 30px;
  overflow: auto;
}
.Fcloud__info-header {
  text-align: center;
}
.Fcloud__back {
  font-weight: bold;
  font-size: 1.4rem;
  cursor: pointer;
}
.Fcloud__menu-btn {
  font-size: 1.4rem;
}
.Fcloud__info-title {
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}
.Fcloud__main-info {
  margin-top: 20px;
  background: var(--bright_font);
  border-radius: 15px;
  padding: 15px 0;
}
.Fcloud__table td {
  padding: 0 15px;
}
.Fcloud__main-info--invoice {
  display: flex;
  align-items: stretch;
  color: #32af32;
  background-color: #c5eec5;
  min-height: 2px;
  padding: 0;
  overflow: hidden;
}
.Fcloud__main-info--invoice .icon {
  padding: 5px 15px;
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.Fcloud__main-info--invoice .content {
  font-weight: bold;
  flex: 1 0;
  padding: 15px 0;
}
.Fcloud__main-info--invoice .link {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  padding: 5px 15px;
  border-left: 1px solid #32af3260;
  color: #32af32;
  text-decoration: underline;
  transition: background-color 0.2s ease;
}
.Fcloud__main-info--invoice .link:hover {
  background-color: #b9e6b9;
}

.Fcloud__block-header {
  font-weight: 700;
  font-size: 1rem;
  color: #919392;
}
.Fcloud__block-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 1rem;
  background-color: var(--bright_font);
  border-radius: 20px;
  padding: 10px 0;
  text-align: center;
}
.Fcloud__block-content--charts {
  flex-wrap: wrap;
}

.block__column {
  display: flex;
  flex: 1 1 33%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.block__title {
  color: #919392;
}
.block__value {
  word-break: break-word;
}

.ssh-text {
  border-bottom: 1px solid rgba(0, 0, 0, 0.65);
  cursor: pointer;
  transition: 0.3s;
}

.ssh-text:hover {
  border-bottom: 0px solid rgba(0, 0, 0, 0);
}

.glowing-animations {
  animation: glowing 1.5s ease infinite;
}
@keyframes glowing {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
/* ANIMATIONS AFTER LOADING */
.opencloud-enter-active,
.opencloud-leave-active {
  transition: opacity 0.6s;
}
.opencloud-enter-from,
.opencloud-leave-to {
  opacity: 0;
}
.opencloud-enter-active .Fcloud__header-title {
  transition: transform 0.2s 0.4s ease;
}
.opencloud-enter-from .Fcloud__header-title {
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}
.opencloud-enter-active .Fcloud__info {
  transition: opacity 0.2s 0.2s ease, transform 0.2s 0.2s ease;
}
.opencloud-enter-from .Fcloud__info {
  transform: translateY(200px);
  opacity: 0;
}
.opencloud-enter-active .Fcloud__button {
  transition: opacity 0.2s 0.1s ease, transform 0.2s 0.1s ease;
}
.opencloud-enter-from .Fcloud__button {
  transform: scale(0.5) rotate(15deg);
  opacity: 0;
}
.cloud__icon {
  height: 0.8em;
  width: 0.8em;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 2px;
}
.button--mt20 {
  margin-top: 20px;
}
.modal__buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
/* disabled button animation */
.disabled:active {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.menu__button:not(:last-child) {
  margin-bottom: 10px;
}
@keyframes shake {
  10%,
  90% {
    transform: translateX(-1px) scale(0.85);
  }
  20%,
  80% {
    transform: translateX(2px) scale(0.85);
  }
  30%,
  50%,
  70% {
    transform: translateX(-4px) scale(0.85);
  }
  40%,
  60% {
    transform: translateX(4px) scale(0.85);
  }
}
</style>
