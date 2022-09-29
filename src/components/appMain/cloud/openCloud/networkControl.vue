<template>
  <div class="network-control">
    <a-table
      :columns="columns"
      :data-source="networks"
      :pagination="false"
      rowKey="id"
    >
      <span slot="ip" slot-scope="value">
        {{ value || "--" }}
      </span>
    </a-table>

    <a-row style="margin: 15px 0" :gutter="[10, 10]">
      <a-col style="display: flex; align-items: center" :sm="12" :xs="24">
        <span>{{ $t("Public network") }}:</span>
        <a-switch
          v-model="networking.public.status"
          :style="{ 'margin': '0 5px' }"
          @change="changeNetwork('public')"
        />
        <a-input-number
          v-model="networking.public.count"
          :min="publicMin"
          :max="10"
          :disabled="!networking.public.status"
        />
      </a-col>

      <a-col style="display: flex; align-items: center" :sm="12" :xs="24">
        <span>{{ $t("Private network") }}:</span>
        <a-switch
          v-model="networking.private.status"
          :style="{ 'margin': '0 5px' }"
          @change="changeNetwork('private')"
        />
        <a-input-number
          v-model="networking.private.count"
          :min="privateMin"
          :max="10"
          :disabled="!networking.private.status"
        />
      </a-col>
    </a-row>

    <div style="display: flex; justify-content: flex-end; gap: 10px">
      <a-button @click="$emit('closeModal')">
        {{ $t('Cancel') }}
      </a-button>
      <a-button type="primary" :loading="isLoading" @click="sendNewIP">
        {{ $t('Send') }}
      </a-button>
    </div>
  </div>
</template>

<script>
import notification from "@/mixins/notification";

export default {
  name: "networkControl",
  props: {
    itemService: {
      type: Object,
      default: "",
    },
    VM: {
      type: Object,
      dafault: "",
    },
  },
  mixins: [notification],
  data: () => ({
    isLoading: false,
    columns: [
      {
        title: "№",
        dataIndex: "id",
        key: "id",
        width: 50,
        align: "center",
      },
      {
        title: "IP",
        dataIndex: "ip",
        key: "ip",
        scopedSlots: { customRender: "ip" },
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
      }
    ],
    networking: {
      private: {
        list: [],
        status: false,
        count: 0
      },
      public: {
        list: [],
        status: false,
        count: 0
      }
    }
  }),
  computed: {
    networks() {
      const networks = [];
      const { length } = this.networking.private.list;

      this.networking.private.list.forEach((ip, i) => {
        networks.push({ id: i + 1, ip, type: 'private' });
      });

      this.networking.public.list.forEach((ip, i) => {
        networks.push({ id: length + i + 1, ip, type: 'public' });
      });

      return networks;
    },
    privateMin() {
      return (this.networking.private.status) ? 1 : 0;
    },
    publicMin() {
      return (this.networking.public.status) ? 1 : 0;
    }
  },
  methods: {
    changeNetwork(type) {
      switch (type) {
        case 'public':
          if (!this.networking.public.status) {
            this.networking.private.status = true;
            this.networking.public.count = 0;
          }
          break;
        case 'private':
          if (!this.networking.private.status) {
            this.networking.public.status = true;
            this.networking.private.count = 0;
          }
          break;
      }
    },
    updateService() {
      this.$store
        .dispatch("nocloud/vms/updateService", this.itemService)
        .then((result) => {
          if (result) {
            this.openNotificationWithIcon("success", {
              message: `Change ip successfully`,
            });

            this.$emit('closeModal');
          } else {
            this.openNotificationWithIcon("error", {
              message: `Can't change ip VM`,
            });
          }
        })
        .catch((err) => {
          this.openNotificationWithIcon("error", {
            message: `Can't change ip VM`,
          });
          console.error(err);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    sendNewIP() {
      const group = this.itemService.instancesGroups.find((el) => el.sp === this.VM.sp);
      const instance = group.instances.find((el) => el.uuid === this.VM.uuid);

      instance.resources.ips_private = this.networking.private.count;
      instance.resources.ips_public = this.networking.public.count;
      instance.state.meta.networking = {
        private: this.networking.private.list,
        public: this.networking.public.list
      };

      const res = group.instances.reduce((prev, curr) => ({
        private: prev.private + curr.resources.ips_private,
        public: prev.public + curr.resources.ips_public
      }), { private: 0, public: 0 });

      group.resources.ips_private = res.private;
      group.resources.ips_public = res.public;
      this.isLoading = true;
      this.updateService('Add');
    },
  },
  mounted() {
    const privateIPS = this.VM.state?.meta.networking.private || [];
    const publicIPS = this.VM.state?.meta.networking.public || [];
    const privateCount = this.VM.resources.ips_private;
    const publicCount = this.VM.resources.ips_public;

    this.networking.private.list = JSON.parse(JSON.stringify(privateIPS));
    this.networking.public.list = JSON.parse(JSON.stringify(publicIPS));
    this.networking.private.status = privateCount > 0;
    this.networking.public.status = publicCount > 0;
    this.networking.private.count = privateCount;
    this.networking.public.count = publicCount;
  }
};
</script>
