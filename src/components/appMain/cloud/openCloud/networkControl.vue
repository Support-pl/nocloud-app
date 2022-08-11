<template>
  <div class="network-control">
    <a-table
      :columns="NICsColumns"
      :data-source="networks"
      :pagination="false"
      rowKey="id"
    >
      <div slot="buttons" slot-scope="value, row">
        <span
          v-if="value.id !== 0"
          class="modal_table_action_btn"
          :title="$t('Detach')"
          @click="detachInit(row)"
        >
          <a-icon type="close" />
        </span>
      </div>

      <span slot="ip" slot-scope="value">
        {{ value || "--" }}
      </span>
    </a-table>

    <a-modal
      :title="$t('NIC detach')"
      :visible="modal.detach"
      :confirm-loading="detach.loading"
      @ok="removeIP"
      @cancel="closeModal('detach')"
    >
      <p>{{ $t("This will detach the NIC immediately") }}</p>
      <p>{{ $t("Do you want to proceed?") }}</p>
    </a-modal>

    <a-modal
      :title="$t('NIC attach')"
      :visible="modal.attach"
      :confirm-loading="attach.loading"
      @ok="sendNewIP"
      @cancel="closeModal('attach')"
      :cancelText="$t('Cancel')"
      :okText="$t('Send')"
    >
      <a-row :gutter="[10, 10]">
        <a-col style="display: flex; align-items: center">
          <span>{{ $t("Public network") }}:</span>
          <a-switch
            v-model="networking.public.status"
            :style="{ 'margin': '0 10px' }"
          />
          <a-input-number
            v-model="networking.public.count"
            :min="publicMin"
            :max="10"
            :disabled="!networking.public.status"
          />
        </a-col>

        <a-col style="display: flex; align-items: center">
          <span>{{ $t("Private network") }}:</span>
          <a-switch
            v-model="networking.private.status"
            :style="{ 'margin': '0 10px' }"
          />
          <a-input-number
            v-model="networking.private.count"
            :min="privateMin"
            :max="10"
            :disabled="!networking.private.status"
          />
        </a-col>
      </a-row>
    </a-modal>

    <a-row style="margin-top: 15px">
      <a-col>
        <a-button
          @click="showModal('attach')"
          @final="closeModal('detach')"
        >
          {{ $t("attach new NIC") }}
        </a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import md5 from "md5";
import { mapGetters } from "vuex";
import notification from "@/mixins/notification";

const NICsColumns = [
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
  },
  {
    title: "Actions",
    key: "actions",
    scopedSlots: { customRender: "buttons" },
    width: 100,
  },
];

const privateIPS = [
  {
    min: "10.0.0.0",
    max: "10.255.255.255",
    mask: 8,
  },
  {
    min: "172.16.0.0",
    max: "172.31.255.255",
    mask: 12,
  },
  {
    min: "192.168.0.0",
    max: "192.168.255.255",
    mask: 16,
  },
];

