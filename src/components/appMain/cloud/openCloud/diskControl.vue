<template>
  <div class="disk">
    {{disks}}
    <a-table :columns="columns" :data-source="disks" :pagination="false">
      <span slot="ImageName" slot-scope="value, row">{{
        getImageName(row)
      }}</span>
      <span slot="size" slot-scope="value"
        >{{ Math.round(value / 1024) }}GB</span
      >

      <div slot="buttons" slot-scope="value, row">
        <span
          v-if="value.DISK_ID != 0"
          class="modal_table_action_btn"
          title="Detach"
          @click="detachInit(row)"
        >
          <a-icon type="close" />
        </span>
        <span
          class="modal_table_action_btn"
          title="Resize"
          @click="resizeInit(row)"
        >
          <a-icon type="arrows-alt" />
        </span>

        <a-modal
          title="Disk resize"
          :visible="modal.resize"
          :confirm-loading="resize.loading"
          @ok="sendResize"
          @cancel="closeModal('resize')"
          :cancelText="$t('Cancel')"
        >
          <a-slider
            v-if="modal.resize"
            :min="disks[resize.currentdiskIndex].SIZE / 1024"
            :tooltip-visible="true"
            :tipFormatter="(el) => el + resize.scale"
            v-model="resize.newsize"
          />
          {{ resize.newsize }}
        </a-modal>
      </div>
    </a-table>
    <a-row style="margin-top: 15px">
      <a-col>
        <a-button @click="showModal('attach')">{{
          $t("attach new disk")
        }}</a-button>
      </a-col>
    </a-row>
    <a-modal
      title="Disk detach"
      :visible="modal.detach"
      :confirm-loading="detach.loading"
      @ok="sendDetach"
      @cancel="closeModal('detach')"
      :cancelText="$t('Cancel')"
    >
      <p>{{ $t("disk_manage.This will detach the disk immediately") }}</p>
      <p>{{ $t("disk_manage.All data will be lost") }}</p>
      <p>{{ $t("disk_manage.Do you want to proceed?") }}</p>
    </a-modal>
    <a-modal
      title="Disk attach"
      :visible="modal.attach"
      :confirm-loading="attach.loading"
      @ok="sendAttach"
      @cancel="closeModal('attach')"
      :cancelText="$t('Cancel')"
    >
      <a-radio-group v-model="attach.type">
        <a-radio disabled :value="1">{{ $t("image") }}</a-radio>
        <a-radio :value="2">{{ $t("volatile disk") }}</a-radio>
      </a-radio-group>

      <template v-if="attach.type == 1">
        <a-radio-group
          v-model="attach.imageID"
          style="display: flex; flex-direction: column; margin-top: 20px"
        >
          <a-row :gutter="[10, 10]">
            <a-col v-for="image in images" :key="image.ID" :span="12">
              <a-radio :value="image.ID"
                >{{ image.NAME }} ({{ imageTypes[image.TYPE] }})</a-radio
              >
            </a-col>
          </a-row>
        </a-radio-group>
      </template>

      <template v-if="attach.type == 2">
        <a-slider
          v-if="attach.type == 2 && modal.attach"
          :min="10"
          :max="200"
          :tooltip-visible="true"
          :tipFormatter="(el) => el + 'GB'"
          v-model="attach.size"
          style="margin-top: 60px"
        />
      </template>
    </a-modal>
  </div>
</template>

<script>
import md5 from "md5";
import { mapGetters } from "vuex";

