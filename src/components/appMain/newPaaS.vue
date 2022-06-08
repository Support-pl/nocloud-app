<template>
  <div class="newCloud_wrapper">
    <maintanance-mode v-if="isMaintananceMode"></maintanance-mode>
    <template v-else>
      <template v-if="true">
        <div class="newCloud" v-if="!isProductsLoading">
          <div class="newCloud__inputs field">
            <a-collapse
              v-model="activeKey"
              accordion
              :style="{ 'border-radius': '20px' }"
            >
            <a-collapse-panel key="location" header="Location:">
              <span>dfhgfd</span>
            </a-collapse-panel>
            <!-- :disabled="true" -->
              <a-collapse-panel key="tarif" header="Tarif:" >
                <a-slider
                  :marks="{ ...getProductsData }"
                  :tip-formatter="null"
                  :max="getProductsData.length - 1"
                  :min="0"
                  :value="getProductsData.indexOf(options.size)"
                  @change="(newval) => (options.size = getProductsData[newval])"
                >
                </a-slider>

                <a-skeleton :loading="getCurrentProd == null" :active="true">
                  <a-row justify="space-between" style="margin-top: 50px">
                    <a-col span="8" :xs="6">
                      <span style="display: inline-block; width: 70px"
                        >CPU:</span
                      >
                    </a-col>
                    <a-col span="4" :xs="6">
                      <a-switch
                        :checked="options.kind == 'X2CPU'"
                        @change="
                          (val) => {
                            options.kind = val ? 'X2CPU' : 'standart';
                          }
                        "
                        style="width: 60px"
                      >
                        <span slot="checkedChildren">x2</span>
                        <span slot="unCheckedChildren">x1</span>
                      </a-switch>
                    </a-col>
                    <a-col span="8">
                      <a-tooltip>
                        <template slot="title">
                          {{
                            $t(
                              "increases core frequency from 2.4 GHz to 3.7 GHz"
                            )
                          }}
                        </template>
                        <a-checkbox
                          v-model="options.highCPU"
                          class="newCloud__prop"
                          >{{ $t("High speed") }}</a-checkbox
                        >
                      </a-tooltip>
                    </a-col>
                    <transition name="textchange" mode="out-in">
                      <a-col
                        class="changing__field"
                        span="4"
                        style="text-align: right"
                        :key="
                          getCurrentProd != null
                            ? getCurrentProd.props.cpu_core.TITLE
                            : 'DefaultKey'
                        "
                      >
                        {{
                          getCurrentProd != null
                            ? getCurrentProd.props.cpu_core.TITLE
                            : ""
                        }}
                      </a-col>
                    </transition>
                  </a-row>

                  <a-row justify="space-between" class="newCloud__prop">
                    <a-col span="8" :xs="6">
                      <span style="display: inline-block; width: 70px"
                        >RAM:</span
                      >
                    </a-col>
                    <a-col span="12">
                      <a-switch
                        :checked="options.kind == 'X2RAM'"
                        @change="
                          (val) => {
                            options.kind = val ? 'X2RAM' : 'standart';
                          }
                        "
                        style="width: 60px"
                      >
                        <span slot="checkedChildren">x2</span>
                        <span slot="unCheckedChildren">x1</span>
                      </a-switch>
                    </a-col>
                    <transition name="textchange" mode="out-in">
                      <a-col
                        class="changing__field"
                        span="6"
                        style="text-align: right"
                        :key="
                          getCurrentProd != null
                            ? getCurrentProd.props.ram.TITLE
                            : 'DefaultKeyForRAM'
                        "
                      >
                        {{
                          getCurrentProd != null
                            ? getCurrentProd.props.ram.TITLE
                            : ""
                        }}
                      </a-col>
                    </transition>
                  </a-row>

                  <a-row class="newCloud__prop">
                    <a-col span="8" :xs="6">
                      <span style="display: inline-block; width: 70px"
                        >{{ $t("Drive") }}:</span
                      >
                    </a-col>
                    <a-col :xs="10" :sm="14">
                      <a-switch v-model="options.drive" style="width: 60px">
                        <span slot="checkedChildren">SSD</span>
                        <span slot="unCheckedChildren">HDD</span>
                      </a-switch>
                    </a-col>
                    <a-col :xs="8" :sm="4">
                      <a-select
                        default-value="-1"
                        style="width: 100%"
                        @change="(newdata) => setAddon('drive', +newdata)"
                      >
                        <a-select-option value="-1">{{
                          getCurrentProd.props.drive.VALUE
                        }}</a-select-option>
                        <a-select-option
                          v-for="group in getAddons[
                            options.drive ? 'ssd' : 'hdd'
                          ]"
                          :key="group.id"
                          :value="group.id"
                        >
                          {{
                            parseInt(getCurrentProd.props.drive.VALUE) +
                              parseInt(group.description.VALUE)
                          }}
                          Gb
                        </a-select-option>
                      </a-select>
                    </a-col>
                  </a-row>
                  <a-row class="newCloud__prop">
                    <a-col span="8" :xs="6"
                      >{{ $t("traffic") | capitalize }}:</a-col
                    >
                    <a-col span="16" :xs="18">
                      <a-select
                        default-value="-1"
                        style="width: 100%"
                        @change="(newdata) => setAddon('traffic', +newdata)"
                      >
                        <a-select-option value="-1">{{
                          $t("under 3 Gb per month") | capitalize
                        }}</a-select-option>
                        <a-select-option
                          v-for="group in getAddons.traffic"
                          :key="group.id"
                        >
                          {{
                            $t(
                              `newPaaSTrafficItem.${group.description.TITLE.replace(
                                "Безлимитный, скорость канала не менее",
                                "Безлимит, от "
                              )}`
                            )
                          }}
                        </a-select-option>
                      </a-select>
                    </a-col>
                  </a-row>
                </a-skeleton>
              </a-collapse-panel>

              <!-- OS -->
              <a-collapse-panel
                key="OS"
                :header="
                  $t('OS') +
                    (options.os.name == ''
                      ? ':'
                      : ' (' + options.os.name + '):')
                "
              >
                <div class="newCloud__option-field">
                  <div class="newCloud__template">
                    <div
                      v-for="OS in getOS"
                      class="newCloud__template-item"
                      @click="setOS(OS.id)"
                      :class="{ active: options.os.id == OS.id }"
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

                <a-row class="newCloud__prop">
                  <a-col span="8" :xs="6">{{ $t("os") }}:</a-col>
                  <a-col span="16" :xs="18">
                    <a-select
                      :default-value="defaultOS"
                      style="width: 100%"
                      @change="(newdata) => setAddon('os', +newdata)"
                    >
                      <a-select-option
                        v-for="group in getAddons.os"
                        :key="group.id"
                        >{{ group.description.TITLE }}</a-select-option
                      >
                    </a-select>
                  </a-col>
                </a-row>
              </a-collapse-panel>

              <!-- network -->
              <a-collapse-panel key="network" :header="$t('Network') + ':'">
                <div class="newCloud__option-field">
                  <a-row :gutter="[10, 10]">
                    <a-col :sm="12" :span="24">
                      <a-row :style="{ display: 'flex', alignItems: 'center' }">
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
                      <a-row :style="{ display: 'flex', alignItems: 'center' }">
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

              <!-- Addons -->
              <!-- <div class="paas_addons" v-if="!isAddonsLoading"> -->
              <a-collapse-panel
                key="addons"
                :header="$t('Addons') + ':'"
                :style="{ 'border-radius': '0 0 20px 20px' }"
              >
                <a-row class="newCloud__prop">
                  <a-col span="8" :xs="6"
                    >{{ $t("panel") | capitalize }}:</a-col
                  >
                  <a-col span="16" :xs="18">
                    <a-select
                      default-value="-1"
                      style="width: 100%"
                      @change="(newdata) => setAddon('panel', +newdata)"
                    >
                      <a-select-option value="-1">{{
                        $t("none")
                      }}</a-select-option>
                      <a-select-option
                        v-for="group in getAddons.panel"
                        :key="group.id"
                        >{{ group.description.TITLE }}</a-select-option
                      >
                    </a-select>
                  </a-col>
                </a-row>

                <a-row class="newCloud__prop">
                  <a-col span="8" :xs="6"
                    >{{ $t("backup HDD") | capitalize }}:</a-col
                  >
                  <a-col span="16" :xs="18">
                    <a-select
                      default-value="-1"
                      style="width: 100%"
                      @change="(newdata) => setAddon('backup', +newdata)"
                    >
                      <a-select-option value="-1">0 Gb</a-select-option>
                      <a-select-option
                        v-for="group in getAddons.backup"
                        :key="group.id"
                        >{{ group.description.TITLE }}</a-select-option
                      >
                    </a-select>
                  </a-col>
                </a-row>
              </a-collapse-panel>
              <!-- </div> -->
            </a-collapse>
          </div>

          <div class="newCloud__calculate field result">
            <!-- Tarif -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem' }"
                v-if="options.size"
              >
                <a-col> {{ $t("Tarif") }}: </a-col>
                <a-col>
                  {{ options.size }}
                </a-col>
              </a-row>
            </transition>

            <!-- CPU -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem', 'align-items': 'center' }"
                v-if="getCurrentProd.props.cpu_core"
              >
                <a-col> {{ $t("CPU") }}: </a-col>
                <a-col
                  v-if="options.highCPU"
                  :style="{
                    'font-size': '1rem',
                    background: '#ccc',
                    padding: '0 5px 0 5px',
                  }"
                >
                  {{ $t("High speed") }}
                </a-col>
                <a-col>
                  {{ getCurrentProd.props.cpu_core.TITLE }}
                </a-col>
              </a-row>
            </transition>

            <!-- RAM -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem' }"
                v-if="getCurrentProd.props.ram"
              >
                <a-col> {{ $t("RAM") }}: </a-col>
                <a-col>
                  {{ getCurrentProd.props.ram.TITLE }}
                </a-col>
              </a-row>
            </transition>

            <!-- Drive -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem', 'margin-bottom': '5px' }"
              >
                <a-col> {{ $t("Drive") }}: </a-col>
                <a-col>
                  {{ options.drive ? "SDD" : "HDD" }}
                  <span v-if="!options.addonsObjects.drive">{{
                    getCurrentProd.props.drive.VALUE
                  }}</span>
                  <span v-else>
                    {{
                      parseInt(getCurrentProd.props.drive.VALUE) +
                        parseInt(
                          options.addonsObjects.drive &&
                            options.addonsObjects.drive.description.VALUE
                        )
                    }}
                    Gb</span
                  >
                </a-col>
              </a-row>
            </transition>

            <!-- Trafic -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="getCurrentProd.props.ram"
              >
                <!-- <a-col> {{ $t("Traffic") }}: </a-col> -->
                <a-col>
                  <span v-if="!options.addonsObjects.traffic">{{
                    $t("under 3 Gb per month") | capitalize
                  }}</span>
                  <span v-else>
                    {{
                      $t(
                        `newPaaSTrafficItem.${options.addonsObjects.traffic &&
                          options.addonsObjects.traffic.description.TITLE.replace(
                            "Безлимитный, скорость канала не менее",
                            "Безлимит, от "
                          )}`
                      )
                    }}
                  </span>
                </a-col>
              </a-row>
            </transition>

            <!-- os -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.os.name"
              >
                <a-col> {{ $t("OS") }}: </a-col>
                <a-col>
                  {{ options.os.name }}
                </a-col>
              </a-row>
            </transition>

            <!-- network -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.network.public.status"
              >
                <a-col>
                  <a-tooltip>
                    <template slot="title">
                      {{
                        $t(
                          `Included in total by default ${options.network
                            .price * options.network.public.count}`
                        )
                      }}
                      {{ currency }}
                    </template>
                    <a-badge
                      :style="{ 'font-size': '1.1rem' }"
                      count="?"
                      :number-style="{
                        backgroundColor: '#fff',
                        color: '#999',
                        boxShadow: '0 0 0 1px #d9d9d9 inset',
                      }"
                      :offset="[10, 2]"
                    >
                      {{ $t("public") }} IPv4:
                    </a-badge>
                  </a-tooltip>
                </a-col>
                <a-col>
                  {{ options.network.public.count }}
                </a-col>
              </a-row>
            </transition>

            <!-- Panel -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.addonsObjects.panel"
              >
                <!-- <a-col> {{ $t("Panel") }}: </a-col> -->
                <a-col>{{
                  options.addonsObjects.panel.description.TITLE
                }}</a-col>
              </a-row>
            </transition>

            <!-- Backup -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.addonsObjects.backup"
              >
                <a-col> {{ $t("Backup") }}: </a-col>
                <a-col>
                  {{ options.addonsObjects.backup.description.TITLE }}
                </a-col>
              </a-row>
            </transition>
            <a-skeleton :loading="getCurrentProd == null" :active="true">
              <a-divider orientation="left" :style="{ 'margin-bottom': '0' }">
                {{ $t("Total") }}:
              </a-divider>
              <!-- <transition name="textchange" mode="out-in"> -->
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem', 'margin-top': '10px' }"
              >
                <a-col :key="getFullPrice">
                  <a-switch
                    :checked="options.total.tarification == 'month'"
                    @change="
                      (val) => {
                        options.total.tarification = val ? 'month' : '';
                      }
                    "
                    style="width: 65px"
                  >
                    <span slot="checkedChildren">month</span>
                    <span slot="unCheckedChildren">month</span>
                  </a-switch>
                </a-col>
                <a-col>
                  {{
                    calculatePrice(
                      +getFullPrice +
                        options.network.price * options.network.public.count,
                      (period = "month")
                    ).toFixed(2)
                  }}
                  {{ currency }}/{{ $tc("period.month") }}
                  <!-- </a-tooltip> -->
                </a-col>
              </a-row>
              <a-row
                type="flex"
                justify="space-around"
                style="margin-top: 12px"
              >
                <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
                  {{ $t("Payment period") }}:
                </a-col>

                <a-col :xs="12" :sm="18" :lg="12">
                  <a-select
                    v-model="options.period"
                    style="width: 100%"
                    :disabled="options.total.tarification !== 'month'"
                  >
                    <a-select-option
                      v-for="period in periods"
                      :key="period.title + period.count"
                      :value="period.value"
                    >
                      {{ period.title == "year" ? "1 " : ""
                      }}{{ $tc(period.title, period.count) }}
                    </a-select-option>
                  </a-select>
                </a-col>
              </a-row>
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem', 'margin-top': '30px' }"
              >
                <a-col>
                  <a-switch
                    :checked="options.total.tarification == 'hour'"
                    @change="
                      (val) => {
                        options.total.tarification = val ? 'hour' : '';
                      }
                    "
                    style="width: 65px"
                  >
                    <span slot="checkedChildren">hour</span>
                    <span slot="unCheckedChildren">hour</span>
                  </a-switch>
                </a-col>
                <a-col>
                  ~{{
                    calculatePrice(
                      +getFullPrice +
                        options.network.price * options.network.public.count,
                      (period = "hour")
                    ).toFixed(2)
                  }}
                  {{ currency }}/{{ $t("hour") }}
                </a-col>
              </a-row>
              <!-- </transition> -->
            </a-skeleton>
            <a-row
              type="flex"
              justify="space-around"
              style="
                margin-top: 20px;
                margin-bottom: 10px;
                border-top: 1px solid #e8e8e8;
              "
            >
              <a-col :span="22" style="margin-top: 20px">
                <a-button
                  type="primary"
                  block
                  shape="round"
                  @click="() => (modal.confirmCreate = true)"
                  :loading="getCurrentProd == null"
                  :disabled="!options.total.tarification"
                >
                  {{ $t("Create") }}
                </a-button>
                <a-modal
                  :title="$t('Confirm')"
                  :visible="modal.confirmCreate"
                  :confirm-loading="modal.confirmLoading"
                  :cancel-text="$t('Cancel')"
                  @ok="handleOkOnCreateOrder"
                  @cancel="() => (modal.confirmCreate = false)"
                >
                  {{
                    $t(
                      "Virtual machine will be available after paying the invoice"
                    )
                  }}

                  <a-row style="margin-top: 20px">
                    <a-col>
                      <a-checkbox
                        :checked="modal.goToInvoice"
                        @change="(e) => (modal.goToInvoice = e.target.checked)"
                      />
                      {{ $t("go to invoice") | capitalize }}
                    </a-col>
                  </a-row>
                </a-modal>
              </a-col>
            </a-row>
          </div>
        </div>
        <loading v-else></loading>
      </template>
      <div v-else class="newCloud tariff">
        <div class="field field--fluid">
          <div class="tariff__header">Choose your tariff</div>

          <div class="tariff__wrapper">
            <div class="tariff__cards">
              <div class="tariff__items">
                <div
                  class="tariff__item"
                  v-for="tariff in tariffs"
                  :key="tariff"
                  @click="
                    () => {
                      options.isOnCalc = true;
                      options.kind = tariff;
                      options.size = getProductsData[options.slide];
                    }
                  "
                >
                  <div class="tariff__title">
                    {{
                      getProducts[tariff][getProductsData[options.slide]][0][0]
                        .name | replace("SVDS", "")
                    }}
                  </div>
                  <div class="tariff__body">
                    <loading v-if="isProductsLoading" />
                    <div v-else>
                      <ul>
                        <li class="tariff__property">
                          <span class="tariff__body-value">
                            {{
                              getProducts[tariff][
                                getProductsData[options.slide]
                              ][0][0].pricing[currency].monthly
                            }}
                            <span class="tariff__currency">{{ currency }}</span>
                          </span>
                        </li>
                        <li
                          v-for="(spec, index) in ['cpu_core', 'ram']"
                          :key="index"
                          class="tariff__property"
                        >
                          <span class="tariff__body-value">
                            {{
                              getProducts[tariff][
                                getProductsData[options.slide]
                              ][0][0].props[spec].VALUE
                            }}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tariff__nav">
                <span
                  class="tariff__nav-item tariff__nav-item_prev"
                  :class="[
                    sliderIsCanPrev
                      ? 'tariff__nav-item_active'
                      : 'tariff__nav-item_disabled',
                  ]"
                  @click="sliderNavPrev"
                >
                  <a-icon type="left" />
                </span>
                <span
                  class="tariff__nav-item tariff__nav-item_next"
                  :class="[
                    sliderIsCanNext
                      ? 'tariff__nav-item_active'
                      : 'tariff__nav-item_disabled',
                  ]"
                  @click="sliderNavNext"
                >
                  <a-icon type="right" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