let masks = [];
for (let i = 8; i <= 32; i++) {
  masks.push(i);
}

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
  data() {
    return {
      columns: [
        {
          title: "№",
          dataIndex: "NIC_ID_ITEM",
          key: "NIC_ID_ITEM",
          width: 50,
          align: "center",
        },
        {
          title: this.$t("Network"),
          dataIndex: "NETWORK",
          key: "NETWORK",
          // scopedSlots: { customRender: 'ImageName' },
        },
        {
          title: this.$t("IP"),
          dataIndex: "IP",
          key: "IP",
          scopedSlots: { customRender: "ip" },
        },
        {
          title: this.$t("Actions"),
          key: "actions",
          scopedSlots: { customRender: "buttons" },
          width: 100,
        },
      ],
      NICsColumns,
      NICs: [],
      privateIPS,
      masks,
      modal: {
        detach: false,
        attach: false,
      },
      detach: {
        NIC: -1,
        loading: false,
      },
      attach: {
        loading: false,
        type: 1,
        mask: 24,
        publicAR_ID: -1,
      },
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
    };
  },
  computed: {
    ...mapGetters("cloud", {
      SingleCloud: "getOpenedCloud",
    }),
    ...mapGetters({ user: "getUser" }),
    networks() {
      if (Array.isArray(this.SingleCloud.NIC)) {
        const arrayNIC = [];
        for (let i = 0; i < this.SingleCloud.NIC.length; i++) {
          if (this.SingleCloud.NIC[i] !== null) {
            const objNIC = { ...this.SingleCloud.NIC[i], NIC_ID_ITEM: i + 1 };
            arrayNIC.push(objNIC);
          }
        }
        return arrayNIC;
      }
      const networks = [];

      this.networking.private.list.forEach((ip, i) => {
        networks.push({ id: i + 1, ip, type: 'private' });
      });
      const length = this.networking.private.list.length;

      this.networking.public.list.forEach((ip, i) => {
        networks.push({ id: length + i + 1, ip, type: 'public' });
      });

      return networks;
    },
    possibleMasks() {
      const interval = this.privateIPS.find((el) => {
        const min = this.ipToSingleNumber(el.min);
        const max = this.ipToSingleNumber(el.max);
        const ip = this.ipToSingleNumber(this.attach.newIP);
        return min <= ip && ip <= max;
      });
      if (interval != undefined) {
        const mask = interval.mask;
        const posibleMasks = this.masks.filter((el) => el >= mask);
        // this.attach.mask = posibleMasks[0];
        return posibleMasks;
      } else {
        // this.attach.mask = 24;
        return this.masks;
      }
    },
    privateMin() {
      return this.VM.resources.ips_private;
    },
    publicMin() {
      return this.VM.resources.ips_public;
    }
  },
  methods: {
    URLparameter(obj, outer = "") {
      var str = "";
      for (var key in obj) {
        if (key == "price") continue;
        if (str != "") {
          str += "&";
        }
        if (typeof obj[key] == "object") {
          str += this.URLparameter(obj[key], outer + key);
        } else {
          str += outer + key + "=" + encodeURIComponent(obj[key]);
        }
      }
      return str;
    },
    showModal(modalname) {
      this.modal[modalname] = true;
    },
    closeModal(modalname) {
      this.modal[modalname] = false;
    },
    detachInit(NIC) {
      this.detach.NIC = NIC;
      this.showModal("detach");
    },
    sendDetach(disk) {
      // console.log(disk)
      if (this.detach.imageID == 0) {
        this.$message.warning("You can' remove main NIC");
        return;
      }

      const user = this.user;
      const vmid = this.SingleCloud.ID;

      const close_your_eyes = md5("VMNICdetach" + user.id + user.secret);
      const auth = {
        userid: user.id,
        vmid,
        secret: close_your_eyes,
      };
      const actionParams = {
        nicID: this.detach.NIC,
      };
      const query = Object.assign(auth, actionParams);
      const url = `/VMNICdetach.php?${this.URLparameter(query)}`;

      this.detach.loading = true;
      this.$axios
        .get(url)
        .then((res) => {
          // console.log(res);
          if (res.data.result == "success")
            this.$message.success(`NIC detached`);
          else {
            this.$message.error(`VM disk detach failed`);
            console.error(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setTimeout(() => {
            this.$store.dispatch(
              "cloud/silentUpdate",
              this.$route.params.pathMatch
            );
            this.$store.dispatch("network/silentFetchNICs");
          }, 500);
          this.closeModal("detach");
          this.detach.loading = false;
        });
    },
    isValidIP(iptotest) {
      const ipreg = new RegExp(
        "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
      );
      return ipreg.test(iptotest);
    },
    ipToSingleNumber(ip) {
      const arrayOfOctets = ip.split(".");
      const binArray = arrayOfOctets.map((part) =>
        this.dec2Bin(part).padStart(8, 0)
      );
      return this.bin2Dec(binArray.join(""));
    },
    SingleNumberToIp(num) {
      const fullBinary = this.dec2Bin(num).padStart(24, "0");
      const arrayOfBinOctets = fullBinary.match(/.{8}/g);
      const arrayOfOctets = arrayOfBinOctets.map((bin) => this.bin2Dec(bin));
      return arrayOfOctets.join(".");
    },

    updateService(action) {
      this.$store
        .dispatch("nocloud/vms/updateService", this.itemService)
        .then((result) => {
          if (result) {
            this.openNotificationWithIcon("success", {
              message: `${action} ip successfully`,
            });

            if (action === 'Delete') this.closeModal("detach");
            else this.closeModal('attach');
          } else {
            this.openNotificationWithIcon("error", {
              message: `Can't ${action.toLowerCase()} ip VM`,
            });
          }
        })
        .catch((err) => {
          this.openNotificationWithIcon("error", {
            message: `Can't ${action.toLowerCase()} ip VM`,
          });
          console.error(err);
        })
        .finally(() => {
          this.attach.loading = false;
          this.detach.loading = false;
        });
    },
    removeIP() {
      const { type, ip } = this.detach.NIC;
      const group = this.itemService.instancesGroups.find(
        (el) => el.uuid === this.VM.uuidInstancesGroups
      );
      const instance = group.instances
        .find((el) => el.uuid === this.VM.uuid);

      instance.resources[`ips_${type}`] =
        --this.networking[type].count;

      instance.state.meta.networking[type] = 
        this.networking[type].list.filter((el) => el !== ip);

      this.detach.loading = true;
      this.updateService('Delete');
    },
    sendNewIP() {
      const group = this.itemService.instancesGroups.find(
        (el) => el.uuid === this.VM.uuidInstancesGroups
      );
      const instance = group.instances
        .find((el) => el.uuid === this.VM.uuid);

      instance.resources = {
        ...instance.resources,
        ips_private: this.networking.private.count,
        ips_public: this.networking.public.count
      };
      instance.state.meta.networking = {
        private: this.networking.private.list,
        public: this.networking.public.list
      };
      this.attach.loading = true;
      this.updateService('Add');
      // const user = this.user;
      // const vmid = this.SingleCloud.ID;
      // const close_your_eyes = md5("VMNICattach" + user.id + user.secret);
      // const auth = {
      //   userid: user.id,
      //   vmid,
      //   secret: close_your_eyes,
      // };
      // let query = {};
      // if (this.attach.type == 1) {
      //   if (
      //     !privateIPS.some((el) => {
      //       const min = this.ipToSingleNumber(el.min);
      //       const max = this.ipToSingleNumber(el.max);
      //       const ip = this.ipToSingleNumber(this.attach.newIP);
      //       return min <= ip && ip <= max;
      //     }) &&
      //     this.attach.newIP != ""
      //   ) {
      //     this.$message.error("You can't use that IP for private network");
      //     return;
      //   }
      //   let actionParams = {
      //     type: this.attach.type,
      //     // nicID: this.NICs.PRIVATE.NETWORK_ID
      //   };
      //   if (this.attach.newIP != "") {
      //     actionParams.newIP = this.attach.newIP;
      //     actionParams.mask = this.attach.mask;
      //   }
      //   query = Object.assign(auth, actionParams);
      // }
      // if (this.attach.type == 2) {
      //   let actionParams = {
      //     type: this.attach.type,
      //     AR_ID: this.attach.publicAR_ID,
      //   };
      //   query = Object.assign(auth, actionParams);
      // }
      // this.attach.loading = true;
      // const url = `/VMNICattach.php?${this.URLparameter(query)}`;
      // this.$axios
      //   .get(url)
      //   .then((res) => {
      //     // console.log(res);
      //     if (res.data.result == "success")
      //       this.$message.success(`NIC attached`);
      //     else {
      //       this.$message.error(`NIC attach failed`);
      //       console.error(res.data);
      //     }
      //   })
      //   .catch((err) => {
      //     this.$message.error(`NIC attach failed`);
      //     console.error(err);
      //   })
      //   .finally(() => {
      //     this.$store.dispatch(
      //       "cloud/silentUpdate",
      //       this.$route.params.pathMatch
      //     );
      //     this.$store.dispatch("network/silentFetchNICs");
      //     this.closeModal("attach");
      //     this.attach.loading = false;
      //     this.attach.newIP = "";
      //   });
    },
    dec2Bin(dec) {
      return (dec >>> 0).toString(2);
    },
    bin2Dec(bin) {
      return parseInt(bin, 2);
    },
    ipInput(e) {
      this.attach.newIP = this.attach.newIP.replace(/,/gi, ".");
      this.attach.newIP = this.attach.newIP.replace(/[a-z]/gi, "");
      this.attach.newIP = this.attach.newIP.replace(/(\d{3})(\d)/gi, "$1.$2");
      this.attach.newIP = this.attach.newIP.replace(
        /((\d{1,3}\.){3}\d{1,3})\d?\.?/gi,
        "$1"
      );
      this.attach.newIP = this.attach.newIP.replace(/(\d{1,3})\d*/gi, "$1");
      this.attach.newIP = this.attach.newIP.replace(
        /[3-9]\d\d|[2-9][6-9]\d|[2-9][5-9][6-9]/gi,
        "255"
      );
    },
    selectedRows(rows) {
      this.attach.publicAR_ID = rows.selectedRows
        .map((el) => el.AR_ID)
        .join(",");
      // console.log(this.attach.publicAR_ID);
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

<style></style>