export default {
  name: "diskControl",
  data() {
    return {
      columns: [
        {
          title: "№",
          dataIndex: "DISK_ID_ITEM",
          // rowKey: 'DISK_ID',
          key: "DISK_ID_ITEM",
          width: 50,
          align: "center",
        },
        {
          title: this.$t("disk"),
          key: "ImageName",
          scopedSlots: { customRender: "ImageName" },
        },
        {
          title: this.$t("size"),
          dataIndex: "SIZE",
          key: "SIZE",
          scopedSlots: { customRender: "size" },
        },
        {
          title: this.$t("Actions"),
          key: "actions",
          scopedSlots: { customRender: "buttons" },
          width: 100,
        },
      ],

      modal: {
        resize: false,
        detach: false,
        attach: false,
        detach: false,
      },
      resize: {
        currentdisk: 0,
        currentdiskIndex: 0,
        newsize: 0,
        scale: "GB",
        loading: false,
      },
      attach: {
        types: {
          1: "Image",
          2: "Volatile disk",
        },
        type: 2,
        size: 10,
        imageID: -1,
        loading: false,
      },
      detach: {
        loading: false,
        diskID: -1,
      },
      images: [],
      imageTypes: ["OS", "CDROM", "DATABLOCK"],
    };
  },
  computed: {
    ...mapGetters("cloud", {
      SingleCloud: "getOpenedCloud",
    }),
    ...mapGetters({ user: "getUser" }),
    disks() {
      const data = this.$store.getters["nocloud/vms/getInstances"];
      for (let item of data) {
        if (item.uuid === this.$route.params.uuid) {
          console.log(item);
          return item;
        }
      }
    },
    // disks() {
    //   if (Array.isArray(this.SingleCloud.DISKS)) {
    //     const arrayDISKS = [];
    //     for (let i = 0; i < this.SingleCloud.DISKS.length; i++) {
    //       const objDISKS = {
    //         ...this.SingleCloud.DISKS[i],
    //         DISK_ID_ITEM: i + 1,
    //         FORMAT: (this.SingleCloud.DISKS[i].FORMAT = "VMDK"),
    //       };
    //       arrayDISKS.push(objDISKS);
    //     }
    //     return arrayDISKS;
    //   }
    //   return [this.SingleCloud.DISKS];
    // },
  },
  mounted() {
    const user = this.user;
    const vmid = this.SingleCloud.ID;

    const close_your_eyes = md5("getImages" + user.id + user.secret);

    let query = {
      userid: user.id,
      vmid,
      secret: close_your_eyes,
    };

    this.$axios
      .get(`getImages.php?${this.URLparameter(query)}`)
      .then((res) => {
        this.images = res.data.IMAGE_POOL.IMAGE;
      })
      .catch((err) => {
        console.error(err);
      });
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
    detachInit(disk) {
      // console.log(disk)
      this.detach.diskID = disk.DISK_ID;
      this.showModal("detach");
    },
    resizeInit(disk) {
      // console.log(disk)
      this.resize.currentdisk = disk.DISK_ID;
      this.resize.currentdiskIndex = this.disks.indexOf(disk);
      this.resize.newsize = disk.SIZE / 1024;
      this.showModal("resize");
    },
    showModal(modalname) {
      this.modal[modalname] = true;
    },
    closeModal(modalname) {
      this.modal[modalname] = false;
    },
    sendResize() {
      let currentdisk = this.resize.currentdisk;
      let newDiskSizeInMB;
      if (this.resize.scale == "GB") {
        newDiskSizeInMB = this.resize.newsize * 1024;
      } else {
        newDiskSizeInMB = this.resize.newsize;
      }
      // console.log(newDiskSizeInMB)
      if (newDiskSizeInMB <= this.disks[currentdisk].SIZE) {
        this.$message.warning("You can't resize disk to the same size");
        return;
      }

      const user = this.user;
      const vmid = this.SingleCloud.ID;

      const close_your_eyes = md5("VMDiskResize" + user.id + user.secret);

      let query = {
        userid: user.id,
        vmid,
        secret: close_your_eyes,
        diskID: currentdisk,
        newsize: newDiskSizeInMB,
      };

      let url = `/VMDiskResize.php?${this.URLparameter(query)}`;

      this.resize.loading = true;
      this.$axios
        .get(url)
        .then((res) => {
          if (res.data.result == "success")
            this.$message.success(
              `VM disk #${currentdisk} resized successfully`
            );
          else {
            this.$message.error(`VM disk #${currentdisk} resize failed`);
            console.error(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.$store.dispatch(
            "cloud/silentUpdate",
            this.$route.params.pathMatch
          );
          this.closeModal("resize");
          this.resize.loading = false;
        });
    },
    getImageName(disk) {
      if (disk.IMAGE != undefined) {
        return disk.IMAGE;
      } else {
        return `${Math.round(disk.SIZE / 1024)}GB - ${disk.FORMAT}`;
      }
    },
    sendAttach() {
      if (this.attach.type == 1 && this.attach.imageID < 0) {
        this.$message.warning("Choose OS");
        return;
      }

      const user = this.user;
      const vmid = this.SingleCloud.ID;

      const close_your_eyes = md5("VMDiskAttach" + user.id + user.secret);
      const auth = {
        userid: user.id,
        vmid,
        secret: close_your_eyes,
      };
      const actionParams = {
        type: this.attach.type,
      };
      if (this.attach.type == 1) {
        actionParams["imageID"] = this.attach.imageID;
      }
      if (this.attach.type == 2) {
        actionParams["size"] = this.attach.size * 1024;
      }
      const query = Object.assign(auth, actionParams);
      const url = `/VMDiskAttach.php?${this.URLparameter(query)}`;

      // console.log(query);
      // return
      this.attach.loading = true;
      this.$axios
        .get(url)
        .then((res) => {
          // console.log(res);
          if (res.data.result == "success")
            this.$message.success(`Disk attached`);
          else {
            this.$message.error(`VM disk attach failed`);
            console.error(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.$store.dispatch(
            "cloud/silentUpdate",
            this.$route.params.pathMatch
          );
          this.closeModal("attach");
          this.attach.loading = false;
        });
    },
    sendDetach(disk) {
      // console.log(disk)
      if (this.detach.imageID == 0) {
        this.$message.warning("You can' remove main OS disk");
        return;
      }

      const user = this.user;
      const vmid = this.SingleCloud.ID;

      const close_your_eyes = md5("VMDiskDetach" + user.id + user.secret);
      const auth = {
        userid: user.id,
        vmid,
        secret: close_your_eyes,
      };
      const actionParams = {
        diskID: this.detach.diskID,
      };
      const query = Object.assign(auth, actionParams);
      const url = `/VMDiskDetach.php?${this.URLparameter(query)}`;

      this.detach.loading = true;
      this.$axios
        .get(url)
        .then((res) => {
          // console.log(res);
          if (res.data.result == "success")
            this.$message.success(`Disk detached`);
          else {
            this.$message.error(`VM disk detach failed`);
            console.error(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.$store.dispatch(
            "cloud/silentUpdate",
            this.$route.params.pathMatch
          );
          this.closeModal("detach");
          this.detach.loading = false;
        });
    },
  },
};
</script>

<style>
.modal_table_action_btn {
  font-size: 1.2rem;
  cursor: pointer;
}

.modal_table_action_btn i {
  transition: color 0.2s ease, transform 0.2s 0.1s ease;
}

.modal_table_action_btn:not(:last-child) {
  margin-right: 15px;
}

.modal_table_action_btn:hover i {
  color: #427cf7;
  transform: scale(1.25);
}
</style>