const periods = [
  {
    count: 1,
    title: "month",
    value: "monthly",
  },
  {
    count: 3,
    title: "month",
    value: "quarterly",
  },
  {
    count: 6,
    title: "month",
    value: "semiannually",
    discount: 5,
  },
  {
    count: 1,
    title: "year",
    value: "annually",
    discount: 10,
  },
];
const tariffs = ["standart", "X2CPU", "X2RAM"];
// const sizes = ["M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
import { mapGetters } from "vuex";
import loading from "../loading/loading";
export default {
  name: "newPaaS",
  data() {
    return {
      activeKey: ["tarif"],
      periods,
      // sizes,
      tariffs,
      options: {
        kind: "standart",
        period: "monthly",
        // size: "L",
        isOnCalc: false,
        drive: false, // 1 ssd, 0 hdd
        highCPU: false, // 1 highCPU, 0 basicCPU
        slide: 1,
        addons: {
          drive: -1,
          traffic: -1,
          panel: -1,
          os: -1,
          backup: -1,
        },
        addonsObjects: {
          drive: null,
          traffic: null,
          panel: null,
          os: null,
          backup: null,
          network: null,
        },
        os: {
          id: -1,
          name: "",
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
        total: {
          tarification: "",
        },
      },
      modal: {
        confirmCreate: false,
        confirmLoading: false,
        goToInvoice: true,
      },
    };
  },
  components: {
    loading,
  },
  mounted() {
    this.$store.dispatch("newPaaS/fetchProductsAuto");
    this.$store.dispatch("newPaaS/fetchAddonsAuto");
    this.$store.dispatch("newPaaS/fetchOS");
    this.$axios
      .get("getSettings.php?filter=cost,disktypes,minDisk,maxDisk")
      .then((res) => {
        this.options.network.price = res.data.PUBLIC_IP_COST;
      })
      .catch((err) => {
        console.error(err);
        this.$message.error("Can't load prices. Show saved ones.");
      });
  },
  methods: {
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
          break;
      }
      return price;
    },
    // setOS(id) {
    //   this.options.os.id = id;
    //   this.options.os.name = this.getOS.find((el) => el.id == id).description;
    //   //   if (this.options.rate.id == 0) {
      //     this.collapseKey = "CPURAM";
      //   } else {
      //     this.collapseKey = "drive";
      //   }
    // },
    getPopupContainer(trigger) {
      const elem = trigger.parentElement.parentElement.parentElement;
      return elem;
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
    handleOkOnCreateOrder() {
      const addons = Object.values(this.options.addons)
        .filter((el) => el != -1)
        .join(",");
      const orderData = {
        pid: this.getCurrentProd.pid,
        addons,
        billingcycle: this.options.period,
        tarification: this.options.total.tarification,
      };
      // console.log(orderData, this.$store.getters.getUser);
      if (!this.$store.getters.getUser) {
        this.$store.commit("setOnloginInfo", {
          type: "VM",
          title: "Virtual machine",
          cost: this.getFullPrice,
        });
        this.$store.dispatch("setOnloginAction", () => {
          this.orderVM(orderData);
        });
        this.$router.push({ name: "login" });
        return;
      } else {
        this.orderVM(orderData);
      }
    },
    orderVM(orderData) {
      this.modal.confirmLoading = true;
      const self = this;
      this.$store
        .dispatch("newPaaS/sendOrder", orderData)
        .then((result) => {
          const res = result.data;
          // console.log(res, self);
          if (res.result == "success") {
            self.$message.success(self.$t("Order created successfully."));
            if (self.modal.goToInvoice) {
              self.$router.push(`/invoice-${res.invoiceid}`);
            }
          } else {
            throw result.data;
          }
        })
        .catch((err) => {
          self.$message.error("Can't create order. Try later.");
          console.error(err);
        })
        .finally((res) => {
          self.modal.confirmLoading = false;
        });
    },
    setAddon(name, value) {
      if (name == "os") {
        const data = this.getAddons[name];
        this.options.os.name = data.find(
          (el) => el.id == value
        ).description.TITLE;
      }

      this.options.addons[name] = value;
      let addons = [];
      if (name == "drive") {
        addons = this.getAddons[this.options.drive ? "ssd" : "hdd"];
      } else {
        addons = this.getAddons[name];
      }
      const addon = addons.find((el) => el.id == value);
      this.options.addonsObjects[name] = addon !== undefined ? addon : null;
    },
    sliderNavNext() {
      if (this.sliderIsCanNext) {
        this.options.slide += 1;
      }
    },
    sliderNavPrev() {
      if (this.sliderIsCanPrev) {
        this.options.slide -= 1;
      }
    },
  },
  computed: {
    ...mapGetters("newPaaS", [
      "getProducts",
      "getAddons",
      "isProductsLoading",
      "isAddonsLoading",
      "getOS",
    ]),
    ...mapGetters("app", ["isMaintananceMode"]),
    defaultOS() {
      this.options.os.name = this.getAddons.os[0].description.TITLE;
      return this.getAddons.os[0].id;
    },
    getProductsData() {
      this.$set(
        this.options,
        "size",
        Object.keys(this.getProducts.standart)[
          Math.min(1, Object.keys(this.getProducts.standart).length - 1)
        ]
      );
      return Object.keys(this.getProducts.standart);
    },
    getCurrentProd() {
      const o = this.options;
      const path = [o.kind, o.size, +o.drive, +o.highCPU];

      let current = this.getProducts;
      if (current == undefined || current.length == 0) {
        return null;
      }
      for (let index = 0; index < path.length; index++) {
        if (current[path[index]] != undefined) {
          // console.log(current[path[index]])
          current = current[path[index]];
        } else {
          let pt = path.slice(0, index + 1).join("/");
          console.error(
            `there is no product with path: ${pt}, there is only: ${Object.keys(
              current
            ).join(", ")}`
          );
          return null;
        }
      }
      console.log(current);
      return current;
    },
    getFullPrice() {
      if (this.isAddonsLoading || this.isProductsLoading) {
        return false;
      }
      const VMonly = +this.getCurrentProd.pricing[this.currency][
        this.options.period
      ];
      const addonsName = ["drive", "traffic", "panel", "os", "backup"];
      const addonsCosts = addonsName.map((name) => {
        if (this.options.addonsObjects[name] == null) {
          return 0;
        }
        // console.log(this.options.addonsObjects[name], this.options.addonsObjects, name);
        return this.options.addonsObjects[name].pricing[this.options.period];
      });
      return [VMonly, ...addonsCosts]
        .reduce((acc, val) => acc + val)
        .toFixed(2);
    },
    sliderIsCanNext() {
      return this.options.slide < this.getProductsData.length - 1;
    },
    sliderIsCanPrev() {
      return this.options.slide > 0;
    },
    currency() {
      return this.$config.currency.code;
    },
  },
  watch: {
    getAddons: function(newVal) {
      this.options.addons.os = +newVal.os[0].id;
    },
  },
};
</script>

