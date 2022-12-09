<template>
  <div class="cloud__fullscreen Fcloud">
    <transition name="opencloud" :duration="600">
      <div v-if="!vmsLoading" class="cloud__container">
        <component :is="template" :VM="VM">
          <template #header>
            <div class="Fcloud__header">
              <div class="Fcloud__back-wrapper">
                <div class="Fcloud__back icon__wrapper" @click="$router.go(-1)">
                  <a-icon type="left" />
                </div>
              </div>
              <div v-if="VM && VM.status" class="Fcloud__header-title">
                <div
                  class="Fcloud__status-color"
                  :class="{ 'glowing-animations': getActionLoadingInvoke }"
                  :style="{ 'background-color': stateColor }"
                ></div>
                <div class="Fcloud__title">
                  {{ VM.title }}
                </div>
                <div
                  class="Fcloud__status"
                  :class="{ 'glowing-animations': getActionLoadingInvoke }"
                >
                  {{ stateVM }}
                </div>
              </div>
              <div class="Fcloud__menu-wrapper">
                <div class="Fcloud__menu-btn icon__wrapper">
                  <a-icon type="more" @click="changeModal('menu')" />
                  <a-modal v-model="modal.menu" title="Menu" :footer="null">
                    <a-button
                      block
                      class="menu__button"
                      v-for="btn in menuOptions"
                      :key="btn.title"
                      :icon="btn.icon"
                      :type="btn.type || 'default'"
                      :disabled="disabledMenu(btn.title.toLowerCase())"
                      :loading="(btn.icon === 'delete') ? isDeleteLoading : null"
                      @click="btn.onclick(...btn.params)"
                    >
                      {{ $t(btn.title) }}
                    </a-button>
                  </a-modal>
                  <a-modal
                    v-model="modal.rename"
                    :confirmLoading="isRenameLoading"
                    title="rename"
                    @ok="sendRename"
                  >
                    <p>{{ $t("Enter new VM name") }}</p>
                    <a-input
                      v-model="renameNewName"
                      :placeholder="$t('input new name')"
                    >
                    </a-input>
                  </a-modal>
                  <a-modal
                    v-model="modal.reinstall"
                    title="reinstall"
                    @ok="sendReinstall"
                  >
                    <template v-if="!disabledMenu('reinstall')">
                      <p>{{ $t("Enter new password") }}</p>
                      <a-input-password
                        v-model="reinstallPass"
                        :placeholder="$t('input password')"
                      >
                      </a-input-password>
                    </template>
                    <template v-else>
                      <p>{{ $t('We can\'t do it automaticly. Presss OK to create a ticket') }}</p>
                      <p>{{ $t('All unsaved data will be lost') }}</p>
                    </template>
                  </a-modal>
                  <a-modal
                    :confirm-loading="loadingResizeVM"
                    v-model="modal.expand"
                    :title="$t('Resize VM')"
                    @ok="ResizeVM"
                  >
                    <template v-if="VM.state && Object.keys(VM.state.meta.snapshots || {}).length > 0">
                      <p>{{ $t('You cannot change VM resources while you have a snapshot.') }}</p>
                      <p>{{ $t('Please delete snapshot and try again.') }}</p>
                    </template>
                    <template v-else>
                      <a-row
                        style="
                          display: flex;
                          align-items: center;
                          margin-bottom: 5px;
                        "
                      >
                        <a-col  style="width: 75px"> CPU </a-col>
                        <a-col style="width: 100%">
                          <a-input-number
                          style="width: 100%"
                            v-model="resize.VCPU"
                            :min="1"
                            :max="32"
                            default-value="1"
                          />
                        </a-col>
                      </a-row>
                      <a-row
                        style="
                          display: flex;
                          align-items: center;
                          margin-bottom: 5px;
                          width: 100%
                        "
                      >
                        <a-col style="width: 75px"> RAM (GB) </a-col>
                        <a-col style="width: 100%">
                          <a-input-number
                            style="width: 100%"
                            v-model="resize.RAM"
                            :min="1"
                            :max="64"
                            default-value="1"
                          />
                        </a-col>
                      </a-row>
                      <a-row style="display: flex; align-items: center; width: 100%">
                        <a-col style="width: 75px; padding-top:20px"> {{ $t('disk') }} (GB) </a-col>
                        <a-col style="width: 100%">
                          <div :style="{ color: 'var(--err)', textAlign: 'center' }">
                            {{ $t('Can\'t reduce disk size') }}
                          </div>
                          <a-input-number
                            style="width: 100%"
                            v-model="resize.size"
                            :min="VM.resources && VM.resources.drive_size / 1024"
                            default-value="1"
                          />
                        </a-col>
                      </a-row>
                    </template>
                  </a-modal>
                  <a-modal
                    v-model="modal.SSH"
                    :title="$t('SSH key')"
                    :footer="null"
                  >
                    <div>
                      <span style="font-weight: 700">{{ $t('key') | capitalize }}: </span>
                      <span
                        class="ssh-text"
                        title="Click to copy"
                        @click="addToClipboard"
                      >
                        {{ VM.config && VM.config.ssh_public_key || $t('none') }}
                      </span>
                    </div>
                  </a-modal>
                  <a-modal
                    v-model="modal.logs"
                    :title="$t('Logs')"
                    :footer="null"
                  >
                    <a-spin style="display: block; margin: 0 auto" :tip="$t('loading')" :spinning="isLogsLoading">
                      <a-card
                        size="small"
                        v-for="(log, i) of logs"
                        :key="log.date"
                        :bodyStyle="{ display: 'flex' }"
                        :style="{ marginBottom: (logs.length - 1 !== i) ? '24px' : null }"
                      >
                        <template #extra>
                          <a-badge :status="(log.state === 'done') ? 'success' : 'error'" />
                        </template>
                        <template #title>
                          <span style="font-weight: 700">{{ log.type }}</span>
                        </template>
                        <span style="margin-right: auto">{{ log.date.replace('T', ' ') }}</span>
                        <span v-if="log.progress < 100">{{ `${log.progress}%` }}</span>
                      </a-card>
                    </a-spin>
                  </a-modal>

                  <a-modal
                    v-model="modal.diskControl"
                    :title="$t('Disk control')"
                    :footer="null"
                  >
                    <disk-control />
                  </a-modal>

                  <a-modal
                    width="600px"
                    v-model="modal.networkControl"
                    :title="$t('Network control')"
                    :footer="null"
                  >
                    <network-control
                      :itemService="itemService"
                      :VM="VM"
                      @closeModal="modal.networkControl = false"
                    />
                  </a-modal>

                  <a-modal
                    v-model="modal.bootOrder"
                    :title="$t('Boot order')"
                    :footer="null"
                  >
                    <boot-order @onEnd="bootOrderNewState" />
                  </a-modal>

                  <a-modal
                    v-model="modal.accessManager"
                    :title="$t('Access manager')"
                    :footer="null"
                  >
                    <access-manager :VM="VM" />
                  </a-modal>
                </div>
              </div>
            </div>
          </template>
        </component>
      </div>
      <loading v-else color="#fff" :style="{'position': 'absolute', 'height':
      '100%', 'width': '100%'}" key="loading" duration: />
    </transition>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import loading from "@/components/loading/loading.vue";
