<template>
  <div class="cloud__fullscreen Fcloud">
    <template>
      <transition name="opencloud" :duration="600">
        <div v-if="!vmsLoading" class="cloud__container">
          <div class="Fcloud">
            <div class="Fcloud__header">
              <div class="Fcloud__back-wrapper">
                <div class="Fcloud__back icon__wrapper" @click="$router.go(-1)">
                  <a-icon type="left" />
                </div>
              </div>

              <div v-if="VM && VM.status" class="Fcloud__header-title">
                <div
                  class="Fcloud__status-color"
                  :class="{ 'glowing-animations': updating }"
                  :style="{ 'background-color': stateColor }"
                ></div>
                <div class="Fcloud__title">
                  {{ VM.title }}
                </div>
                <div
                  class="Fcloud__status"
                  :class="{ 'glowing-animations': updating }"
                >
                  <!-- {{
                    VM.state.meta.state_str
                      ? VM.state.meta.state_str
                      : VM.state.meta.error
                  }} -->
                  {{ vmState | replace("_", " ") }}
                </div>
              </div>
              <div class="Fcloud__menu-wrapper">
                <div class="Fcloud__menu-btn icon__wrapper">
                  <a-icon type="more" @click="openModal('menu')" />
                  <a-modal v-model="modal.menu" title="Menu" :footer="null">
                    <a-button
                      v-for="btn in menuOptions.filter(
                        (el) => !el.forVNC || SingleCloud.GNAME == 'VDC'
                      )"
                      :key="btn.title"
                      :icon="btn.icon"
                      @click="btn.onclick(...btn.params)"
                      block
                      class="menu__button"
                      :type="btn.type || 'default'"
                      :disabled="disabledMenu(btn.title.toLowerCase())"
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
                      <p>
                        We can't do it automaticly. Presss OK to create a
                        ticket.
                      </p>
                      <p>All unsaved data will be lost.</p>
                    </template>
                  </a-modal>
                  <a-modal
                    :confirm-loading="loadingResizeVM"
                    v-model="modal.expand"
                    :title="$t('Resize VM')"
                    @ok="ExpandVM"
                    :ok-button-props="{
                      props: {
                        disabled:
                          SingleCloud.LCM_STATE != 0 || SingleCloud.STATE != 8,
                      },
                    }"
                  >
                    <div
                      v-if="
                        SingleCloud.LCM_STATE != 0 || SingleCloud.STATE != 8
                      "
                      :style="{
                        color: config.colors.err,
                        'text-align': 'center',
                      }"
                    >
                      {{ $t("turn of VM to resize it") | capitalize }}
                    </div>
                    <a-row :gutter="[10, 10]">
                      <a-col :xs="24" :sm="4"> CPU </a-col>
                      <a-col :xs="24" :sm="20">
                        <a-input type="number" :min="1" v-model="resize.VCPU" />
                      </a-col>
                    </a-row>
                    <a-row :gutter="[10, 10]">
                      <a-col :xs="24" :sm="4"> RAM (GB) </a-col>
                      <a-col :xs="24" :sm="20">
                        <a-input type="number" :min="1" v-model="resize.RAM" />
                      </a-col>
                    </a-row>
                  </a-modal>
                </div>
              </div>
            </div>
            <div class="Fcloud__buttons">
              <!-- <div v-if="SingleCloud.STATE == '3'" class="Fcloud__button" :class="{ 'disabled': permissions.shutdown }" @click='openModal("shutdown")'> -->
              <div class="Fcloud__button" @click="sendAction('poweroff')">
                <div class="Fcloud__BTN-icon">
                  <div class="cloud__icon cloud__icon--stop"></div>
                </div>
                <div class="Fcloud__BTN-title">
                  <!-- {{$t('Power off')}} -->
                  stop
                </div>
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
              <!-- <div v-else class="Fcloud__button" :class="{ 'disabled': permissions.start }" @click='sendAction("Start")'> -->
              <!-- <div v-else class="Fcloud__button" @click='sendAction("Start")'> -->
              <div class="Fcloud__button" @click="sendAction('resume')">
                <div class="Fcloud__BTN-icon">
                  <a-icon type="caret-right" />
                </div>
                <div class="Fcloud__BTN-title">
                  <!-- {{$t('Start')}} -->
                  start
                </div>
              </div>
              <!-- <div class="Fcloud__button" :class="{ 'disabled': permissions.reboot , 'btn_disabled_wiggle': true}" @click='openModal("reboot")'> -->
              <div
                class="Fcloud__button"
                :class="{ btn_disabled_wiggle: true }"
                @click="sendAction('reboot')"
              >
                <div class="Fcloud__BTN-icon">
                  <a-icon type="redo" />
                </div>
                <div class="Fcloud__BTN-title">
                  <!-- {{$t('Reboot')}} -->
                  reboot
                </div>
                <a-modal
                  v-model="modal.reboot"
                  :title="$t('cloud_Reboot_modal')"
                  @ok="sendAction('suspend')"
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
              <!-- <div class="Fcloud__button" :class="{ 'disabled': permissions.recover , 'btn_disabled_wiggle': true}" @click='openModal("recover")'> -->
              <div
                class="Fcloud__button"
                :class="{ btn_disabled_wiggle: true }"
                @click="openModal('recover')"
              >
                <div class="Fcloud__BTN-icon">
                  <a-icon type="backward" />
                </div>
                <div class="Fcloud__BTN-title">
                  <!-- {{$t('Recover')}} -->
                  recover
                </div>
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
                   <div class="Fcloud__info-block block">
                <div class="Fcloud__block-header">
                  <a-icon type="environment" theme="filled" />
                  {{ 'Location' }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__value" v-if="dataSP">
                      {{ dataSP.title }}
                    </div>
                  </div>
        
       
                </div>
              </div>

              <!-- <div v-if="SingleCloud.ORDER_INFO.invoicestatus && SingleCloud.ORDER_INFO.invoicestatus.toLowerCase() == 'unpaid'" class="Fcloud__main-info Fcloud__main-info--invoice">
							<div class="icon">
								<a-icon type="exclamation-circle" />
							</div>
							<div class="content">
								{{$t('advice.renewal bill') | capitalize}}.
							</div>
							<div class="link__wrapper">
								<router-link
									class="link"
									:to="{name: 'invoiceFS', params: {pathMatch: SingleCloud.ORDER_INFO.invoiceid}}"
								>
									{{$t('advice.open') | capitalize}}
								</router-link>
							</div>
						</div> -->

              <!-- <div v-if="IPs.length > 0" class="Fcloud__main-info">
							<table class="Fcloud__table">
								<tbody>
									<tr v-for="nic in IPs" :key="nic.NAME">
										<td>IP</td>
										<td>{{nic.IP}}</td>
									</tr>
								</tbody>
							</table>
						</div> -->

              <div class="Fcloud__info-block block">
                <div class="Fcloud__block-header">
                  <a-icon type="setting" theme="filled" />
                  {{ $t("cloud_system") | capitalize }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__title">OS</div>
                    <div class="block__value">
                      <!-- {{ (VM && VM.os) || "no data" }} -->
                       <!-- {{ dataSP.publicData.templates[5].name || "no data"}} -->
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">CPU</div>
                    <div class="block__value">
                      {{ VM && VM.resources.cpu }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">{{ $t("cloud_Memory") }}</div>
                    <div class="block__value">
                      {{ mbToGb(VM && VM.resources.ram) }} GB
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
                      {{ VM && VM.resources.drive_type }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">{{ $t("cloud_Size") }}</div>
                    <div class="block__value">
                      {{ mbToGb(VM && VM.resources.drive_size) }} GB
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="Fcloud__info-block block"
                v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
              >
                <div class="Fcloud__block-header">
                  <a-icon type="apartment" />
                  {{ $t("Network") }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__title">
                      {{ $t("inbound") | capitalize }}
                    </div>
                    <div class="block__value">
                      {{
                        printWidthRange(chart1Data[chart1Data.length - 1][1])
                      }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">
                      {{ $t("outgoing") | capitalize }}
                    </div>
                    <div class="block__value">
                      {{
                        printWidthRange(chart2Data[chart2Data.length - 1][1])
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- <div v-if="VM.status != 'up'" class="Fcloud__info-block block"> -->
              <!-- <div  class="Fcloud__info-block block">
							<div class="Fcloud__block-header">
								<a-icon type="database" theme="filled" />
								Deloy
							</div>
							<div class="Fcloud__block-content">
								<a-row> -->
              <!-- <a-col>
										<a-select v-model="selectedSP" style="width: 300px; margin-right: 10px">
											<a-select-option v-for="sp in servicesProviders.filter(el=> el.type == 'ione')" :key="sp.uuid" :value="sp.uuid">
												{{sp.title}}
											</a-select-option>
										</a-select>
										<a-button type="primary" :loading="deployLoading" @click="deployVM">
											deploy
										</a-button>
									</a-col> -->
              <!-- </a-row>
							</div>
						</div> -->

              <div
                class="Fcloud__info-block block"
                v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
              >
                <div class="Fcloud__block-header">
                  <a-icon type="line-chart" />
                  {{ $t("graphs") | capitalize }}
                </div>
                <div
                  class="Fcloud__block-content Fcloud__block-content--charts"
                >
                  <a-row type="flex" justify="space-around" style="width: 100%">
                    <a-col>
                      <GChart
                        type="LineChart"
                        :data="inbChartDataReady"
                        :options="chartOption('inbound')"
                      />
                    </a-col>
                    <a-col>
                      <GChart
                        type="LineChart"
                        :data="outChartDataReady"
                        :options="chartOption('outgoing')"
                      />
                    </a-col>
                  </a-row>
                </div>
              </div>

              <a-row :gutter="[15, 15]" style="margin-top: 20px">
                <a-col :span="24" :md="12">
                  <div class="button">
                    <a-button
                      type="primary"
                      shape="round"
                      block
                      size="large"
                      @click="openModal('snapshot')"
                    >
                      {{ $t("Snapshots") }}
                    </a-button>
                    <a-modal
                      v-model="snapshots.modal"
                      :title="$t('Snapshots')"
                      :footer="null"
                    >
                      <div
                        v-if="
                          (SingleCloud.LCM_STATE != 3 ||
                            SingleCloud.STATE != 3) &&
                          SingleCloud.LCM_STATE != 24
                        "
                        :style="{
                          color: config.colors.err,
                          'text-align': 'center',
                        }"
                      >
                        {{ $t("turn on VM to create or load snapshots") }}
                      </div>
                      <a-table
                        :columns="snapshots.columns"
                        :data-source="snapshots.data"
                        :pagination="false"
                        :loading="snapshots.loading"
                        rowKey="TIME"
                      >
                        <template slot="time" slot-scope="time">
                          {{ getFormatedDate(time) }}
                        </template>
                        <template slot="actions" slot-scope="actions">
                          <a-button
                            icon="caret-right"
                            type="primary"
                            shape="round"
                            :style="{ 'margin-right': '10px' }"
                            @click="revToShapshot(actions)"
                            :disabled="
                              actions.ACTION != undefined ||
                              SingleCloud.LCM_STATE != 3 ||
                              SingleCloud.STATE != 3
                            "
                            :loading="
                              snapshots.loadingSnaps.includes(
                                actions.SNAPSHOT_ID
                              )
                            "
                          ></a-button>
                          <a-button
                            icon="close"
                            type="danger"
                            shape="round"
                            @click="RMSnapshot(actions)"
                            :disabled="
                              actions.ACTION != undefined ||
                              SingleCloud.LCM_STATE != 3 ||
                              SingleCloud.STATE != 3
                            "
                            :loading="
                              snapshots.loadingSnaps.includes(
                                actions.SNAPSHOT_ID
                              )
                            "
                          ></a-button>
                        </template>
                      </a-table>
                      <div class="modal__buttons">
                        <a-button
                          icon="plus"
                          type="primary"
                          shape="round"
                          size="large"
                          :disabled="
                            snapshots.data.length > 2 ||
                            snapshots.loading ||
                            SingleCloud.LCM_STATE != 3 ||
                            SingleCloud.STATE != 3
                          "
                          @click="openModal('createSnapshot')"
                          >{{ $t("Take snapshot") }}</a-button
                        >
                      </div>
                      <a-modal
                        v-model="snapshots.addSnap.modal"
                        :footer="null"
                        title="Create snapshot"
                      >
                        <p>
                          {{ $t("You can only have 3 snapshots at a time.") }}
                        </p>
                        <p>
                          {{
                            $t(
                              "Each snapshot exists for 24 hours and is then deleted."
                            )
                          }}
                        </p>
                        <p>
                          {{ $t("Choose a name for the new snapshot:") }}
                        </p>
                        <a-input
                          ref="snapNameInput"
                          placeholder="Snapshot name"
                          v-model="snapshots.addSnap.snapname"
                        />
                        <div class="modal__buttons">
                          <a-button
                            shape="round"
                            :style="{ 'margin-right': '10px' }"
                            @click="closeModal('createSnapshot')"
                            >{{ $t("Cancel") }}</a-button
                          >
                          <a-button
                            icon="plus"
                            type="primary"
                            shape="round"
                            :disabled="snapshots.addSnap.snapname.length < 1"
                            :loading="snapshots.addSnap.loading"
                            @click="newsnap()"
                            >{{ $t("Take snapshot") }}</a-button
                          >
                        </div>
                      </a-modal>
                    </a-modal>
                  </div>
                </a-col>

                <a-col :span="24" :md="12">
                  <div class="button">
                    <a-button
                      :disabled="
                        SingleCloud.STATE != 3 || SingleCloud.LCM_STATE != 3
                      "
                      type="primary"
                      shape="round"
                      block
                      size="large"
                    >
                      <router-link
                        :to="{
                          path: `cloud-${$route.params.pathMatch}/vnc`,
                        }"
                      >
                        VNC
                      </router-link>
                    </a-button>
                  </div>
                </a-col>
              </a-row>
            </div>
          </div>
        </div>
        <loading v-else color="#fff" :style="{'position': 'absolute', 'height':
        '100%', 'width': '100%'}" key="loading" duration: />
      </transition>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import md5 from "md5";
import loading from "@/components/loading/loading.vue";
import config from "@/appconfig";
import api from "@/api";
import diskControl from "./openCloud/diskControl";
import bootOrder from "./openCloud/bootOrder";
import networkControl from "./openCloud/networkControl";
import accessManager from "./openCloud/accessManager";
import notification from "../../../mixins/notification";

const columns = [
  {
    title: "Name",
    key: "Name",
    dataIndex: "NAME",
  },
  {
    title: "Time",
    dataIndex: "TIME",
    key: "Time",
    scopedSlots: { customRender: "time" },
  },
  {
    title: "Actions",
    key: "Actions",
    scopedSlots: { customRender: "actions" },
  },
];

const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB"];

export default {
  name: "openCloud",
  components: {
    loading,
    diskControl,
    bootOrder,
    networkControl,
    accessManager,
  },
  mixins: [notification],
  data() {
    return {
      chart1Data: [["Time", ""]],
      chart2Data: [["Time", ""]],
      chartHead: ["Timestamp"],
      chartOptions: {
        title: "network",
        curveType: "function",
        legend: "none",
        width: 300,
        height: 150,
        vAxis: {
          viewWindowMode: "explicit",
          viewWindow: { min: 0 },
        },
      },
      config,
      status: "running",
      name: "test3",
      showPermissions: false,
      isRenameLoading: false,
      reinstallPass: "",
      renameNewName: "",
      loadingResizeVM: false,
      modal: {
        reboot: false,
        shutdown: false,
        recover: false,
        snapshot: false,
        menu: false,
        reinstall: false,
        delete: false,
        expand: false,
        diskControl: false,
        bootOrder: false,
        networkControl: false,
        accessManager: false,
        rename: false,
      },
      option: {
        reboot: 0,
        shutdown: 0,
        recover: 0,
      },
      bootOrder: {
        loading: false,
      },
      snapshots: {
        modal: false,
        loading: true,
        columns,
        data: [],
        loadingSnaps: [],
        addSnap: {
          modal: false,
          snapname: "Snapshot",
          loading: false,
        },
      },
      resize: {
        VCPU: 0,
        RAM: 0,
      },
      menuOptions: [
        {
          title: "Reinstall",
          onclick: this.sendReinstall,
          params: [],
          icon: "exclamation",
        },
        {
          title: "Rename",
          onclick: this.openModal,
          params: ["rename"],
          icon: "tag",
        },
        {
          title: "Access manager",
          onclick: this.openModal,
          params: ["accessManager"],
          icon: "safety",
        },
        {
          title: "Resize VM",
          onclick: this.changeModal,
          params: ["expand"],
          icon: "arrows-alt",
          forVNC: true,
        },
        {
          title: "Disk control",
          onclick: this.changeModal,
          params: ["diskControl"],
          icon: "container",
          forVNC: true,
        },
        {
          title: "Network control",
          onclick: this.changeModal,
          params: ["networkControl"],
          icon: "global",
          forVNC: true,
        },
        {
          title: "Boot order",
          onclick: this.changeModal,
          params: ["bootOrder"],
          icon: "ordered-list",
          forVNC: true,
        },
        {
          title: "Delete",
          onclick: this.sendDelete,
          icon: "delete",
          type: "danger",
          forVNC: true,
        },
      ],

      actualAction: "",
      actionLoading: false,

      selectedSP: "",
      deployLoading: false,
    };
  },
  computed: {
    ...mapGetters("cloud", {
      updating: "isUpdating",
      SingleCloud: "getOpenedCloud",
      vmState: "getCloudState",
      // isLoading: 'isLoading',
      permissions: "permissions",
      // singleLoading: 'singleLoading'
    }),
    // servicesProviders(){
    // 	return this.$store.getters['nocloud/sp/all']
    // },
    VM(){
    	const clouds = this.$store.getters['nocloud/vms/instances']
    	const vm = clouds.find(el => el.uuid == this.$route.params.uuid);
    	return vm;
    },
    VM() {
      const data = this.$store.getters["nocloud/vms/getInstances"];
      for (let item of data) {
        if (item.uuid === this.$route.params.uuid) {
          console.log(item)
          return item;
        }
      }
    },
    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    dataSP() {
      const data = this.getSP.find((el) => {
        return el.uuid == this.VM.sp
      });
      return data;
    },
    vmsLoading() {
      return this.$store.getters["nocloud/vms/isLoading"];
    },
    stateColor() {
      let color = "";
      switch (this?.VM?.status?.toLowerCase()) {
        case "running":
        case "up":
          color = "#0fd058";
          break;
        case "poweroff":
        case "down":
          color = "#919191";
          break;
        case "suspend":
        case "init":
          color = "#f9f038";
          break;
        default:
          color = "#f9f038";
          break;
      }
      return color;
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
  },
  created() {
    // this.sync(); //он вызывается ниже, в вотче изменения роута
    // if (this.isLogged) {
    //   this.$store.dispatch("nocloud/vms/fetchById", this.$route.params.uuid);
    // this.$store.dispatch('nocloud/sp/fetch')
    // 	.then(res => {
    // 		this.selectedSP = res.pool[0].uuid
    // 	})
    // }

    if (this.isLogged) {
      this.$store.dispatch("nocloud/vms/fetch");
      this.$store.dispatch("nocloud/sp/fetch");
    }
  },
  methods: {
    deployVM() {
      this.deployLoading = true;
      // this.$api.services
      //   .up(this.VM.meta.serviceUUID, this.VM.meta.groupUUID, this.selectedSP)
      //   .then(() => {
      //     this.$store.dispatch("nocloud/vms/fetch");
      //     this.$message.success("VM depoyed!");
      //   })
      //   .catch((res) => {
      //     let data = res.response.data;
      //     // console.log(data)
      //     this.$message.error(`Error#${data.code}: ${data.message}`);
      //   })
      //   .finally(() => {
      //     this.deployLoading = false;
      //   });
    },
    disabledMenu(menuName) {
      // if(this.SingleCloud.DISABLE.includes(menuName) || (this.SingleCloud.STATE == 3 && this.SingleCloud.LCM_STATE == 2)){
      // 	return true;
      // }

      return false;
    },
    sync(vmid = null) {
      if (vmid == null) {
        vmid = this.$route.params.pathMatch;
      }
      this.$store.dispatch("cloud/fetchSingleCloud", vmid).then((res) => {
        if (res.result == "error" && res.message == "Not your VM.") {
          this.$router.replace("/cloud");
        }
      }),
        this.$axios
          .get(`VMMonitorting.php?vmid=${vmid}`)
          .then((res) => {
            if (res.data.NETRX != undefined) {
              this.chart1Data = res.data.NETRX;
            }
            if (res.data.NETTX != undefined) {
              this.chart2Data = res.data.NETTX;
            }
          })
          .catch((err) => {
            console.error(err);
          });
    },
    checkRange(val) {
      let count = 0;
      for (let i = 0; val > 1024; count++) {
        val = val / 1024;
      }
      return sizes[count];
    },
    fromBytesTo(val, newRange) {
      let count = sizes.indexOf(newRange);
      if (count == -1) {
        console.log("can't get such range");
        return;
      }
      while (count > 0) {
        val = val / 1024;
        count--;
      }
      return val;
    },
    chartOption(title) {
      const newOpt = JSON.parse(JSON.stringify(this.chartOptions));
      let range = "";
      if (title.toLowerCase() == "inbound") {
        range = this.checkRange(this.chart1Data[this.chart1Data.length - 1][1]);
      } else if (title.toLowerCase() == "outgoing") {
        range = this.checkRange(this.chart2Data[this.chart2Data.length - 1][1]);
      }
      let localizeTitle = this.$t(title);
      let capitalized = localizeTitle[0].toUpperCase() + localizeTitle.slice(1);
      newOpt.title = `${capitalized} (${range})`;
      return newOpt;
    },
    // sendAction(action){
    // 	return true
    // 	switch (action.toLowerCase()){
    // 		case 'start':
    // 			if(this.SingleCloud.DISABLE.start) return;
    // 			if(this.permissions.start) return;
    // 			break;
    // 		case 'Poweroff':
    // 		case 'PoweroffHard':
    // 			if(this.SingleCloud.DISABLE.Poweroff) return;
    // 			if(this.permissions.shutdown) return;
    // 			break;
    // 		case 'reboot':
    // 			if(this.SingleCloud.DISABLE.reboot) return;
    // 			if(this.permissions.reboot) return;
    // 			break;
    // 		case 'recover':
    // 			if(this.SingleCloud.DISABLE.recover) return;
    // 			if(this.permissions.recover) return;
    // 			break;
    // 		case 'reinstall':
    // 			if(this.SingleCloud.DISABLE.reinstall) return;
    // 			if(this.permissions.reinstall) return;
    // 			break;
    // 	}

    // 	const user = this.$store.getters.getUser;
    // 	const userid = user.id;
    // 	const vmid = this.SingleCloud.ID;

    // 	let lowerAct = action.toLowerCase();

    // 	let close_your_eyes = md5('vmaction' + userid + user.secret);
    // 	let url = `/vmaction.php?userid=${userid}&action=${action}&vmid=${vmid}&secret=${close_your_eyes}`
    // 	if(lowerAct == 'reinstall'){
    // 		url = `/vm.recreate_new.php?userid=${userid}&action=${action}&vmid=${vmid}&secret=${close_your_eyes}&passwd=${this.reinstallPass}`
    // 	}
    // 	if(lowerAct == 'delete'){
    // 		close_your_eyes = md5('VMremove' + userid + user.secret);
    // 		url = `/VMremove.php?userid=${userid}&action=${action}&vmid=${vmid}&secret=${close_your_eyes}&passwd=${this.reinstallPass}`
    // 	}
    // 	if(lowerAct == 'recovertoday' || lowerAct == 'recoveryesterday'){
    // 		this.$message.warning(this.$t("Recover sended. Wait please"));
    // 	}
    // 	this.$axios.get(url)
    // 	.then(res => {
    // 		if(lowerAct == 'recovertoday' || lowerAct == 'recoveryesterday'){
    // 			let self = this;
    // 			// console.log('started wait for ans');
    // 			setTimeout(() => {
    // 				self.$store.dispatch('cloud/fetchAnsible', res.data.id)
    // 				.then( res => {
    // 					// console.log(res);
    // 					if(res.response.status == 'FAILED'){
    // 						// console.log(res.response.error.message_type);
    // 						// console.log(res.response.error);
    // 						switch (res.response.error.message_type) {
    // 							case 1:
    // 								self.$message.error(self.$t('There was a problem while recovering. Please contact support'));
    // 								break;

    // 							case 2:
    // 								self.$message.error(self.$t('Before restoring from a service copy, please delete manually created snapshots'));
    // 								break;

    // 							default:
    // 								self.$message.error(res.response.error.msg);
    // 								break;
    // 						}
    // 					}
    // 					this.$store.dispatch('cloud/silentUpdate', this.$route.params.pathMatch);
    // 				})
    // 				.catch( err => {
    // 					console.error(err);
    // 				})
    // 			}, 10000);
    // 		}

    // 		if(lowerAct == 'delete' || lowerAct=='reinstall'){
    // 			if(res.data.result == "success"){
    // 				this.$message.success(res.data.message);
    // 				this.$router.replace({name: "cloud"})
    // 			} else {
    // 				this.$message.error(res.data.message);
    // 				// console.log(res.data.errorMSG);
    // 			}
    // 		} else {
    // 			this.$store.dispatch('cloud/silentUpdate', this.$route.params.pathMatch);
    // 		}
    // 	})
    // 	.catch(err => {
    // 		console.error(err);
    // 	})
    // 	.finally(() => {
    // 		this.$store.dispatch('cloud/silentUpdate', this.$route.params.pathMatch);
    // 	})

    // },
    sendAction(action) {
      this.actualAction = action;
      this.actionLoading = true;
      api.instances
        .action(this.VM.uuid, action)
        .then(() => {
          const opts = {
            message: `Done!`,
          };
          this.showSnackbarSuccess(opts);
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.actualAction = "";
          this.actionLoading = false;
        });
    },
    mbToGb(mb) {
      const gb = Math.round(mb / 1024);
      return gb;
    },
    handleOk(from) {
      switch (from) {
        case "reboot":
          if (this.option.reboot) {
            this.sendAction("RebootHard");
          } else {
            this.sendAction("Reboot");
          }
          this.modal.reboot = false;
          break;

        case "shutdown":
          if (this.option.shutdown) {
            this.sendAction("PoweroffHard");
          } else {
            this.sendAction("Poweroff");
          }
          this.modal.shutdown = false;
          break;

        case "recover":
          const me = this;
          let trigger = this.modal;
          let opt = this.option;
          this.$confirm({
            title: me.$t("Do you want to download a backup?"),
            maskClosable: true,
            content: (h) => {
              let string = me.$t(
                "All unsaved progress will be lost, are you sure?"
              );
              return <div>{string}</div>;
            },
            okText: me.$t("Yes"),
            cancelText: me.$t("Cancel"),
            onOk() {
              if (me.option.recover) {
                me.sendAction("recoverToday");
              } else {
                me.sendAction("recoverYesterday");
              }
              me.modal.recover = false;
            },
            onCancel() {},
          });
          break;
      }
    },
    printWidthRange(value) {
      let range = this.checkRange(value);
      let newVal = this.fromBytesTo(value, range);
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000;
      }
      return `${newVal} ${range}`;
    },
    newsnap() {
      const self = this;
      if (this.snapshots.data.lenght >= 3) {
        this.$error({
          title: self.$t("You can't have more than 3 snaps at the same time"),
          content: self.$t("remove or commit old ones to create new"),
        });
      }

      const user = this.$store.getters.getUser;
      const userid = user.id;
      const vmid = this.SingleCloud.ID;
      const snapname = encodeURI(this.snapshots.addSnap.snapname);

      const close_your_eyes = md5("vmaction" + userid + user.secret);
      const url = `/vmaction.php?userid=${userid}&action=newSnapshot&snapname=${snapname}&vmid=${vmid}&secret=${close_your_eyes}`;
      this.snapshots.addSnap.loading = true;
      this.$axios.get(url).then((res) => {
        this.snapshots.addSnap.loading = false;
        this.snapshots.addSnap.modal = false;
        this.$store.dispatch(
          "cloud/silentUpdate",
          this.$route.params.pathMatch
        );
        this.snapshotsFetch();
      });
    },
    openModal(name) {
      // switch (name.toLowerCase()){
      // 	case 'start':
      // 		if(this.permissions.start) return;
      // 		break;
      // 	case 'shutdown':
      // 		if(this.permissions.shutdown) return;
      // 		break;
      // 	case 'reboot':
      // 		if(this.permissions.reboot) return;
      // 		break;
      // 	case 'delete':
      // 		if(this.permissions.delete) return;
      // 		break;
      // 	case 'recover':
      // 		if(this.permissions.recover) return;
      // 		break;
      // 	case 'snapshot':
      // 		if(this.permissions.snapshot) return;
      // 		this.snapshotsFetch();
      // 		this.snapshots.modal = true
      // 		break;
      // 	case 'createsnapshot':
      // 		if(this.permissions.createSnapshot) return;
      // 		this.snapshots.addSnap.modal = true;
      // 		const me = this;
      // 		setTimeout(() => {
      // 			const element = me.$refs.snapNameInput.$el;
      // 			element.select();
      // 		}, 0);
      // 		break;
      // }

      this.modal[name] = true;
    },
    changeModal(name) {
      for (let key in this.modal) {
        this.modal[key] = false;
      }
      this.modal[name] = true;
    },
    closeModal(name) {
      switch (name.toLowerCase()) {
        case "createsnapshot":
          this.snapshots.addSnap.modal = false;
          break;
        default:
          this.modal[name] = false;
      }
    },
    ExpandVM() {
      const keys = Object.keys(this.resize);
      const newVmSpecs = {};

      const specScale = {
        RAM: 1024,
        VCPU: 1,
      };

      keys.forEach((spec) => {
        const newSpec = +this.resize[spec] * specScale[spec];
        if (this.SingleCloud[spec] != newSpec) {
          newVmSpecs[spec] = newSpec;
        }
      });

      // console.log(newVmSpecs);
      if (Object.keys(newVmSpecs).length == 0) {
        this.$message.warning("Can't resize to same size");
        return;
      }
      const user = this.$store.getters.getUser;
      const userid = user.id;
      const vmid = this.SingleCloud.ID;

      const close_your_eyes = md5("VMresize" + userid + user.secret);

      let query = {
        userid,
        vmid,
        secret: close_your_eyes,
      };
      query = Object.assign(newVmSpecs, query);

      let url = `/VMresize.php?${this.URLparameter(query)}`;
      // console.log(url)
      this.loadingResizeVM = true;
      this.$axios
        .get(url)
        .then((result) => {
          if (result.data.result == "success") {
            this.$message.success("VM resized successfully");
          } else {
            this.$message.error("Some kind an error during resizing VM");
            // console.log(result.data);
          }
        })
        .catch((er) => {
          this.$message.error("Some kind an error during resizing VM");
          console.er(er);
          this.closeModal("expand");
        })
        .finally(() => {
          this.$store.dispatch(
            "cloud/silentUpdate",
            this.$route.params.pathMatch
          );
          this.closeModal("expand");
          this.loadingResizeVM = false;
        });
    },
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
    RMSnapshot(object) {
      const user = this.$store.getters.getUser;
      const userid = user.id;
      const vmid = this.SingleCloud.ID;
      const snapid = object.SNAPSHOT_ID;
      this.$store.dispatch("cloud/silentUpdate", this.$route.params.pathMatch);

      const close_your_eyes = md5("vmaction" + userid + user.secret);
      const url = `/vmaction.php?userid=${userid}&action=RMSnapshot&snapid=${snapid}&vmid=${vmid}&secret=${close_your_eyes}`;
      this.snapshots.data.find((el) => el.SNAPSHOT_ID == snapid).loading = true;
      this.snapshots.loadingSnaps.push(snapid);
      this.$axios.get(url).then((res) => {
        if (res.data.result == "success") {
          const index = this.snapshots.data.indexOf(object);
          this.snapshots.data.splice(index, 1);
          this.$message.success(this.$t("Snapshot successfully deleted"));
        }
        const ind = this.snapshots.loadingSnaps.indexOf(snapid);
        if (ind > -1) {
          this.snapshots.loadingSnaps.splice(ind, 1);
        }
        this.snapshotsFetch();
      });
    },
    revToShapshot(object) {
      const user = this.$store.getters.getUser;
      const userid = user.id;
      const vmid = this.SingleCloud.ID;
      const snapid = object.SNAPSHOT_ID;

      this.$store.dispatch("cloud/silentUpdate", this.$route.params.pathMatch);

      const close_your_eyes = md5("vmaction" + userid + user.secret);
      const url = `/vmaction.php?userid=${userid}&action=RevSnapshot&snapid=${snapid}&vmid=${vmid}&secret=${close_your_eyes}`;
      this.snapshots.data.find((el) => el.SNAPSHOT_ID == snapid).loading = true;
      this.snapshots.loadingSnaps.push(snapid);
      this.$axios.get(url).then((res) => {
        if (res.data.result == "success") {
          const index = this.snapshots.data.indexOf(object);
          this.snapshots.data.splice(index, 1);
          this.$message.success(
            this.$t("Vm was successfully restored from snapshot")
          );
        }
        const ind = this.snapshots.loadingSnaps.indexOf(snapid);
        if (ind > -1) {
          this.snapshots.loadingSnaps.splice(ind, 1);
        }
        this.snapshotsFetch();
      });
    },
    snapshotsFetch() {
      const user = this.$store.getters.getUser;
      const userid = user.id;
      const vmid = this.SingleCloud.ID;

      const close_your_eyes = md5("getSnapshots" + userid + user.secret);
      const url = `/getSnapshots.php?userid=${userid}&vmid=${vmid}&secret=${close_your_eyes}`;
      this.$axios.get(url).then((res) => {
        // console.log(res);
        if (
          res.data.response[0] != null &&
          res.data.response.some((element) => element.ACTION != undefined)
        ) {
          setTimeout(() => {
            this.snapshotsFetch();
          }, 10000);
        }
        this.snapshots.loadingSnaps.splice(
          0,
          this.snapshots.loadingSnaps.lenght
        );
        if (res.data.response[0] == null) {
          this.snapshots.data = [];
        } else {
          this.snapshots.data = res.data.response;
        }
        this.snapshots.loading = false;
      });
    },
    getFormatedDate(dstring) {
      const date = new Date(+(dstring + "000"));
      return date.toLocaleString();
    },
    sendRename() {
      this.isRenameLoading = true;
      api
        .sendVMaction("VMChangeName", { newVmName: this.renameNewName })
        .then((res) => {
          if (res.result == "success") {
            this.$store.dispatch(
              "cloud/silentUpdate",
              this.$route.params.pathMatch
            );
            this.closeModal("rename");
            this.closeModal("menu");
            this.renameNewName = "";
            this.$message.success(this.$t("vm name changes successfully"));
            this.isRenameLoading = false;
          } else {
            throw res;
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    sendReinstall() {
      if (this.disabledMenu("reinstall")) {
        this.$store
          .dispatch("utils/createTicket", {
            subject: `[generated]: Reinstall VM#${this.$route.params.pathMatch}`,
            message: `VM#${this.$route.params.pathMatch} имеет аддон, запрещающий автопереустановку. Необходимо выполнить перустановку вручную.`,
          })
          .then(() => {
            this.$message.success("Order created successuffly");
            this.closeModal("reinstall");
          })
          .catch(() => {
            this.$message.success("Some error during creation order");
          });
        return;
      }
      const me = this;
      this.$confirm({
        title: me.$t("Do you want to reinstall this virtual machine?"),
        okType: "danger",
        content: (h) => (
          <div style="color:red;">{me.$t("All data will be deleted!")}</div>
        ),
        onOk() {
          me.sendAction("Reinstall");
          me.modal.menu = false;
          me.modal.reinstall = false;
        },
        onCancel() {
          me.modal.reinstall = false;
        },
      });
    },
    sendDelete() {
      const me = this;
      this.$confirm({
        title: me.$t("Do you want to delete this virtual machine?"),
        okType: "danger",
        content: (h) => (
          <div style="color:red;">{me.$t("All data will be deleted!")}</div>
        ),
        onOk() {
          me.sendAction("Delete");
          me.modal.menu = false;
          me.modal.delete = false;
        },
        onCancel() {
          me.modal.delete = false;
        },
      });
    },
    bootOrderNewState() {
      this.closeModal("bootOrder");
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
  top: 50%;
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
  margin-top: 8px;
  font-size: 1rem;
  background-color: #fff;
  border-radius: 20px;
  padding: 10px 0;
}

.Fcloud__block-content--charts {
  flex-wrap: wrap;
}

.block__column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.block__title {
  color: #919392;
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