<style>
.newCloud__prop {
  margin-bottom: 15px;
}
.period__wrapper {
  display: block;
  padding: 15px 0 0;
}
.period__item {
  display: flex;
  justify-content: center;
  position: relative;
}
.period__discount {
  position: absolute;
  top: -22px;
  font-size: 1.1rem;
  color: var(--err);
  font-weight: bold;
}
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
  padding: 0;
}
.newCloud__change-tariff {
  color: var(--main);
  cursor: pointer;
}
.field {
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  height: max-content;
}
.field--fluid {
  width: 100%;
  padding: 10px 15px;
}
.newCloud__calculate {
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
}
.result__title {
  font-size: 1.5rem;
  text-align: center;
  padding: 2px 0 10px;
}
.tariff__header {
  text-align: center;
  padding: 5px 0;
  font-size: 1.6rem;
}
/* .tariff__wrapper:not(:last-child){ */
.tariff__wrapper {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.tariff__nav-item {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  color: var(--main);
  opacity: 0.7;
  --step: -55px;
  cursor: pointer;
  transition: opacity 0.2s ease, font-size 0.2s ease, transform 0.2s ease;
  user-select: none;
}
.tariff__nav-item_active:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}
.tariff__nav-item_active:active {
  opacity: 1;
  transform: translateY(-50%) scale(0.8);
}
.tariff__nav-item_prev {
  left: var(--step);
}
.tariff__nav-item_next {
  right: var(--step);
}
.tariff__nav-item_disabled {
  color: rgba(0, 0, 0, 0.6);
  font-size: 2.5rem;
}
.tariff__cards {
  display: flex;
  position: relative;
}
.tariff__items {
  display: flex;
}
.tariff__sizes {
  display: flex;
  justify-content: space-between;
  /* flex-wrap: wrap; */
  overflow-x: scroll;
}
.tariff-group--title {
  font-size: 1.4rem;
  text-transform: uppercase;
  padding-left: 12px;
}
.tariff__item {
  cursor: pointer;
  width: 200px;
  /* border: 1px solid lightgray; */
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 15px;
  flex-shrink: 0;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}