import diskControl from "./openCloud/diskControl";
import bootOrder from "./openCloud/bootOrder";
import networkControl from "./openCloud/networkControl";
import accessManager from "./openCloud/accessManager";
import notification from "@/mixins/notification";

export default {
  name: "openCloud",
  components: { loading, diskControl, bootOrder, networkControl, accessManager },
  mixins: [notification],
  data: () => ({
    isDeleteLoading: false,
    isRenameLoading: false,
    isLogsLoading: false,
    reinstallPass: "",
    renameNewName: "",
    loadingResizeVM: false,
    modal: {
      menu: false,
      reinstall: false,
      delete: false,
      expand: false,
      diskControl: false,
      bootOrder: false,
      SSH: false,
      logs: false,
      networkControl: false,
      accessManager: false,
      rename: false,
      resize: false,
    },
    bootOrder: {
      loading: false,
    },
    resize: {
      VCPU: 0,
      RAM: 0,
      size: 0,
      scale: "GB",
    },
    logs: [],
  }),
  computed: {
    ...mapGetters("nocloud/vms", [
      "getActionLoadingInvoke",
      "getServicesFull",
      "getInstances",
    ]),
    ...mapGetters("support", { baseURL: "getURL" }),
    template() {
      if (this.VM.billingPlan.type === 'ovh') {
        return () => import('@/components/appMain/modules/ovh/openInstance.vue');
      } else {
        return () => import('@/components/appMain/modules/ione/openInstance.vue');
      }
    },
    menuOptions() {
      const options = [
        {
          title: "Reinstall",
          onclick: this.sendReinstall,
          params: [],
          icon: "exclamation",
          modules: ['ione'],
        },
        {
          title: "Rename",
          onclick: this.changeModal,
          params: ["rename"],
          icon: "tag",
        },
        {
          title: "Resize VM",
          onclick: this.changeModal,
          params: ["expand"],
          icon: "arrows-alt",
          forVNC: true,
          modules: ['ione'],
        },
        {
          title: "SSH key",
          onclick: this.changeModal,
          params: ["SSH"],
          icon: "safety",
        },
        {
          title: "Network control",
          onclick: this.changeModal,
          params: ["networkControl"],
          icon: "global",
          forVNC: true,
          modules: ['ione'],
        },
        {
          title: "Access manager",
          onclick: this.changeModal,
          params: ["accessManager"],
          icon: "safety",
          modules: ['ovh'],
        },
        {
          title: "Logs",
          onclick: this.getLogs,
          params: ["logs"],
          icon: "code",
          modules: ['ovh'],
        },
        {
          title: "Delete",
          onclick: this.sendDelete,
          icon: "delete",
          type: "danger",
          forVNC: true,
        },
      ];
      const sp = this.$store.getters['nocloud/sp/getSP'];
      const { type } = sp?.find(({ uuid }) => uuid === this.VM.sp) || {};

      return options.filter((el) =>
        (el.modules) ? el.modules.includes(type) : true
      );
    },

    itemService() {
      const data = this.getServicesFull.find((el) => {
        return this.VM.uuidService === el.uuid;
      });
      return data;
    },
    VM() {
      for (let instance of this.getInstances) {
        if (instance.uuid === this.$route.params.uuid) {
          this.resize.VCPU = instance.resources.cpu;
          this.resize.RAM = instance.resources.ram / 1024;
          this.resize.size = Math.ceil(instance.resources.drive_size / 1024);
          return instance;
        }
      }
      return {};
    },
    vmsLoading() {
      return this.$store.getters["nocloud/vms/isLoading"];
    },
    stateVM() {
      if (!this.VM.state) return "UNKNOWN";
      const state = (this.VM.config?.os)
        ? this.VM.state.state
        : this.VM.state.meta.lcm_state_str

      if (this.VM.state.meta.state === 1) return "PENDING";
      if (this.VM.state.meta.state === 5) return "SUSPENDED";
      if (this.VM.state.meta.state === "BUILD") return "BUILD";
      switch (state) {
        case "LCM_INIT":
          return "POWEROFF";
        default:
          return state.replaceAll('_', ' ');
      }
    },
    stateColor() {
      if (!this.VM.state) return "rgb(145, 145, 145)"
      const state = (this.VM?.config?.os)
        ? this.VM.state.state
        : this.VM.state.meta.lcm_state_str;

      switch (state) {
        case "RUNNING":
          return "#0fd058";
        // останавливающийся и запускающийся
        case "BUILD":
        case "BOOT_POWEROFF":
        case "SHUTDOWN_POWEROFF":
          return "#919191";
        case "LCM_INIT":
        case "STOPPED":
          return "#f9f038";
        default:
          return "rgb(145, 145, 145)";
      }
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
  },
  created() {
    if (this.VM?.uuidService) {
      this.renameNewName = this.VM.title;
      this.$store.dispatch("nocloud/vms/subscribeWebSocket", this.VM.uuidService);
    }
    if (this.isLogged) {
      this.$store.dispatch("nocloud/vms/fetch");
      this.$store.dispatch("nocloud/sp/fetch");
    }
  },
  destroyed() {
    this.$store.state.nocloud.vms.socket.close(1000, 'Work is done');
  },
  methods: {
    disabledMenu(menuName) {
      if (this.VM?.product && menuName === "resize") {
        return true;
      }
    },
    changeModal(name) {
      for (let key in this.modal) {
        this.modal[key] = false;
      }
      this.modal[name] = true;
    },
    closeModal(name) {
      this.modal[name] = false;
    },
    ResizeVM() {
      if (Object.keys(this.VM.state?.meta?.snapshots || {}).length > 0) {
        this.closeModal('expand');
        return;
      }
      let confirm = window.confirm("VM will be restarted");
      if (confirm) {
        this.isRenameLoading = true;
        const group = this.itemService.instancesGroups.find((el) => el.sp === this.VM.sp);
        const instance = group.instances.find((el) => el.uuid === this.VM.uuid);
        const cpuEqual = instance.resources.cpu === +this.resize.VCPU;
        const ramEqual = instance.resources.ram === this.resize.RAM * 1024;

        if (this.VM.billingPlan.kind === 'DYNAMIC') {
          instance.resources.cpu = +this.resize.VCPU;
          instance.resources.ram = this.resize.RAM * 1024;
        } else if (!cpuEqual || !ramEqual) {
          this.$api.get(this.baseURL, { params: {
            run: 'create_ticket',
            subject: `Resize VM - ${this.VM.title}`,
            message: `1. ID: ${this.VM.uuid}\n2. Resources:\n - cpu: ${this.resize.VCPU}\n - ram: ${this.resize.RAM * 1024}`,
            department: 1,
          }})
            .then((resp) => {
              if (resp.result == "success") {
                this.$message.success(this.$t("Ticket created successfully"));
              } else {
                throw resp;
              }
            })
            .catch((err) => {
              const message = err.response?.data?.message ?? err.message ?? err;

              this.openNotificationWithIcon('error', {
                message: this.$t(message)
              });
              console.error(err);
            });
        }
        instance.resources.drive_size = this.resize.size * 1024;

        this.$store
          .dispatch("nocloud/vms/updateService", this.itemService)
          .then((result) => {
            if (result) {
              // this.$message.success(this.$t("VM resized successfully"));
              this.openNotificationWithIcon("success", {
                message: this.$t("VM resized successfully"),
              });
              this.isRenameLoading = false;
              this.closeModal("expand");
            } else {
              this.openNotificationWithIcon("error", {
                message: this.$t("Can't VM resize to same size"),
              });
              // this.$message.error("Can't resize to same size");
            }
          })
          .catch((err) => {
            // this.$message.error( "Can't resize to same size");
            this.openNotificationWithIcon("error", {
              message: this.$t("Can't VM resize to same size"),
            });
            console.error(err);
          })
          .finally(() => {
            this.modal.confirmLoading = false;
          });
      }
    },
    sendRename() {
      if (this.renameNewName !== "") {
        const group = this.itemService.instancesGroups.find((el) => el.sp === this.VM.sp);
        const instance = group.instances.find((el) => el.uuid === this.VM.uuid);

        this.isRenameLoading = true;
        instance.title = this.renameNewName;
        this.$store
          .dispatch("nocloud/vms/updateService", this.itemService)
          .then((result) => {
            if (result) {
              this.$message.success(this.$t("VM name changes successfully"));
              this.isRenameLoading = false;
              this.closeModal("rename");
              this.closeModal("menu");
            } else {
              this.openNotificationWithIcon("error", {
                message: this.$t("Can't VM name changes"),
              });
            }
          })
          .catch(() => {
            this.openNotificationWithIcon("error", {
              message: this.$t("Can't VM name changes"),
            });
          })
          .finally((res) => {
            this.modal.confirmLoading = false;
          });
      }
    },
    sendReinstall() {
      if (this.disabledMenu("reinstall")) {
        this.$store
          .dispatch("utils/createTicket", {
            subject: `[generated]: Reinstall VM#${this.$route.params.pathMatch}`,
            message: `VM#${this.$route.params.pathMatch} имеет аддон, запрещающий автопереустановку. Необходимо выполнить перустановку вручную.`,
          })
          .then(() => {
            this.$message.success(this.$t("Order created successfully"));
            this.closeModal("reinstall");
          })
          .catch((err) => {
            const message = err.response?.data?.message ?? err.message ?? err;

            this.openNotificationWithIcon('error', {
              message: this.$t(message)
            });
          });
        return;
      }
      this.$confirm({
        title: this.$t("Do you want to reinstall this virtual machine?"),
        okType: "danger",
        content: (h) => (
          <div style="color:red;">{ this.$t("All data will be deleted!") }</div>
        ),
        onOk: () => {
          this.sendAction("reinstall");
          this.modal.menu = false;
          this.modal.reinstall = false;
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
        content: () => (
          <div style="color:red">{this.$t("All data will be deleted!")}</div>
        ),
        onOk: () => {
          const group = this.itemService.instancesGroups.find(
            (el) => el.uuid === this.VM.uuidInstancesGroups
          );

          this.isDeleteLoading = true;
          group.instances = group.instances.filter(
            (inst) => inst.uuid !== this.VM.uuid
          );
          group.resources.ips_public = group.instances.length ;
          this.$store
            .dispatch("nocloud/vms/updateService", this.itemService)
            .then((result) => {
              if (result) {
                this.openNotificationWithIcon("success", {
                  message: this.$t("VM deleted successfully"),
                });

                this.$router.push({ path: '/cloud' });
              } else {
                this.openNotificationWithIcon("error", {
                  message: this.$t("Failed to delete VM"),
                });
              }
            })
            .catch(() => {
              this.openNotificationWithIcon("error", {
                message: this.$t("Failed to delete VM"),
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
    getLogs() {
      this.isLogsLoading = true;
      this.changeModal('logs');
      this.$store.dispatch('nocloud/vms/actionVMInvoke', {
        uuid: this.$route.params.uuid,
        action: 'get_logs'
      })
        .then(({ meta: { logs } }) => {
          logs?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.logs = logs;
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          console.error(err);
          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
        })
        .finally(() => this.isLogsLoading = false);
    },
    bootOrderNewState() {
      this.closeModal("bootOrder");
    },
    addToClipboard({ target }) {
      if (navigator?.clipboard) {
        navigator.clipboard
          .writeText(target.innerText)
          .then(() => {
            this.openNotificationWithIcon("success", {
              message: this.$t('Text copied')
            });
          })
          .catch((res) => {
            console.error(res);
          });
      } else {
        this.openNotificationWithIcon("error", {
          message: this.$t('Clipboard is not supported')
        });
      }
    }
  },
  watch: {
    "VM.uuidService"() {
      if (!this.VM.uuidService) return;
      this.renameNewName = this.VM.title;
      this.$store.dispatch("nocloud/vms/subscribeWebSocket", this.VM.uuidService);
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
  background: #fff;
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
  color: var(--bright_font);
  top: 0;
  background-color: var(--main);
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
}
.Fcloud__header-title {
  position: relative;
  transition: transform 0.3s ease;
}
.Fcloud__title {
  font-weight: bold;
  font-size: 24px;
  line-height: 1;
}
.Fcloud__status {
  text-transform: uppercase;
  font-weight: bold;
  font-size: 14px;
  color: var(--bright_font);
  opacity: 0.7;
}
.Fcloud__status-color {
  position: absolute;
  height: 15px;
  width: 15px;
  background-color: var(--bright_font);
  border-radius: 50%;
  top: 55%;
  left: -25px;
  transform: translateY(-50%);
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
  background: var(--bright_bg);
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
  color: var(--bright_font);
  opacity: 0.8;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  transition: color 0.1s ease, text-shadow 0.1s ease, opacity 0.1s ease;
}
.Fcloud__button:hover .Fcloud__BTN-icon {
  background-color: #fff;
  box-shadow: 2px 2px 7px rgba(0, 0, 0, 0.2);
}
.Fcloud__button:hover .Fcloud__BTN-title {
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 1);
  opacity: 1;
}
.Fcloud__button:active {
  transform: scale(1.05);
}
.Fcloud__button.disabled {
  opacity: 0.8;
  transform: scale(0.8);
  color: #c9c9c9;
}
.Fcloud__button.disabled .Fcloud__BTN-title {
  color: var(--bright_font);
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
  padding: 10px 30px 0;
  overflow: auto;
}
.Fcloud__info-header {
  text-align: center;
}
.Fcloud__back {
  font-weight: bold;
  color: #fff;
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
  background: #fff;
  border-radius: 15px;
  padding: 15px 0;
}
.Fcloud__table td {
  padding: 0 15px;
}
.Fcloud__table td:first-child {
  color: rgba(0, 0, 0, 0.5);
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
.block {
  margin-top: 10px;
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
  background-color: #fff;
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
.permissions td:not(:first-child) {
  text-align: center;
  width: 80px;
}
.permissions th {
  text-align: center;
  font-weight: 600;
}
.permissions td:first-child {
  color: #919392;
}
.glowing-animations {
  animation: glowing 1.5s ease infinite;
}
@keyframes glowing {
  from,
  to {
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
.opencloud-enter,
.opencloud-leave-to {
  opacity: 0;
}
.opencloud-enter-active .Fcloud__header-title {
  transition: transform 0.2s 0.4s ease;
}
.opencloud-enter .Fcloud__header-title {
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}
.opencloud-enter-active .Fcloud__info {
  transition: opacity 0.2s 0.2s ease, transform 0.2s 0.2s ease;
}
.opencloud-enter .Fcloud__info {
  transform: translateY(200px);
  opacity: 0;
}
.opencloud-enter-active .Fcloud__button {
  transition: opacity 0.2s 0.1s ease, transform 0.2s 0.1s ease;
}
.opencloud-enter .Fcloud__button {
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
