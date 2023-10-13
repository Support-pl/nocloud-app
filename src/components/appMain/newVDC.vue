<template>
  <div class="newCloud_wrapper">
    <maintanance-mode v-if="isMaintananceMode"></maintanance-mode>
    <template v-else>
      <div class="newCloud">
        <div class="newCloud__inputs newCloud__field">
          <a-row
            v-if="false"
            type="flex"
            justify="center"
            :style="{ 'margin-bottom': '15px' }"
            :gutter="[10, 10]"
          >
            <a-col>
              {{ $t("Ready made servers") }}
            </a-col>
            <a-col>
              <a-switch v-model="custom" @click="closeAllTabs"></a-switch>
            </a-col>
            <a-col>
              {{ $t("Pay as you Go") }}
            </a-col>
          </a-row>

          <div class="newCloud_option">
            <a-collapse
              accordion
              :style="{ 'border-radius': '25px' }"
              @change="collapseChange"
              :activeKey="collapseKey"
            >
              <a-collapse-panel
                key="Template"
                :header="
                  $t('Choose a tariff') +
                  (options.rate.id == 0 ? ':' : ' (' + options.rate.name + '):')
                "
                v-if="!custom"
              >
                <div class="newCloud__option-field">
                  <div class="newCloud__template one-line">
                    <div
                      v-for="rate in ratesArray"
                      class="newCloud__template-item"
                      :class="{ active: options.rate.id == rate.pid }"
                      @click="setRate(rate.pid)"
                      :key="rate.pid"
                    >
                      <div
                        class="newCloud__template-image newCloud__template-image__rate"
                      >
                        {{ rate.name }}
                      </div>
                      <div class="newCloud__template-name">
                        <div class="newCloud__template-type">
                          {{ rate.name }}
                        </div>
                        <ul style="margin: 0; padding: 0; font-size: 0.75rem">
                          <template
                            v-for="element in rate.description.properties"
                          >
                            <li
                              v-if="!dontshowattarrifs.includes(element.GROUP)"
                              :key="element.GROUP"
                            >
                              {{ element.TITLE }}
                            </li>
                          </template>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </a-collapse-panel>
              <a-collapse-panel
                key="OS"
                :header="
                  $t('Choose OS') +
                  (options.os.name == '' ? ':' : ' (' + options.os.name + '):')
                "
              >
                <div class="newCloud__option-field">
                  <div class="newCloud__template">
                    <div
                      v-for="OS in templatesArray"
                      class="newCloud__template-item"
                      :class="{ active: options.os.id == OS.id }"
                      @click="setOS(OS.id)"
                      :key="OS.id"
                    >
                      <div class="newCloud__template-image">
                        <img
                          :src="OS.logo.replace('images/', 'img/')"
                          :alt="OS.name"
                        />
                      </div>
                      <div class="newCloud__template-name">
                        {{ OS.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </a-collapse-panel>
              <a-collapse-panel
                key="CPURAM"
                header="CPU + RAM:"
                :disabled="disableNotCustom"
                v-if="custom"
              >
                <div class="newCloud__option-field">
                  <a-row :gutter="[10, 10]">
                    <a-col :sm="12" :span="24">
                      <a-row>
                        <a-col :sm="8" :span="10"> RAM (GB): </a-col>
                        <a-col :sm="13" :span="14">
                          <a-row>
                            <a-col :span="24">
                              <a-row
                                type="flex"
                                justify="space-between"
                                align="middle"
                              >
                                <a-col :span="3">
                                  <a-icon
                                    type="minus"
                                    class="slider_btn"
                                    @click="changeValue('ramsize', -1)"
                                  ></a-icon>
                                </a-col>
                                <a-col :span="18">
                                  <a-input-number
                                    v-model="options.ram.size"
                                    class="max-width"
                                    :min="options.ram.min"
                                    :max="options.ram.max"
                                    default-value="1"
                                    :disabled="disableNotCustom"
                                  />
                                </a-col>
                                <a-col :span="3">
                                  <a-icon
                                    type="plus"
                                    class="slider_btn"
                                    @click="changeValue('ramsize', 1)"
                                  ></a-icon>
                                </a-col>
                              </a-row>
                            </a-col>
                          </a-row>
                        </a-col>
                      </a-row>
                    </a-col>

                    <a-col :sm="12" :span="24">
                      <a-row>
                        <a-col :sm="8" :span="10"> CPU: </a-col>
                        <a-col :sm="13" :span="14">
                          <a-row
                            type="flex"
                            justify="space-between"
                            align="middle"
                          >
                            <a-col :span="3">
                              <a-icon
                                type="minus"
                                class="slider_btn"
                                @click="changeValue('cpucount', -1)"
                              ></a-icon>
                            </a-col>
                            <a-col :span="18">
                              <a-input-number
                                v-model="options.cpu.count"
                                class="max-width"
                                :min="options.cpu.min"
                                :max="options.cpu.max"
                                default-value="1"
                                :disabled="disableNotCustom"
                              />
                            </a-col>
                            <a-col :span="3">
                              <a-icon
                                type="plus"
                                class="slider_btn"
                                @click="changeValue('cpucount', 1)"
                              ></a-icon>
                            </a-col>
                          </a-row>
                        </a-col>
                      </a-row>
                    </a-col>
                  </a-row>
                </div>
              </a-collapse-panel>
              <a-collapse-panel key="drive" :header="$t('Drives') + ':'">
                <div class="newCloud__option-field">
                  <a-row :gutter="[10, 10]">
                    <a-col :sm="12" :span="24">
                      <a-row>
                        <a-col :sm="8" :span="10"> {{ $t("Drive") }}: </a-col>
                        <a-col :sm="13" :span="14">
                          <a-row
                            type="flex"
                            justify="space-between"
                            align="middle"
                          >
                            <a-col :span="3">
                              <a-icon
                                type="minus"
                                class="slider_btn"
                                @click="changeValue('disksize', -10)"
                              ></a-icon>
                            </a-col>
                            <a-col :span="18">
                              <a-slider
                                v-model="options.disk.size"
                                :min="diskMinValue"
                                :max="diskMaxValue"
                                :tooltip-visible="showTooltip"
                                :step="10"
                              />
                            </a-col>
                            <a-col :span="3">
                              <a-icon
                                type="plus"
                                class="slider_btn"
                                @click="changeValue('disksize', 10)"
                              ></a-icon>
                            </a-col>
                          </a-row>
                        </a-col>
                      </a-row>
                    </a-col>

                    <a-col :sm="12" :span="24">
                      <a-row>
                        <a-col :sm="8" :span="10">
                          {{ $t("Drive type") }}:
                        </a-col>
                        <a-col :sm="13" :span="14">
                          <a-select
                            v-model="options.disk.type"
                            class="max-width"
                            :default-value="diskTypes[0]"
                            @change="diskChange()"
                          >
                            <a-select-option
                              v-for="type of diskTypes"
                              :key="type"
                              :value="type"
                            >
                              {{ type }}
                            </a-select-option>
                          </a-select>
                        </a-col>
                      </a-row>
                    </a-col>
                  </a-row>
                </div>
              </a-collapse-panel>

              <a-collapse-panel
                key="network"
                :header="$t('Network') + ':'"
                :style="{ 'border-radius': '0 0 25px 25px' }"
              >
                <div class="newCloud__option-field">
                  <a-row :gutter="[10, 10]">
                    <a-col :sm="12" :span="24">
                      <a-row>
                        <a-col :sm="10" :span="12">
                          {{ $t("Public network") }}:
                        </a-col>
                        <a-col :sm="12" :span="12">
                          <a-switch v-model="options.network.public.status" />
                          <a-input-number
                            v-model="options.network.public.count"
                            :min="1"
                            :max="10"
                            :disabled="!options.network.public.status"
                            :style="{ 'margin-left': '10px' }"
                          />
                        </a-col>
                      </a-row>
                    </a-col>

                    <a-col :sm="12" :span="24">
                      <a-row>
                        <a-col :sm="10" :span="12">
                          {{ $t("Local network") }}:
                        </a-col>
                        <a-col :sm="12" :span="12">
                          <a-switch v-model="options.network.local.status" />
                          <a-input-number
                            v-model="options.network.local.count"
                            :min="0"
                            :max="10"
                            :disabled="!options.network.local.status"
                            :style="{ 'margin-left': '10px' }"
                          />
                        </a-col>
                      </a-row>
                    </a-col>
                  </a-row>
                </div>
              </a-collapse-panel>
            </a-collapse>
          </div>
        </div>

        <div class="newCloud__calculate newCloud__field">
          <a-row type="flex" justify="space-between">
            <a-col> CPU: {{ options.cpu.count }} </a-col>
            <a-col>
              <a-skeleton
                class="removeMarginSkeleton"
                :loading="!pricesLoaded"
                active
                paragraph
                rows="1"
                width="0.000USD"
              >
                {{
                  (
                    calculatePrice(options.cpu.price) * options.cpu.count
                  ).toFixed(3)
                }}
                {{ currencyPostfix }}
              </a-skeleton>
            </a-col>
          </a-row>

          <a-row type="flex" justify="space-between">
            <a-col> RAM: {{ options.ram.size }} {{ options.ram.units }} </a-col>
            <a-col>
              <a-skeleton
                class="removeMarginSkeleton"
                :loading="!pricesLoaded"
                active
                paragraph
                rows="1"
                width="0.000USD"
              >
                {{
                  (
                    calculatePrice(options.ram.price) * options.ram.size
                  ).toFixed(3)
                }}
                {{ currencyPostfix }}
              </a-skeleton>
            </a-col>
          </a-row>

          <a-row type="flex" justify="space-between">
            <a-col>
              {{ $t("Drive") }} {{ options.disk.type }}:
              {{ options.disk.size }} {{ options.disk.units }}
            </a-col>
            <a-col>
              <a-skeleton
                class="removeMarginSkeleton"
                :loading="!pricesLoaded"
                active
                paragraph
                rows="1"
                width="0.000USD"
              >
                {{
                  (
                    calculatePrice(options.disk.price[options.disk.type]) *
                    options.disk.size
                  ).toFixed(3)
                }}
                {{ currencyPostfix }}
              </a-skeleton>
            </a-col>
          </a-row>

          <transition name="networkApear">
            <a-row
              v-if="options.network.public.status"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem' }"
            >
              <a-col> {{ $t("public") }} IPv4: </a-col>
              <a-col>
                <a-skeleton
                  class="removeMarginSkeleton"
                  :loading="!pricesLoaded"
                  active
                  paragraph
                  rows="1"
                >
                  {{ options.network.public.count * options.network.price }}
                  {{ currencyPostfix }}/{{ $t("period.month") }}
                </a-skeleton>
              </a-col>
            </a-row>
          </transition>

          <a-divider orientation="left" :style="{ 'margin-bottom': '0' }">
            {{ $t("Total") }}:
          </a-divider>

          <a-row
            type="flex"
            justify="space-around"
            :style="{ 'font-size': '1.5rem' }"
          >
            <a-col>
              <a-tooltip
                :get-popup-container="getPopupContainer"
                style="cursor: help"
              >
                <template slot="title">
                  {{ $t("Actual price may vary") }}
                </template>
                <a-skeleton
                  class="total removeMarginSkeleton"
                  :loading="!pricesLoaded"
                  active
                  paragraph
                  rows="1"
                  width="0.00USD"
                >
                  ~{{ calculateFullPrice("hour") }} {{ currencyPostfix }}/{{
                    $t("hour")
                  }}
                </a-skeleton>
              </a-tooltip>
            </a-col>
          </a-row>
          <a-row
            type="flex"
            justify="space-around"
            :style="{ 'font-size': '1.5rem' }"
          >
            <a-col>
              <a-tooltip
                :get-popup-container="getPopupContainer"
                style="cursor: help"
              >
                <template slot="title">
                  {{ $t("Actual price may vary") }}
                </template>
                <a-skeleton
                  class="total removeMarginSkeleton"
                  :loading="!pricesLoaded"
                  active
                  paragraph
                  rows="1"
                  width="0.00USD"
                >
                  ~{{ calculateFullPrice("day") }} {{ currencyPostfix }}/{{
                    $t("day")
                  }}
                </a-skeleton>
              </a-tooltip>
            </a-col>
          </a-row>
          <a-row
            type="flex"
            justify="space-around"
            :style="{ 'font-size': '1.5rem' }"
          >
            <a-col>
              <a-tooltip
                :get-popup-container="getPopupContainer"
                style="cursor: help"
              >
                <template slot="title">
                  {{ $t("Actual price may vary") }}
                </template>
                <a-skeleton
                  class="total removeMarginSkeleton"
                  :loading="!pricesLoaded"
                  active
                  paragraph
                  rows="1"
                  width="0.00USD"
                >
                  ~{{ calculateFullPrice("month") }} {{ currencyPostfix }}/{{
                    $tc("period.month")
                  }}
                  
                </a-skeleton>
              </a-tooltip>
            </a-col>
          </a-row>

          <a-divider orientation="left" :style="{ 'margin-bottom': '0' }">
            {{ $t("Tarification") }}:
          </a-divider>

          <a-row
            type="flex"
            justify="space-around"
            :style="{ 'font-size': '.95rem', 'margin-bottom': '10px' }"
          >
            <a-col>
              <div style="text-align: center">
                {{ $t(`When paying per month - save up to`) }}
                {{ monthDiscount }}%
              </div>
            </a-col>
          </a-row>

          <a-row type="flex" justify="space-around">
            <a-col>
              {{ $t("Monthly payment") }}
            </a-col>
            <a-col>
              <a-switch
                v-model="options.tarification"
                :disabled="options.rate.id != 0"
              ></a-switch>
            </a-col>
          </a-row>

          <a-row
            type="flex"
            justify="space-around"
            style="margin-top: 24px; margin-bottom: 10px"
          >
            <a-col :span="22">
              <a-button type="primary" block shape="round" @click="createVDC">
                {{ $t("Create") }}
              </a-button>
              <a-modal
                :title="$t('Confirm')"
                :visible="modal.confirmCreate"
                :confirm-loading="modal.confirmLoading"
                :cancel-text="$t('Cancel')"
                @ok="handleOk"
                @cancel="handleCancel"
              >
                <p v-if="options.tarification">
                  {{ $t("With discount") }} {{ monthDiscount }}%
                  {{ $t("you will pay:") }} {{ costAfterDiscount
                  }}{{ currencyPostfix }}
                </p>

                <p>
                  {{ $t("Enter VM name") }}:
                  <a-input v-model="options.vmname" />
                </p>
                <p>
                  {{ $t("Enter OS password") }}:
                  <a-input-password v-model="options.password" />
                </p>
                <p>
                  {{ $t("Enter OS password again") }}:
                  <a-input-password v-model="options.password2" />
                </p>
              </a-modal>
            </a-col>
          </a-row>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "newVDC",
  data() {
    return {
      monthDiscount: 15,
      settings: {},
      diskTypes: [],
      savedRateId: 0,
      custom: true,
      showTooltip: false,
      dontshowattarrifs: ["hdd", "traffic", "address"],
      collapseKey: "",
      period: "hour",
      pricesLoaded: false,
      toShow: {
        minute: "min",
        hour: "hour",
        day: "day",
        week: "week",
        month: "month",
      },
      modal: {
        confirmCreate: false,
        confirmLoading: false,
      },
      DISK_MIN_SIZE: {},
      DISK_MAX_SIZE: {},
      options: {
        tarification: false,
        vmname: "",
        password: "",
        password2: "",
        rate: {
          id: 0,
          name: "Custom",
        },
        os: {
          id: -1,
          name: "",
        },
        cpu: {
          count: 1,
          price: 0,
          min: 1,
          max: 32,
        },
        ram: {
          size: 1,
          units: "GB",
          price: 0,
          min: 1,
          max: 512,
        },
        disk: {
          size: 0,
          units: "GB",
          type: "",
          price: {
            HDD: 0,
            SSD: 0,
          },
          min: {
            HDD: 0,
            SSD: 0,
          },
          max: {
            HDD: 0,
            SSD: 0,
          },
          backupPrice: 0,
        },
        network: {
          public: {
            status: true,
            count: 1,
          },
          local: {
            status: false,
            count: 0,
          },
          price: 0,
        },
      },
    };
  },
  mounted() {
    this.$store.dispatch("newVDC/fetchTemplates");
    this.$store.dispatch("newVDC/fetchRates");

    const user = this.user;
    if (user) {
      // let userinfo = {
      //   userid: user.id,
      //   secret: md5("createVDC" + user.id + user.secret),
      // };
      // this.$axios.get("createVDC.php?" + this.URLparameter(userinfo) );
    }
    this.$axios
      .get("getSettings.php?filter=cost,disktypes,minDisk,maxDisk")
      .then((res) => {
        this.settings = res.data;
        const multiplier = 60 * 60 * 24 * 30;
        const CAPACITY_COST = res.data.CAPACITY_COST;
        this.options.cpu.price = CAPACITY_COST.CPU_COST * multiplier;
        this.options.ram.price = CAPACITY_COST.MEMORY_COST * multiplier;

        const DISK_COSTS = res.data.DISK_COSTS;
        Object.keys(DISK_COSTS).forEach((disktype) => {
          this.options.disk.price[disktype] = DISK_COSTS[disktype] * multiplier;
        });
        this.options.network.price = res.data.PUBLIC_IP_COST;
        this.diskTypes = res.data.DISK_TYPES.split(",");
        this.options.disk.type = this.diskTypes[0];
        this.pricesLoaded = true;
      })
      .catch((err) => {
        console.error(err);
        this.$message.error("Can't load prices. Show saved ones.");
      });

    // userinfo = {
    // 	userid: user.id,
    // 	secret: md5('getBalance' + user.id + user.secret)
    // }
    // this.$axios.get("getBalance.php?" + this.URLparameter(userinfo))
    // 	.then( res => {
    // 		if(user.id == res.data.userid){
    // 			this.$store.dispatch("updateBalance", res.data.balance);
    // 		}
    // 	})
    // 	.catch( err => console.error(err));
  },
  methods: {
    setOS(id) {
      this.options.os.id = id;
      this.options.os.name = this.templatesArray.find(
        (el) => el.id == id
      ).description;
      if (this.options.rate.id == 0) {
        this.collapseKey = "CPURAM";
      } else {
        this.collapseKey = "drive";
      }
    },
    setRate(id) {
      this.options.rate.id = id;
      this.savedRateId = id;
      if (id != 0) {
        const rate = this.ratesArray.find((el) => el.pid == id);
        this.options.rate.name = rate.name;
        let props = rate.description.properties;
        props.forEach((el) => {
          let val = el.VALUE.match(/\d+/);
          if (el.GROUP == "hdd") {
            this.options.disk.type = el.GROUP.toUpperCase();
            this.options.disk.size = parseInt(val[0], 10);
          }
          if (el.GROUP == "ssd") {
            this.options.disk.type = el.GROUP.toUpperCase();
            this.options.disk.size = parseInt(val[0], 10);
          }
          if (el.GROUP == "cpu_core") {
            this.options.cpu.count = parseInt(val[0], 10);
          }
          if (el.GROUP == "ram") {
            this.options.ram.size = parseInt(val[0], 10);
          }
        });
      } else this.options.rate.name = "Custom";
      this.collapseKey = "OS";
    },
    changePeriod(value) {
      this.period = value;
    },
    calculatePrice(price, period = this.period) {
      // if(this.options.tarification){
      // 	return price;
      // }
      switch (period) {
        case "minute":
          price = price / 60;
        case "hour":
          price = price / 24;
        case "day":
          price = price / 30;
        case "month":
          break;
        case "week":
          price = (price / 30) * 7;
          break;
        default:
          console.error("[VDC Calculator]: Wrong period in calc.", period);
          return undefined;
      }
      return price;
    },
    calculateFullPrice(tarification = this.period) {
      if (this.options.rate.id != 0) {
        this.options.tarification = true;
        return this.ratesArray.find((el) => el.pid == this.options.rate.id)
          .pricingmonth[this.currencyPostfix];
      } //выключил
      let parts = [
        this.options.cpu.price * this.options.cpu.count,
        this.options.ram.price * this.options.ram.size,
        this.options.disk.price[this.options.disk.type] *
          this.options.disk.size,
        // this.options.network.price * this.options.network.public.count
      ];
      return this.calculatePrice(
        parts.reduce((a, b) => a + b),
        tarification
      ).toFixed(2);
    },
    createVDC() {
      const user = this.user;

      let parts = [
        this.options.cpu.price * this.options.cpu.count,
        this.options.ram.price * this.options.ram.size,
        this.options.disk.price[this.options.disk.type] *
          this.options.disk.size,
      ];
      let price = this.calculatePrice(
        parts.reduce((a, b) => a + b),
        "day"
      ).toFixed(3);
      if (user && +price > +user.balance) {
        this.$message.error("You don't have enough money for a day of use");
        return;
      }
      if (!~this.options.os.id) {
        this.$message.error(this.$t("select OS"));
        this.collapseKey = "OS";
        return;
      }
      if (!this.custom && this.options.rate.id == 0) {
        this.$message.error(this.$t("select tariff"));
      } else {
        this.modal.confirmCreate = true;
      }
    },
    diskChange() {
      if (
        [this.options.disk.min.SSD, this.options.disk.min.HDD].includes(
          this.options.disk.size
        )
      ) {
        this.options.disk.size = this.options.disk.min[this.options.disk.type];
      }
    },
    handleOk() {
      if (this.options.password.length < 6) {
        this.$message.error(this.$t("Password is too short"));
        return 0;
      }
      if (this.options.password != this.options.password2) {
        this.$message.error(this.$t("Password mismatch"));
        return 0;
      }
      this.modal.confirmLoading = true;
      this.send()
        .then((response) => {
          if (response.result == "error") {
            this.$message.error(response.message);
          } else {
            this.$message.success(
              this.$t("VDC created successfully with") + " id = " + response.id
            );
            this.$store.dispatch("app/setTabByName", "cloud");
          }
          this.options.password = "";
          this.modal.confirmCreate = false;
          this.modal.confirmLoading = false;
        })
        .catch((err) => {
          console.error(err);
          this.$message.error(this.$t("Unknown error."));
        });
    },
    handleCancel() {
      this.modal.confirmCreate = false;
    },
    getPopupContainer(trigger) {
      const elem = trigger.parentElement.parentElement.parentElement;
      return elem;
    },
    send() {
      const user = this.user;
      let savedPeriod = this.period;
      this.period = "month";
      const price = this.calculateFullPrice();
      this.period = savedPeriod;
      const vmOptions = {
        publicIPs: this.options.network.public.status
          ? this.options.network.public.count
          : 0,
        cpu: this.options.cpu.count,
        drivesize: this.options.disk.size,
        drive: this.options.disk.type,
        driveunits: this.options.disk.units,
        memory: this.options.ram.size,
        memoryunits: this.options.ram.units,
        templateid: this.options.os.id,
        vmname: this.options.vmname,
        password: this.options.password,
        calculatedPrice: price,
      };
      if (this.options.network.local.status) {
        vmOptions["localIPs"] = this.options.network.local.count;
      }
      // return this.$axios.get("createVM.php?" + this.URLparameter(vmOptions) + "&" + this.URLparameter(userinfo) );
      if (user) {
        return this.$api.sendAsUser("createVM", vmOptions);
      } else {
        this.$store.commit("setOnloginRedirect", "newVDC");

        this.$store.commit("setOnloginInfo", {
          type: "IaaS",
          title: "Cloud Virtual machine",
          cost: this.calculateFullPrice("month"),
        });

        this.$store.dispatch("setOnloginAction", () => {
          this.$api.sendAsUser("createVM", vmOptions);
        });

        this.$router.push({ name: "login" });
      }
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
    collapseChange(key) {
      this.collapseKey = key;
    },
    changeValue(variable, val) {
      if (
        variable == "disksize" &&
        this.options.disk.size + val <= this.diskMaxValue &&
        this.options.disk.size + val >= this.diskMinValue
      ) {
        this.options.disk.size += val;
      }
      if (
        variable == "ramsize" &&
        this.options.ram.size + val <= this.options.ram.max &&
        this.options.ram.size + val >= this.options.ram.min
      ) {
        this.options.ram.size += val;
      }
      if (
        variable == "cpucount" &&
        this.options.cpu.count + val <= this.options.cpu.max &&
        this.options.cpu.count + val >= this.options.cpu.min
      ) {
        this.options.cpu.count += val;
      }
    },
    closeAllTabs(val) {
      if (val) {
        this.options.rate.id = 0;
      } else {
        this.options.rate.id = this.savedRateId;
      }
      this.collapseKey = "";
    },
  },
  computed: {
    isMaintananceMode() {
      return this.$store.getters["app/isMaintananceMode"]
    },
    costAfterDiscount() {
      return (
        this.calculateFullPrice("month") *
        (1 - this.monthDiscount / 100)
      ).toFixed(2);
    },
    templatesArray() {
      const elements = this.$store.getters["newVDC/getTemplates"];
      return elements;
    },
    ratesArray() {
      const elements = this.$store.getters["newVDC/getRates"];
      return elements;
    },
    periodToShow() {
      if (this.options.tarification) {
        return "month";
      } else {
        return this.period;
      }
    },
    disableNotCustom() {
      return this.options.rate.id != 0;
    },
    user() {
      const user = this.$store.getters.getUser;
      return user;
    },
    currencyPostfix() {
      return this.$config.currency.suffix;
    },
    isWindowsSelected() {
      return this.options.os.name.search(/windows/i) != -1;
    },
    selectedTemplate() {
      return this.templatesArray.find(
        (template) => template.id == this.options.os.id
      );
    },
    diskMinValue() {
      if (
        this.selectedTemplate?.DISK_MIN_SIZE?.[this.options.disk.type] !=
        undefined
      ) {
        return this.selectedTemplate.DISK_MIN_SIZE;
      }

      if (this.settings?.DISK_MIN_SIZE?.[this.options.disk.type] != undefined) {
        // console.log(this.settings.DISK_MIN_SIZE[this.options.disk.type]);
        return this.settings.DISK_MIN_SIZE[this.options.disk.type];
      }

      return 50;
    },
    diskMaxValue() {
      if (
        this.selectedTemplate?.DISK_MAX_SIZE?.[this.options.disk.type] !=
        undefined
      ) {
        return this.selectedTemplate.DISK_MAX_SIZE[this.options.disk.type];
      }

      if (this.settings?.DISK_MAX_SIZE?.[this.options.disk.type] != undefined) {
        return this.settings.DISK_MAX_SIZE[this.options.disk.type];
      }

      return 300;
    },
  },
  watch: {
    collapseKey: function (val) {
      if (val == "drive") {
        setTimeout(() => {
          this.showTooltip = true;
        }, 250);
      } else {
        this.showTooltip = false;
      }
    },
    diskMinValue: {
      handler: function (val) {
        // console.log(val)
        if (this.options.disk.size < val) {
          this.options.disk.size = val;
        }
      },
      immediate: true,
    },
  },
};
</script>

<style>
.newCloud_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}
.newCloud {
  position: absolute;
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1024px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.newCloud__inputs {
  margin-right: 20px;
  width: 72%;
}

.newCloud__field {
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  padding: 10px 5px 5px;
  background-color: #fff;
  height: max-content;
}

.newCloud__calculate {
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
}

.newCloud__field-header {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.newCloud__template {
  display: flex;
  flex-wrap: wrap;
justify-content: space-between;
}

.newCloud__template.one-line {
  flex-wrap: nowrap;
  justify-content: space-between;
}

.newCloud__template-item {
  width: 116px;
  margin-bottom: 10px;
  background-color: #fff;
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  text-align: center;
  overflow: hidden;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: max-content auto;
}

.newCloud__template-item:not(:last-child) {
  margin-right: 10px;
}

.newCloud__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}

.newCloud__template-item.active {
  box-shadow: 5px 8px 12px rgba(0, 0, 0, 0.08), 0px 0px 13px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
}

.newCloud__template-image {
  padding: 10px;
}

.newCloud__template-image__rate {
  font-size: 2rem;
}

.newCloud__template-name {
  padding: 10px;
}

.newCloud__template-item.active .newCloud__template-name {
  background-color: var(--main);
  color: var(--bright_font);
}

.max-width {
  width: 100%;
}

.ant-collapse-item:last-of-type .ant-collapse-content {
  border-radius: 0 0 28px 28px;
}

.slider_btn {
  cursor: pointer;
}

.removeMarginSkeleton .ant-skeleton-title {
  margin: 0;
  margin-top: 4px;
}

.removeMarginSkeleton {
  min-width: 75px;
}

.total.removeMarginSkeleton {
  width: 100%;
}

@media screen and (max-width: 1024px) {
  .newCloud {
    flex-direction: column;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .newCloud__inputs {
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
  }
  .newCloud__field {
    box-shadow: none;
    flex-grow: 0;
  }
  .newCloud__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
  }
}

@media screen and (max-width: 576px) {
  .newCloud__template {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
  .newCloud__template-item {
    grid-template-columns: max-content auto;
    grid-template-rows: 1fr;
    width: auto;
    height: 50px;
  }
  .newCloud__template-item:not(:last-child) {
    margin-right: 0px;
  }
  .newCloud__template-image {
    width: 50px;
    height: 50px;
    padding: 4px;
  }
  .newCloud__template-image__rate {
    line-height: 42px;
    font-size: 1.4rem;
  }
  .newCloud__template-image img {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  .newCloud__template-name {
    text-align: left;
    line-height: 30px;
    display: flex;
  }
  .newCloud__template-type {
    width: 56px;
  }
  .newCloud__template-name ul {
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1;
  }
  .newCloud__template-name ul li {
    margin-left: 20px;
  }
}

.networkApear-enter-active,
.networkApear-leave-active {
  transition: opacity 0.5s, height 0.5s;
  height: 28px;
}
.networkApear-enter,
.networkApear-leave-to {
  opacity: 0;
  height: 0;
}
</style>
