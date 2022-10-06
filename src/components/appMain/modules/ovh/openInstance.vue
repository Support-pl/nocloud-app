<template>
  <div class="Fcloud">
    <slot name="header" />
    <div class="Fcloud__buttons" v-if="!VM.state">
      <div class="Fcloud__button" @click="deployService()">
        <div class="Fcloud__BTN-icon">
          <a-icon type="deployment-unit" />
        </div>
        <div class="Fcloud__BTN-title">
          <!-- {{$t('Start')}} -->
          Deploy
        </div>
      </div>
    </div>
    <div class="Fcloud__buttons" v-else>
      <div
        v-if="VM.state && VM.state.state !== 'STOPPED'"
        class="Fcloud__button"
        @click="openModal('shutdown')"
        :class="{
          disabled: statusVM.shutdown,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop"></div>
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Power off") }}</div>
        <a-modal
          v-model="modal.shutdown"
          :title="$t('cloud_Shutdown_modal')"
          @ok="handleOk('shutdown')"
        >
          <p>{{ $t("cloud_Shutdown_invite") }}</p>
          <a-radio-group
            v-model="option.shutdown"
            name="shutdownOption"
            :default-value="1"
          >
            <a-radio :value="0" :style="{ 'margin-bottom': '10px' }">
              <a-tag color="green" :style="{ margin: '0 2px 0 0' }">{{
                $t("cloud_Regular")
              }}</a-tag>
              {{ $t("cloud_Shutdown") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red" :style="{ margin: '0 2px 0 0' }">
                HARD
              </a-tag>
              {{ $t("cloud_Shutdown") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
      <div
        v-else
        class="Fcloud__button"
        @click="sendAction('resume')"
        :class="{
          disabled: statusVM && statusVM.start,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="caret-right" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Start") }}</div>
      </div>
      <div
        class="Fcloud__button"
        @click="openModal('reboot')"
        :class="{
          disabled: statusVM && statusVM.reboot,
          btn_disabled_wiggle: true,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="redo" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Reboot") }}</div>
        <a-modal
          v-model="modal.reboot"
          :title="$t('cloud_Reboot_modal')"
          @ok="handleOk('reboot')"
        >
          <p>{{ $t("cloud_Reboot_invite") }}</p>
          <a-radio-group
            v-model="option.reboot"
            name="rebootOption"
            :default-value="1"
          >
            <a-radio :value="0">
              <a-tag color="green" :style="{ 'margin-bottom': '10px' }">
                {{ $t("cloud_Regular") }}
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red"> HARD </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
      <div
        class="Fcloud__button"
        @click="openModal('recover')"
        :class="{
          disabled: statusVM && statusVM.recover,
        }"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="backward" />
        </div>
        <div class="Fcloud__BTN-title">{{ $t("Recover") }}</div>
        <a-modal
          v-model="modal.recover"
          :title="$t('cloud_Recover_modal')"
          @ok="handleOk('recover')"
        >
          <p>{{ $t("cloud_Recover_invite_line1") }}</p>
          <p>{{ $t("cloud_Recover_invite_line2") }}</p>
          <p>{{ $t("cloud_Recover_invite_line3") }}</p>
          <p>{{ $t("cloud_Recover_invite") }}</p>
          <a-radio-group
            v-model="option.recover"
            name="recover"
            :default-value="1"
          >
            <a-radio :value="0">
              {{ $t("yesterday") }}
            </a-radio>
            <a-radio :value="1">
              {{ $t("today") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
    </div>

    <div class="Fcloud__info">
      <div class="Fcloud__info-header">
        <div class="Fcloud__info-title">
          {{ $t("Information") }}
        </div>
      </div>
      <div
        class="Fcloud__info-block block"
        v-if="VM.state && VM.state.meta.networking"
      >
        <div class="Fcloud__block-header">
          <a-icon type="flag" theme="filled" />
          {{ "IP" }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column" style="flex-direction: row">
            <div
              class="block__value" v-if="dataSP" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr
                    v-for="nic in VM.state &&
                    VM.state.meta.networking.public"
                    :key="nic"
                  >
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="block__value" v-if="dataSP" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr
                    v-for="nic in VM.state &&
                    VM.state.meta.networking.private"
                    :key="nic"
                  >
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="environment" theme="filled" />
          {{ "Location" }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div
              class="block__value"
              v-if="dataSP"
              style="font-size: 18px"
            >
              {{ dataSP.title }}
            </div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="info-circle" />
          {{ $t("info") | capitalize }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">OS</div>
            <div class="block__value">
              {{ OSName || "no data" }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">Plan</div>
            <div class="block__value">
              {{ VM.billingPlan && VM.billingPlan.title || 'no data' }}
            </div>
          </div>
          <div class="block__column" v-if="VM.product">
            <div class="block__title">Product</div>
            <div class="block__value">
              {{ VM.product.replace('_', ' ').toUpperCase() || 'no data' }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="setting" theme="filled" />
          {{ $t("cloud_system") | capitalize }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">CPU</div>
            <div class="block__value">
              {{ config.vcpus }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Memory") }}</div>
            <div class="block__value">
              {{ (config.ram / 1024).toFixed(2) }} GB
            </div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="database" theme="filled" />
          {{ $t("cloud_Storage") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Type") }}</div>
            <div class="block__value">
              {{ config.type }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">{{ $t("cloud_Size") }}</div>
            <div class="block__value">
              {{ mbToGb(config.disk * 1024) }} GB
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import notification from "@/mixins/notification";

export default {
  name: 'openInstance',
  props: { VM: { type: Object, required: true } },
  mixins: [notification],
  data: () => ({
    images: [],
    config: {},
    modal: {
      reboot: false,
      shutdown: false,
      recover: false,
      snapshot: false,
    },
    option: {
      reboot: 0,
      shutdown: 0,
      recover: 0,
    },
    actualAction: "",
    actionLoading: false,
    selectedSP: "",
    deployLoading: false,
  }),
  methods: {
    getData() {
      if (!this.VM?.config) return;
      const flavor = this.VM.config.flavorId;
      const region = this.VM.config.region;

      this.$api.post(`/sp/${this.dataSP.uuid}/invoke`, {
        method: 'images', params: { flavor, region }
      })
        .then(({ meta }) => {
          this.images = meta.result;
        });

      this.$api.post(`/sp/${this.dataSP.uuid}/invoke`, {
        method: 'flavors', params: { region }
      })
        .then(({ meta }) => {
          this.config = meta.result.find((el) => el.id === flavor);
        });
    },
    deployService() {
      this.actionLoading = true;
      this.$api.services
        .up(this.VM.uuidService)
        .then(() => {
          const opts = {
            message: `Done!`,
          };
          this.openNotificationWithIcon("success", opts);
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.actionLoading = false;
        });
    },
    mbToGb(mb) {
      return (mb / 1024).toFixed(1);
    },
    handleOk(from) {
      this.VM.state.meta.state = 0;

      switch (from) {
        case "reboot":
          this.sendAction("reboot");
          this.modal.reboot = false;
          break;
        case "shutdown":
          if (this.option.shutdown) {
            this.sendAction("poweroffHard");
          } else {
            this.sendAction("poweroff");
          }
          this.modal.shutdown = false;
          break;
        case "recover":
          this.$confirm({
            title: this.$t("Do you want to download a backup?"),
            maskClosable: true,
            content: () => {
              return <div>{ this.$t("All unsaved progress will be lost, are you sure?") }</div>;
            },
            okText: this.$t("Yes"),
            cancelText: this.$t("Cancel"),
            onOk: () => {
              if (this.option.recover) {
                this.sendAction("recoverToday");
              } else {
                this.sendAction("recoverYesterday");
              }
              this.modal.recover = false;
            },
            onCancel() {},
          });
          break;
      }
    },
    openModal(name) {
      switch (name) {
        case "start":
          if (this.statusVM.start) return;
          break;
        case "shutdown":
          if (this.statusVM.shutdown) return;
          break;
        case "reboot":
          if (this.statusVM.reboot) return;
          break;
        case "delete":
          if (this.statusVM.delete) return;
          break;
        case "recover":
          if (this.statusVM.recover) return;
          break;
        case "snapshot":
          this.snapshots.modal = true;
          break;
        case "createSnapshot":
          this.snapshots.addSnap.modal = true;
      }
      this.modal[name] = true;
    },
    sendAction(action) {
      const hard = this.option.reboot || action.includes('Hard');
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: action.replace('Hard', ''),
        params: (hard) ? { hard: true } : {},
      }

      if (action === 'recoverYesterday' || action === 'recoverToday') {
        action = action.replace('recover', '');
        this.$api.get(this.baseURL, { params: {
          run: 'create_ticket',
          subject: `Recover VM - ${this.VM.title}`,
          message: `1. ID: ${this.VM.uuid}\n2. Date: ${action}`,
          department: 1,
        }})
          .then((resp) => {
            if (resp.result == "success") {
              this.$message.success("Ticket created successfully");
            } else {
              throw resp;
            }
          })
          .catch((err) => {
            console.error(err);
            this.$message.error("Something went wrong");
          });
        return;
      }
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then(() => {
          const opts = {
            message: `Done!`,
          };
          this.openNotificationWithIcon("success", opts);
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        });
    },
  },
  created() { this.getData() },
  computed: {
    baseURL() {
      return this.$store.getters['support/getURL'];
    },
    statusVM() {
      if (!this.VM) return;
      if (this.VM.state.state === 'PENDING') return {
        shutdown: true, reboot: true, recover: true
      }
      return {
        shutdown: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        reboot: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        start: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        recover: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
      };
    },

    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    dataSP() {
      return this.getSP.find((el) => el.uuid === this.VM.sp);
    },
    OSName() {
      const id = this.VM?.config?.imageId;

      return this.images.find((os) => os.id === id)?.name;
    }
  },
  watch: {
    'VM.config'() { this.getData() }
  }
}
</script>
