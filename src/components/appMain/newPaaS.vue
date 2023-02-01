<template>
  <div class="newCloud_wrapper">
      <div class="newCloud">
        <div class="newCloud__inputs field">
          <component
            :is="template"
            :activeKey="activeKey"
            :itemSP="itemSP"
            :getPlan="plan"
            :options="options"
            :getProducts="getProducts"
            :productSize="productSize"
            :tarification="tarification"
            :vmName="vmName"
            :password="password"
            :sshKey="sshKey"
            :locationId="locationId"
            @score="onScore"
            @setData="setData"
          >
            <template #location>
              <a-row justify="space-between" style="margin-bottom: 10px">
                <a-alert
                  show-icon
                  type="warning"
                  style="margin-bottom: 15px"
                  v-if="!locationId"
                  :message="$t('Please select a suitable location')"
                />

                <a-select
                  v-model="locationId"
                  :placeholder="$t('select location')"
                  style="width: 180px; position: relative; z-index: 4"
                >
                  <a-select-option
                    v-for="item in locations"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.title }}
                  </a-select-option>
                </a-select>
                <div style="overflow: hidden; margin-top: 15px">
                  <a-spin :tip="$t('loading')" :spinning="isPlansLoading">
                    <my-map v-if="locations.length" v-model="locationId" :markers="locations" />
                  </a-spin>
                </div>
                <!-- <a-radio-group v-model="location_uuid">
                  <a-radio-button
                    v-for="(sp, index) in getSP"
                    :key="index"
                    style="width: 130px; text-align: center"
                    :value="sp.uuid"
                  >
                    {{ sp.title }}
                  </a-radio-button>
                </a-radio-group> -->
              </a-row>
            </template>
          </component>
        </div>

        <div class="newCloud__calculate field result" v-if="this.itemSP && getPlans.length > 0">
          <!-- Location -->
          <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              style="
                font-size: 1.2rem;
                padding-bottom: 5px;
                margin-bottom: 10px;
                border-bottom: 1px solid #e8e8e8;
              "
            >
              <a-col> {{ $t("location") | capitalize }}: </a-col>
              <a-col>
                {{ locationTitle }}
              </a-col>
            </a-row>
          </transition>
          <!-- Tarif -->
          <transition
            name="networkApear"
            v-if="true || getPlan.kind === 'STATIC'"
          >
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem' }"
              v-if="options.size"
            >
              <a-col> {{ $t("tariff") | capitalize }}: </a-col>
              <a-col>
                {{ productSize }}
              </a-col>
            </a-row>
          </transition>

          <!-- CPU -->
          <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem', 'align-items': 'center' }"
            >
              <a-col> {{ $t("cpu") }}: </a-col>
              <!-- <a-col
                :style="{
                  'font-size': '1rem',
                  background: '#ccc',
                  padding: '0 5px 0 5px',
                }"
              >
                {{ $t("High speed") }}
              </a-col> -->
              <a-col v-if="options.cpu.size">
                {{ options.cpu.size }} vCPU
              </a-col>
            </a-row>
          </transition>

          <!-- RAM -->
          <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem' }"
            >
              <a-col> {{ $t("ram") }}: </a-col>
              <a-col v-if="options.ram.size">
                {{ options.ram.size }} Gb
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
                {{ options.drive ? "SSD" : "HDD" }}
                <span>{{ diskSize }}</span>
              </a-col>
            </a-row>
          </transition>

          <!-- Trafic -->
          <!-- <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
              v-if="getCurrentProd.props.ram"
            >
              <a-col>
                <span v-if="!options.addonsObjects.traffic">{{
                  $t("under 3 Gb per month") | capitalize
                }}</span>
                <span v-else>
                  {{
                    $t(
                      `newPaaSTrafficItem.${
                        options.addonsObjects.traffic &&
                        options.addonsObjects.traffic.description.TITLE.replace(
                          "Безлимитный, скорость канала не менее",
                          "Безлимит, от "
                        )
                      }`
                    )
                  }}
                </span>
              </a-col>
            </a-row>
          </transition> -->

          <!-- os -->
          <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
              v-if="options.os.name"
            >
              <a-col> {{ $t("os") }}: </a-col>
              <a-col>
                {{ options.os.name }}
                <template v-if="priceOVH.addons.os">
                  ({{ priceOVH.addons.os }} {{ billingData.currency_code }})
                </template>
              </a-col>
            </a-row>
          </transition>

          <!-- network -->
          <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
              v-if="
                options.network.public.status &&
                tarification !== 'Monthly' &&
                itemSP.type !== 'ovh'
              "
            >
              <a-col>
                <!-- <a-tooltip>
                  <template slot="title">
                    {{
                      $t(
                        `Included in total by default ${
                          options.network.price * options.network.public.count
                        }`
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

                  </a-badge>
                </a-tooltip> -->
                <template v-if="itemSP.type === 'ovh'">{{ $t("public") }} IPv4:</template>
                <template v-else>{{ $t("public") }} IPv4*:</template>
              </a-col>
              <a-col>
                {{ options.network.public.count }}
              </a-col>
            </a-row>
          </transition>

          <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
              v-if="options.network.private.status"
            >
              <a-col>
                <!-- <a-tooltip>
                  <template slot="title">
                    {{
                      $t(
                        `Included in total by default ${
                          options.network.price * options.network.public.count
                        }`
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

                  </a-badge>
                </a-tooltip> -->
                {{ $t("private") }} IPv4:
              </a-col>
              <a-col>
                {{ options.network.private.count }}
              </a-col>
            </a-row>
          </transition>

          <!-- addons -->
          <transition-group name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              v-for="(addon, key) in addons"
              :key="addon"
              :style="{ 'font-size': '1.1rem' }"
            >
              <a-col> {{ $t(key) | capitalize }} ({{ getAddonsValue(key) }}): </a-col>
              <a-col>
                {{ addon }} {{ billingData.currency_code }}
              </a-col>
            </a-row>
          </transition-group>

          <!-- Panel -->
          <!-- <transition name="networkApear">
            <a-row
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
              v-if="options.addonsObjects.panel"
            >
              <a-col>{{
                options.addonsObjects.panel.description.TITLE
              }}</a-col>
            </a-row>
          </transition> -->

          <!-- Backup -->
          <!-- <transition name="networkApear">
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
          </transition> -->
          <!-- <a-skeleton :loading="getCurrentProd == null" :active="true"> -->

          <a-row
            type="flex"
            justify="space-between"
            style="width: 100%; margin-top: 10px"
            v-if="services.length > 1"
          >
            <a-col style="width: 100%">
              <a-select
                placeholder="Services"
                style="width: 100%"
                @change="(item) => (service = item)"
              >
                <a-select-option
                  v-for="service in services"
                  :key="service.uuid"
                  :value="service.uuid"
                  >{{ service.title }}
                </a-select-option>
              </a-select>
            </a-col>
          </a-row>

          <a-row
            type="flex"
            justify="space-between"
            style="width: 100%; margin-top: 10px"
            v-if="getNameSpaces.length > 1"
          >
            <a-col style="width: 100%">
              <a-select
                style="width: 100%"
                placeholder="Namespaces"
                @change="(item) => (namespace = item)"
              >
                <a-select-option
                  v-for="name in getNameSpaces"
                  :key="name.uuid"
                  :value="name.uuid"
                  >{{ name.title }}</a-select-option
                >
              </a-select>
            </a-col>
          </a-row>

          <a-divider
            orientation="left"
            :style="{ 'margin-bottom': '0' }"
          >
            {{ $t("Total") }}:
          </a-divider>
          <a-row type="flex" justify="center" style="margin-top: 15px">
            <a-col>
              <a-radio-group default-value="Monthly" v-model="tarification">
                <a-radio-button
                  v-for="period of periods"
                  :key="period.value"
                  :value="period.value"
                >
                  {{ $t(period.label || period.value) | capitalize }}
                </a-radio-button>
              </a-radio-group>
            </a-col>
          </a-row>
          <!-- <transition name="textchange" mode="out-in"> -->
          <a-row
            type="flex"
            justify="center"
            ref="sum-order"
            :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
          >
            <a-col v-if="tarification === 'Annually'">
              {{ calculatePrice(productFullPriceOVH, (period = "hour")).toFixed(2) }}
              {{ billingData.currency_code || 'USD' }}/{{ $tc("year", 0) }}
            </a-col>

            <a-col v-if="tarification === 'Biennially'">
              {{ calculatePrice(productFullPriceOVH, (period = "hour")).toFixed(2) }}
              {{ billingData.currency_code || 'USD' }}/2 {{ $t("years") }}
            </a-col>

            <a-col v-if="tarification === 'Monthly'">
              {{
                calculatePrice(
                  (plan.type === 'ovh') ? productFullPriceOVH : productFullPriceStatic,
                  (period = "month")
                ).toFixed(2)
              }}
              {{ billingData.currency_code || 'USD' }}/{{ $tc("period.month") }}
            </a-col>

            <a-col v-if="tarification === 'Hourly'">
              ~{{ calculatePrice(productFullPriceCustom, (period = "hour")).toFixed(2) }}
              {{ billingData.currency_code || 'USD' }}/{{ $t("hour") }}
            </a-col>
          </a-row>
          <!-- </transition> -->
          <!-- </a-skeleton> -->
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
              <!-- :loading="getCurrentProd == null" -->
              <div
                class="products__unregistred"
                style="margin-bottom: 10px; text-align: center"
                v-if="
                  score > 3 &&
                  password.length > 0 &&
                  options.os.name &&
                  vmName &&
                  !isLoggedIn
                "
              >
                {{ $t("unregistered.will be able after") }}
                <a href="#" @click="availableLogin">{{ $t("unregistered.login") }}</a>.
              </div>
              <a-button
                block
                type="primary"
                shape="round"
                v-if="
                  activeKey &&
                  (activeKey !== 'addons' && itemSP.type === 'ovh') ||
                  (activeKey !== 'OS' && itemSP.type !== 'ovh')
                "
                @click="nextStep"
              >
                {{ $t("next") | capitalize }}
              </a-button>
              <a-button
                block
                v-else-if="itemSP.type === 'ovh'"
                type="primary"
                shape="round"
                :disabled="
                  vmName == '' ||
                  namespace == '' ||
                  options.os.name == '' ||
                  !isLoggedIn
                "
                @click="() => (modal.confirmCreate = true)"
              >
                {{ $t("Create") }}
              </a-button>
              <a-button
                block
                v-else
                type="primary"
                shape="round"
                :disabled="
                  password.length === 0 ||
                  vmName == '' ||
                  namespace == '' ||
                  options.os.name == '' ||
                  !isLoggedIn
                "
                @click="() => (modal.confirmCreate = true)"
              >
                {{ $t("Create") }}
              </a-button>
              <a-modal
                :title="$t((score < 4 && itemSP.type !== 'ovh') ? 'Weak pass' : 'Confirm')"
                :visible="modal.confirmCreate"
                :ok-button-props="{ props: { disabled: (score < 4 && itemSP.type !== 'ovh') } }"
                :confirm-loading="modal.confirmLoading"
                :cancel-text="$t('Cancel')"
                @ok="handleOkOnCreateOrder"
                @cancel="() => (modal.confirmCreate = false)"
              >
                <span style="color: var(--err)" v-if="score < 4 && itemSP.type !== 'ovh'">
                  {{ $t("Password must contain uppercase letters, numbers and symbols") }}
                </span>
                <template v-else>
                  {{ $t("Virtual machine will be available after paying the invoice") }}
                </template>


                <!-- <a-row style="margin-top: 20px">
                  <a-col>
                    <a-checkbox
                      :checked="modal.goToInvoice"
                      @change="(e) => (modal.goToInvoice = e.target.checked)"
                    />
                    {{ $t("go to invoice") | capitalize }}
                  </a-col>
                </a-row> -->
              </a-modal>
            </a-col>
            <a-col
              style="font-size: 14px; margin: 16px 16px 0"
              v-if="itemSP.type !== 'ovh' && tarification !== 'Monthly'"
            >
              <span style="position: absolute; left: -8px">*</span>
              {{ $t('Payment will be made immediately after purchase') }}
            </a-col>
          </a-row>
        </div>
      </div>
      <add-funds
        v-if="addfunds.visible"
        :sum="addfunds.amount"
        :modalVisible="addfunds.visible"
        :hideModal="() => addfunds.visible = false"
      />
      <!-- <div v-else class="newCloud tariff">
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
      </div> -->
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import loading from "../loading/loading";
import myMap from "../map/map.vue";
import addFunds from '../balance/addFunds.vue';
import notification from "@/mixins/notification.js";
import api from "@/api.js";

export default {
  name: "newPaaS",
  components: { loading, myMap, addFunds },
  mixins: [notification],
  data() {
    return {
      dataLocalStorage: "",
      productSize: "VDS L",
      activeKey: "location",
      plan: {},
      periods: [
        { value: "Monthly", label: "ssl_product.Monthly" },
        { value: "Hourly", label: "ssl_product.Hourly" }
      ],
      service: "",
      namespace: "",
      tarification: "Monthly",
      locationId: "Location",
      vmName: "",
      password: "",
      sshKey: undefined,
      score: null,
      product: {},
      addfunds: { visible: false, amount: 0 },
      priceOVH: { value: 0, addons: {} },
      options: {
        // kind: "standart",

        // period: "monthly",
        period: "1",
        size: "VDS L",
        isOnCalc: false,
        highCPU: false, // 1 highCPU, 0 basicCPU
        // slide: 1,

        cpu: {
          size: 1,
          min: 1,
          max: 8,
        },
        ram: {
          size: 1,
          min: 1,
          max: 12,
        },
        disk: {
          type: "SSD",
          step: 1,
          size: 1,
          min: 20,
          max: 500,
        },
        os: {
          id: -1,
          name: "",
        },
        network: {
          public: {
            status: true,
            count: 1,
            min: 1,
            max: 5,
          },
          private: {
            status: false,
            count: 0,
          },
          price: 0,
        },
        config: {}
      },
      modal: {
        confirmCreate: false,
        confirmLoading: false,
        goToInvoice: false,
      },
    };
  },

  computed: {
    ...mapGetters("nocloud/namespaces", ["getNameSpaces"]),
    ...mapGetters("nocloud/plans", ["getPlans", "isPlansLoading"]),
    ...mapGetters("nocloud/sp", ["getSP"]),
    ...mapGetters("nocloud/auth", ["userdata", "billingData", "isLoggedIn"]),
    ...mapGetters("nocloud/vms", ["getServicesFull"]),

    itemService() {
      const data = this.getServicesFull.find((el) => {
        return this.service === el.uuid;
      });
      return data;
    },
    services() {
      return this.getServicesFull.filter((el) => el.status !== 'DEL');
    },

    locations() {
      const locations = [];

      this.getSP.forEach((sp) => {
        sp.locations.forEach((location) => {
          locations.push({
            ...location, sp: sp.uuid,
            id: `${sp.title} ${location.id}`
          });
        });
      });

      return locations;
    },
    itemSP() {
      const { sp } = this.locations.find((el) => el.id === this.locationId) || {};

      if (sp) return this.getSP.find((el) => el.uuid === sp);
    },
    template() {
      if (this.itemSP?.type === 'ovh') {
        return () => import('@/components/appMain/modules/ovh/createInstance.vue');
      } else {
        return () => import('@/components/appMain/modules/ione/createInstance.vue');
      }
    },
    addons() {
      const addons = { ...this.priceOVH.addons };

      delete addons.os;
      return addons;
    },

    //--------------Plans-----------------
    //UNKNOWN and STATIC
    getPlan() {
      const type = (this.tarification === 'Monthly') ? 'STATIC' : 'DYNAMIC';
      const item = this.getPlans.find((el) => el.kind === type);

      if (item) this.plan = item;
      return item || {};
    },

    //STATIC
    getPlanOneStatic() {
      for (let planStatic of this.getPlans || {}) {
        if (planStatic.kind === 'STATIC') {
          return planStatic;
        }
      }
    },
    //-------------------------------------

    getProducts() {
      const planTitle = [];
      const sort = [];

      if (!this.getPlanOneStatic) return planTitle;
      for (let prod of Object.values(this.getPlanOneStatic.products)) {
        sort.push(+prod.sorter);
        sort.sort();
      }

      for (let el of sort) {
        for (let prod of Object.values(this.getPlanOneStatic.products)) {
          if (el === +prod.sorter) {
            planTitle.push(prod.title);
          }
        }
      }
      return planTitle;
    },

    productFullPriceStatic() {
      if (!this.getPlanOneStatic) return 0;
      const product = Object.values(this.getPlanOneStatic.products)
        .find(({ title }) => title === this.productSize);

      if (!product) return 0;
      return product.price / product.period * 3600 * 24 * 30;
    },
    productFullPriceCustom() {
      const plan = this.getPlans.find(({ kind }) => kind !== 'STATIC');
      if (plan) {
        const price = [];
        for (let resource of plan.resources) {
          const key = resource.key.toLowerCase();

          if (key.includes('ip')) {
            const { count } = this.options.network.public;

            price.push(resource.price / resource.period * 3600 * count);
          } else if (key.includes('drive')) {
            const { size } = this.options.disk;

            if (key !== `drive_${this.options.drive ? 'ssd' : 'hdd'}`) continue;
            price.push(resource.price / resource.period * 3600 * (size / 1024));
          } else {
            const { size } = this.options[key];

            price.push(resource.price / resource.period * 3600 * size);
          }
        }
        return price.reduce((accum, item) => accum + item, 0);
      }
    },
    productFullPriceOVH() {
      const { value, addons } = this.priceOVH;
      const addonsPrice = Object.values(addons).reduce((a, b) => a + b, 0);
      let percent = (this.plan.fee?.default ?? 0) / 100 + 1;

      if (!this.plan.fee?.ranges) return value + addonsPrice;

      for (let range of this.plan.fee.ranges) {
        if (value <= range.from) continue;
        if (value > range.to) continue;
        percent = range.factor / 100 + 1;
      }

      return value + addonsPrice * percent;
    },
    diskPrice() {
      const { size } = this.options.disk;
      const disk = this.getPlanOneStatic?.resources
        .find(({ key }) => key === `drive_${this.options.drive ? 'ssd' : 'hdd'}`);

      if (!disk) return 0;
      return (this.tarification === 'Monthly')
        ? disk.price / disk.period * 3600 * 24 * 30 * (size / 1024)
        : disk.price / disk.period * 3600 * (size / 1024);
    },
    // passwordValid() {
    //   if (this.focused == true) {
    //     if (!this.password.match(/[A-Za-z]/)) {
    //       this.textInvalid = "Password must contain at least one letter";
    //       return false;
    //     } else {
    //       this.textInvalid = "";
    //     }
    //     if (!this.password.match(/[0-9]/)) {
    //       this.textInvalid = "Password must contain at least one number";
    //       return false;
    //     } else {
    //       this.textInvalid = "";
    //     }
    //     if (!this.password.match(/[\W_]/)) {
    //       this.textInvalid =
    //         "Password must contain at least one special symbol";
    //       return false;
    //     } else {
    //       this.textInvalid = "";
    //     }
    //     if (this.password.length < 11) {
    //       this.textInvalid = "Password is too short (at least 10 symbol)";
    //       return false;
    //     } else {
    //       this.textInvalid = "";
    //     }
    //   } else {
    //     this.textInvalid = "";
    //     return false;
    //   }
    // },
    // getCurrentProd() {
    //   const o = this.options;
    //   const path = [o.kind, o.size, +o.drive, +o.highCPU];

    //   let current = this.getProducts;
    //   if (current == undefined || current.length == 0) {
    //     return null;
    //   }
    //   for (let index = 0; index < path.length; index++) {
    //     if (current[path[index]] != undefined) {
    //       // console.log(current[path[index]])
    //       current = current[path[index]];
    //     } else {
    //       let pt = path.slice(0, index + 1).join("/");
    //       console.error(
    //         `there is no product with path: ${pt}, there is only: ${Object.keys(
    //           current
    //         ).join(", ")}`
    //       );
    //       return null;
    //     }
    //   }
    //   return current;
    // },
    // getFullPrice() {
    //   if (this.isAddonsLoading || this.isProductsLoading) {
    //     return false;
    //   }
    //   const VMonly =
    //     +this.getCurrentProd.pricing[this.currency][this.options.period];
    //   const addonsName = ["drive", "traffic", "panel", "os", "backup"];
    //   const addonsCosts = addonsName.map((name) => {
    //     if (this.options.addonsObjects[name] == null) {
    //       return 0;
    //     }
    //     return this.options.addonsObjects[name].pricing[this.options.period];
    //   });
    //   return [VMonly, ...addonsCosts]
    //     .reduce((acc, val) => acc + val)
    //     .toFixed(2);
    // },
    sliderIsCanNext() {
      return this.options.slide < this.getProductsData.length - 1;
    },
    sliderIsCanPrev() {
      return this.options.slide > 0;
    },
    currency() {
      return this.$config.currency.code;
    },
    diskSize() {
      const size = (this.options.disk.size / 1024).toFixed(1);

      return (size >= 1) ? `${size} Gb` : `${this.options.disk.size} Mb`;
    },
    locationTitle() {
      if (this.itemSP?.type !== 'ovh') return this.itemSP?.locations[0].title;
      const { datacenter } = this.options.config;
      const { locations } = this.itemSP;

      return locations?.find(({ extra }) => extra.region === datacenter)?.title;
    }
  },
  mounted() {
    this.$store.dispatch("nocloud/sp/fetch", !this.isLoggedIn)
      .then(() => {
        if (localStorage.getItem("data")) {
          try {
            this.dataLocalStorage = JSON.parse(localStorage.getItem("data"));
            this.tarification = this.dataLocalStorage.tarification;
            this.options.os.id = this.dataLocalStorage.config.template_id;
            this.options.os.name = this.dataLocalStorage.config.template_name;
            this.password = this.dataLocalStorage.config.password;
            this.vmName = this.dataLocalStorage.titleVM;
            this.locationId = this.dataLocalStorage.locationId;

            this.options.config = this.dataLocalStorage.ovhConfig;
            this.options.disk.size = this.dataLocalStorage.resources.drive_size;
            this.options.drive = this.dataLocalStorage.resources.drive_type;
            this.setData({ key: 'productSize', value: this.dataLocalStorage.productSize });
            this.plan = this.dataLocalStorage.billing_plan;
          } catch (e) {
            localStorage.removeItem("data");
          }
        }
      });
    this.$store.dispatch("nocloud/vms/fetch")
      .then(() => {
        setTimeout(this.setOneService, 300);
      });
    this.$store.dispatch("nocloud/namespaces/fetch")
      .then(() => {
        setTimeout(this.setOneNameSpace, 300);
      });

    this.$router.beforeEach((to, from, next) => {
      if (
        from.path === "/cloud/newVM" &&
        localStorage.getItem("data") &&
        this.isLoggedIn
      ) {
        const answer = window.confirm(this.$t("Data will be lost"));
        if (answer) {
          localStorage.removeItem("data");
          next();
        } else {
          next(false);
        }
      } else {
        next();
      }
    });

    // window.addEventListener("load", () => {
    //   if (localStorage.getItem("data")) {
    //     const answer = window.confirm(
    //       "Do you really want to leave? you have unsaved changes!"
    //     );
    //     if (answer) {
    //       localStorage.removeItem("data");
    //     }
    //   }
    // });
    // if (window.location.reload() && localStorage.getItem("data")) {
    //   const answer = window.confirm(
    //     "Do you really want to leave? you have unsaved changes!"
    //   );
    //   if (answer) {
    //     localStorage.removeItem("data");
    //   }
    // }

    // this.$store.dispatch("newPaaS/fetchProductsAuto");

    // this.$axios
    //   .get("getSettings.php?filter=cost,disktypes,minDisk,maxDisk")
    //   .then((res) => {
    //     this.options.network.price = res.data.PUBLIC_IP_COST;
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     this.$message.error("Can't load prices. Show saved ones.");
    //   });
  },
  methods: {
    onScore({ score }) {
      this.score = score;
    },
    setData({ key, value, type }) {
      if (type === 'ovh') {
        this.$set(this.options.config, key, value);
        return;
      }
      if (typeof value === 'object') this[key] = Object.assign({}, value);
      else this[key] = value;

      if (key === 'productSize') {
        if (!this.getPlanOneStatic) return;
        for (let [key, value] of Object.entries(this.getPlanOneStatic.products)) {
          if (value.title === this.productSize) {
            const product = { ...value, key };

            this.options.ram.size = product.resources.ram / 1024;
            this.options.cpu.size = product.resources.cpu;
            this.options.disk.size = product.resources.disk ?? this.options.disk.size;
            this.product = product;
          }
        }
      }
    },
    setOneService() {
      console.log(this.services);
      if (this.services?.length === 1) {
        this.service = this.services[0].uuid;
      }
    },
    setOneNameSpace() {
      if (this.getNameSpaces.length === 1) {
        this.namespace = this.getNameSpaces[0].uuid;
      }
    },
    changeValuePlus(variable) {
      if (variable == "cpu") {
        this.options.cpu.size < this.options.cpu.max && this.options.cpu.size++;
      }
      if (variable == "ram") {
        this.options.ram.size < this.options.ram.max && this.options.ram.size++;
      }
      if (variable == "ip") {
        this.options.network.public.count < this.options.network.public.max &&
          this.options.network.public.count++;
      }
    },
    changeValueMinus(variable) {
      if (variable == "cpu") {
        this.options.cpu.size > this.options.cpu.min && this.options.cpu.size--;
      }
      if (variable == "ram") {
        this.options.ram.size > this.options.ram.min && this.options.ram.size--;
      }
      if (variable == "ip") {
        this.options.network.public.count > this.options.network.public.min &&
          this.options.network.public.count--;
      }
    },
    nextStep() {
      if (this.activeKey === 'location') {
        this.activeKey = 'plan';
      } else if (this.activeKey === 'plan') {
        this.activeKey = 'OS';
      } else if (this.activeKey === 'OS') {
        this.activeKey = 'addons';
      }
    },
    calculatePrice(price, period = this.period) {
      switch (period) {
        case "minute":
          return price / 60;
        case "day":
          return price / 30;
        case "week":
          return (price / 30) * 7;
        case "hour":
          return price;
        case "month":
          return price + this.diskPrice;
        case "year":
          return price * 12;
        case "2 years":
          return price * 24;
        default:
          console.error("[VDC Calculator]: Wrong period in calc.", period);
      }
    },
    getPopupContainer(trigger) {
      const elem = trigger.parentElement.parentElement.parentElement;
      return elem;
    },
    getAddonsValue(key) {
      const addon = this.options.config.addons.find((el) => el.includes(key));

      return `${parseFloat(addon.split('-').at(-1))} Gb`;
    },
    // URLparameter(obj, outer = "") {
    //   var str = "";
    //   for (var key in obj) {
    //     if (key == "price") continue;
    //     if (str != "") {
    //       str += "&";
    //     }
    //     if (typeof obj[key] == "object") {
    //       str += this.URLparameter(obj[key], outer + key);
    //     } else {
    //       str += outer + key + "=" + encodeURIComponent(obj[key]);
    //     }
    //   }
    //   return str;
    // },
    handleOkOnCreateOrder() {
      // --------------------------------
      const newInstance = {
        title: this.vmName,
        config: {
          template_id: this.options.os.id,
          password: this.password,
          ssh_public_key: this.sshKey,
        },
        resources: {
          cpu: this.options.cpu.size,
          ram: this.options.ram.size * 1024,
          drive_type: this.options.drive ? "SSD" : "HDD",
          drive_size: this.options.disk.size,
          ips_private: this.options.network.private.count,
          ips_public: this.options.network.public.count,
        },
        billing_plan: {
          uuid: this.plan.uuid,
          title: this.plan.title,
          type: this.plan.type,
          public: this.plan.public,
        },
        product: this.product.key
      };

      const newGroup = {
        title: this.userdata.title + Date.now(),
        resources: {
          ips_private: 0,
          ips_public: 0,
        },
        type: this.itemSP.type,
        instances: [],
        sp: this.itemSP.uuid
      };
      // -------------------------------------
      //update service
      if (newGroup.type === 'ovh') {
        newInstance.config = { type: 'vps', ...this.options.config };
      }
      if (this.itemService?.instancesGroups.length < 1) {
        this.itemService.instancesGroups = [newGroup];
      }
      if (this.service !== "") {
        this.$store.dispatch("nocloud/vms/fetch")
          .then(() => {
            setTimeout(() => {
              this.setOneService();
              const orderDataNew = Object.assign(
                {},
                { instances_groups: this.itemService.instancesGroups },
                { ...this.itemService }
              );
              let group = orderDataNew.instances_groups.find(
                (el) => el.sp === this.itemSP.uuid
              );

              if (!group) {
                orderDataNew.instances_groups.push(newGroup);
                group = orderDataNew.instances_groups.at(-1);
              }
              group.instances.push(newInstance);

              const res = group.instances.reduce((prev, curr) => ({
                private: prev.private + curr.resources.ips_private,
                public: prev.public + curr.resources.ips_public
              }), { private: 0, public: 0 });

              group.resources.ips_private = res.private;
              group.resources.ips_public = res.public;

              delete orderDataNew.instancesGroups;
              if (this.checkBalance()) this.updateVM(orderDataNew);
            }, 300);
          });
      } else {
        //create service
        const orderData = {
          namespace: this.namespace,
          service: {
            title: this.userdata.title,
            context: {},
            version: "1",
            instances_groups: [
              {
                title: this.userdata.title + Date.now(),
                resources: {
                  ips_private: newInstance.resources.ips_private,
                  ips_public: newInstance.resources.ips_public,
                },
                type: this.itemSP.type,
                instances: [newInstance],
                sp: this.itemSP.uuid,
              },
            ],
          },
        };
        if (this.checkBalance()) this.orderVM(orderData);
      }
    },
    orderVM(orderData) {
      this.modal.confirmLoading = true;
      this.$store
        .dispatch("nocloud/vms/createService", orderData)
        .then((result) => {
          if (result) {
            this.$message.success(this.$t("Order created successfully"));
            this.deployService(result.uuid);
            if (this.modal.goToInvoice) {
              this.$router.push(`/invoice/${res.invoiceid}`);
            }
          } else {
            throw "error";
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
          console.error(err);
        });
    },
    updateVM(orderDataNew) {
      this.modal.confirmLoading = true;
      this.$store
        .dispatch("nocloud/vms/updateService", orderDataNew)
        .then((result) => {
          if (result) {
            this.$message.success(this.$t("Order update successfully"));
            this.deployService(result.uuid);
            if (this.modal.goToInvoice) {
              this.$router.push(`/invoice/${result.invoiceid}`);
            }
          } else {
            throw "error";
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
          console.error(err);
        });
    },
    checkBalance() {
      const sum = this.$refs['sum-order'].$el.firstElementChild.innerText;
      const { balance = 0 } = this.userdata;

      if (balance < parseFloat(sum.replace('~', ''))) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance.'),
          content: () => (
            <div>{ this.$t('Click OK to replenish the account with the missing amount') }</div>
          ),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(sum) - this.userdata.balance);
            this.addfunds.visible = true;
          }
        });
        return false;
      }
      return true;
    },
    deployService(uuidService) {
      api.services
        .up(uuidService)
        .then(() => {
          this.$message.success("VM created succefully");
          this.$router.push({ path: '/cloud' });
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
        })
        .finally(() => {
          this.modal.confirmLoading = false;
        });
    },
    availableLogin() {
      const data = {
        path: "/cloud/newVM",
        titleSP: this.itemSP.title,
        tarification: this.tarification,
        productSize: this.productSize,
        titleVM: this.vmName,
        locationId: this.locationId,
        resources: {
          cpu: this.options.cpu.size,
          ram: this.options.ram.size * 1024,
          drive_type: this.options.drive,
          drive_size: this.options.disk.size,
          ips_private: this.options.network.private.count,
          ips_public: this.options.network.public.count,
        },
        config: {
          template_id: this.options.os.id,
          template_name: this.options.os.name,
          password: this.password,
        },
        billing_plan: {
          uuid: this.plan.uuid,
          title: this.plan.title,
          type: this.plan.type,
          public: this.plan.public,
        },
        ovhConfig: this.options.config
      };
      localStorage.setItem("data", JSON.stringify(data));
      this.$router.push({ name: "login" });
    },
    // setAddon(name, value) {
    //   if (name == "os") {
    //     const data = this.getAddons[name];
    //     this.options.os.name = data.find(
    //       (el) => el.id == value
    //     ).description.TITLE;
    //   }

    //   this.options.addons[name] = value;
    //   let addons = [];
    //   if (name == "drive") {
    //     addons = this.getAddons[this.options.drive ? "ssd" : "hdd"];
    //   } else {
    //     addons = this.getAddons[name];
    //   }
    //   const addon = addons.find((el) => el.id == value);
    //   this.options.addonsObjects[name] = addon !== undefined ? addon : null;
    // },
    sliderNavNext() {
      if (this.sliderIsCanNext) {
        this.options.slide += 1;
      }
    },
    sliderNavPrev() {
      if (this.sliderIsCanPrev) {
        this.options.slide -= 1;
      }
    }
  },

  watch: {
    tarification() {
      if (this.getPlan.kind == "STATIC") {
        this.options.ram.size = this.product.resources?.ram / 1024;
        this.options.cpu.size = this.product.resources?.cpu;
      }
    },
    periods(periods) {
      this.tarification = periods[0].value;
    },
    locationId() {
      this.$store.dispatch("nocloud/plans/fetch", {
        sp_uuid: this.itemSP.uuid,
        anonymously: !this.isLoggedIn
      })
      .then(({ pool }) => {
        pool.forEach((plan) => {
          const data = localStorage.getItem('data');

          if (plan.kind === 'STATIC' && !data) {
            const { resources, title } = (plan.meta.product)
              ? Object.values(plan.products).find((el) => el.title === plan.meta.product)
              : Object.values(plan.products)[0];

            this.options.ram.size = resources.ram / 1024;
            this.options.cpu.size = resources.cpu;
            this.options.disk.size = resources.disk ?? 20 * 1024;
            this.setData({ key: 'productSize', value: title });
            this.plan = plan;
          }
        });
        if (!('uuid' in this.plan)) this.plan = pool[0] ?? {};
        this.$store.commit('nocloud/plans/setPlans', pool);
      });

      const type = this.options.drive ? "SSD" : "HDD";
      const { min_drive_size, max_drive_size } = this.itemSP.vars;

      if (!(min_drive_size || max_drive_size)) return;
      this.options.disk.min = min_drive_size.value[type];
      this.options.disk.max = max_drive_size.value[type];
    },
    'options.os.name'() {
      if (this.options.disk.min > 0) return;
      const { id } = this.options.os;
      const { min_size } = this.itemSP.publicData.templates[id];

      this.options.disk.min = min_size / 1024;
    },
    'options.disk.size'(value) {
      if (value / 1024 >= 200) {
        this.options.disk.step = 20;
      } else if (value / 1024 >= 100) {
        this.options.disk.step = 10;
      } else if (value / 1024 >= 50) {
        this.options.disk.step = 5;
      } else {
        this.options.disk.step = 1;
      }
    }
    // getAddons: function (newVal) {
    //   this.options.addons.os = +newVal.os[0].id;
    // },
    // activeKey: function(){
    //     this.activeKey.push('tarif')
    // }
  },
};
</script>

<style>
.password.invalid {
  border: 1px solid red;
}
.location_item {
  display: flex;
  justify-content: center;
}
.ant-slider-mark-text:first-of-type {
  width: 60px !important;
  left: 2% !important;
}
.ant-slider-mark-text:last-of-type {
  width: 60px !important;
  left: 98% !important;
}
.newCloud__prop {
  margin-bottom: 15px;
}
.period__wrapper {
  display: block;
  padding: 15px 0 0;
}
.vdc_plan .ant-input-number-handler-wrap {
  display: none;
}
.vdc_plan .ant-input-number-input {
  text-align: center;
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
  padding-bottom: 15px;
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
  gap: 17px;
}
.newCloud__template.one-line {
  flex-wrap: nowrap;
  justify-content: space-between;
}
.ant-collapse-item:last-child > .ant-collapse-content {
  border-radius: 0 0 20px 20px;
}
.newCloud__template-item {
  width: 100px;
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
.newCloud__template-image img {
  object-fit: cover;
  max-width: 100%;
  max-height: 80px;
}
.newCloud__template-name {
  padding: 10px;
  word-break: break-word;
}
.newCloud__template-item.active .newCloud__template-name {
  background-color: var(--main);
  color: var(--bright_font);
}
.ant-collapse > .ant-collapse-item:last-child {
  border-radius: 0 0 15px 15px;
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
