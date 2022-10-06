<template>
  <div class="cloud__item-wrapper" @click="(e) => cloudClick(instance.uuid, e)">
    <div class="cloud__item">
      <div class="cloud__upper">
        <div
          class="item__color"
          :style="{ 'background-color': statusColor }"
        ></div>
        <!-- <div class="item__title">{{cloud.CUSTOM_VM_NAME ? cloud.CUSTOM_VM_NAME : cloud.NAME}}</div> -->
        <!-- {{instance && instance}} -->
        <div class="item__title">{{ instance.title }}</div>

        <!-- <div class="item__status">{{ $t(`cloudStateItem.${cloud.STATE}`) }}</div> -->
        <div class="item__status">
          {{ instance.state && instance.state.state }}
        </div>
      </div>
      <!-- <div class="item_location">{{ location }}</div> -->
      <div class="cloud__lower">
        <div v-if="!(instance.state && networking.length > 0)">
          IP: {{ $t("ip.none") }}
        </div>
        <a-collapse v-else v-model="activeKey" expandIconPosition="right" :bordered="false">
          <a-collapse-panel key="1" :header="title">
            <div
              v-for="(item, index) in networking"
              :key="index"
            >
              {{ item }}
            </div>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </div>
    <div class="cloud__label cloud__label__mainColor">
      {{ instance.billingPlan.kind === "STATIC" ? $t("PrePaid") : $t("PAYG") }}
    </div>
  </div>
</template>

<script>
export default {
  name: "cloudItem",
  props: { instance: { type: Object } },
  data: () => ({ activeKey: [] }),
  computed: {
    statusColor() {
      if (!this.instance.state) return "rgb(145, 145, 145)"
      const state = (this.instance?.config?.imageId)
        ? this.instance.state.state
        : this.instance.state.meta.lcm_state_str;

      switch (state) {
        case "RUNNING":
          return "#0fd058";
        // останавливающийся и запускающийся
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
    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    isLoading() {
      return this.$store.getters["nocloud/vms/isLoading"];
    },
    networking() {
      const net = this.instance?.state?.meta.networking;

      if (!net) return [];
      return [...net.public, ...net.private];
    },
    title() {
      return (!this.activeKey.includes('1')) ? `IP: ${this.networking[0]}` : 'IP\'s:';
    }
  },
  methods: {
    cloudClick(uuid, { target }) {
      if (target.hasAttribute('role') || target.hasAttribute('viewBox')) return;
      this.$router.push({ name: "openCloud_new", params: { uuid } });
    },
  },
  created() {
    if (this.isLogged) {
      this.$store.dispatch("nocloud/sp/fetch");
    }
  },
};
</script>

<style>
.cloud__item-wrapper {
  position: relative;
  padding: 8px 15px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: #fff;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  overflow: hidden;
}
.cloud__item-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.55);
}
.cloud__item-wrapper:not(:last-child) {
  margin-bottom: 20px;
}
.cloud__item {
  position: relative;
  font-size: 16px;
}
.cloud__upper {
  display: flex;
  justify-content: space-between;
}
.item__color {
  width: 18px;
  height: 18px;
  background-color: #fff;
  position: absolute;
  border-radius: 50%;
  left: -28px;
  top: 5px;
}
.item__title {
  flex-grow: 1;
  padding-right: 10px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cloud__lower {
  padding-right: 50px;
  margin-top: 7px;
}
.item__status,
.cloud__lower {
  color: rgba(0, 0, 0, 0.4);
}
@media screen and (min-width: 768px) {
  .cloud__item-wrapper:not(:last-child) {
    margin-bottom: 0px;
  }
  .cloud__item-wrapper {
    height: max-content;
  }
}
.cloud__label {
  position: absolute;
  right: 0;
  bottom: 0;
  background: var(--main);
  color: #fff;
  padding: 3px 15px;
  border-radius: 20px 0px 0px 0px;
  transition-property: padding, border-radius;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.cloud__item-wrapper:hover .cloud__label {
  padding: 7px 20px;
  border-radius: 22px 0px 0px 0px;
}
.cloud__item-wrapper .ant-collapse {
  width: fit-content;
  background: transparent;
}
.cloud__item-wrapper .ant-collapse-item {
  border: none !important;
  border-radius: 0 !important;
}
.cloud__item-wrapper .ant-collapse-header {
  padding: 1px 20px 1px 0 !important;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4) !important;
}
.cloud__item-wrapper .ant-collapse-content-box {
  padding: 5px !important;
  color: rgba(0, 0, 0, 0.4) !important;
}
.cloud__item-wrapper .ant-collapse-arrow {
  top: 11px !important;
  right: 5px !important;
}
</style>