.tariff__item:not(:last-of-type) {
  margin-right: 15px;
}
.tariff__title {
  background-color: var(--main);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 5px;
  font-size: 1.6rem;
}
.tariff__body {
  padding: 5px 12px 15px;
}
.tariff__body ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
}
.tariff__currency {
  font-size: 1rem;
  opacity: 0.8;
  transition: font 0.2s ease;
}
.tariff__property:hover .tariff__currency {
  opacity: 9;
  font-size: 1.1rem;
}
.tariff__property {
  margin: 10px 0;
  font-size: 1.3rem;
  text-align: center;
}
.tariff__body-value {
  margin-left: 5px;
}
.tariff__order:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.changing__field {
  font-weight: 600;
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
.ant-collapse-item:last-child > .ant-collapse-content {
  border-radius: 0 0 20px 20px;
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
.newCloud__template-name {
  padding: 10px;
}
.newCloud__template-item.active .newCloud__template-name {
  background-color: var(--main);
  color: var(--bright_font);
}
@media screen and (max-width: 991px) {
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
    padding-bottom: 0;
  }
  .field {
    box-shadow: none;
    flex-grow: 0;
  }
  .newCloud__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
  }
}
@media screen and (max-width: 768px) {
  .tariff__items {
    flex-direction: column;
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
