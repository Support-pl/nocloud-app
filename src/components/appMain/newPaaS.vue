<template>
  <div class="newCloud_wrapper">
    <div class="newCloud">
      <div class="newCloud__inputs field">
        <a-spin
          v-if="isPlansLoading"
          style="display: block; margin: 15px auto"
          :tip="$t('loading')"
          :spinning="isPlansLoading"
        />

        <component
          :is="template"
          v-else
          :active-key="activeKey"
          :item-s-p="itemSP"
          :plans="filteredPlans"
          :get-plan="getPlan"
          :options="options"
          :get-products="getProducts"
          :product-size="productSize"
          :tarification="tarification"
          :vm-name="vmName"
          :username="username"
          :password="password"
          :ssh-key="sshKey"
          :location-id="locationId"
          @score="onScore"
          @setData="setData"
        >
          <template #location>
            <a-row justify="space-between" style="margin-bottom: 10px">
              <a-alert
                v-if="!locationId"
                show-icon
                type="warning"
                style="margin-bottom: 15px"
                :message="$t('Please select a suitable location')"
              />

              <!-- <a-select
                v-model="locationId"
                :placeholder="$t('select location')"
                style="width: 180px; position: relative; z-index: 4; margin-right: 8px"
              >
                <a-select-option v-for="item in locations" :key="item.id" :value="item.id">
                  {{ item.title }}
                </a-select-option>
              </a-select> -->

              <a-select
                v-model="showcase"
                :placeholder="$t('select service')"
                style="width: 180px; position: relative; z-index: 4"
              >
                <a-select-option v-for="item in showcases" :key="item.uuid" :value="item.uuid">
                  {{ item.title }}
                </a-select-option>
              </a-select>

              <div style="overflow: hidden; margin-top: 15px">
                <nc-map
                  v-if="locations.length"
                  v-model="locationId"
                  :markers="locations"
                  :marker-color="itemSP?.meta.markerColor"
                  :marker-url="itemSP?.meta.markerUrl"
                />
              </div>
            </a-row>
          </template>
        </component>
      </div>

      <div v-if="itemSP && getPlans.length > 0" class="newCloud__calculate field result">
        <div
          v-if="locationDescription && activeKey === 'location'"
          v-html="locationDescription"
        />

        <template v-else>
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
          <transition name="networkApear">
            <a-row
              v-if="productSize"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem' }"
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
              v-if="options.cpu.size && options.cpu.size !== 'loading'"
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
              <a-col>{{ options.cpu.size }} {{ (isNaN(+options.cpu.size)) ? '' : 'vCPU' }}</a-col>
            </a-row>
          </transition>

          <!-- RAM -->
          <transition name="networkApear">
            <a-row
              v-if="options.ram.size"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem' }"
            >
              <a-col> {{ $t("ram") }}: </a-col>
              <a-col>{{ options.ram.size }} Gb</a-col>
            </a-row>
          </transition>

          <!-- GPU -->
          <transition name="networkApear">
            <a-row
              v-if="product.resources?.gpu_name"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.2rem' }"
            >
              <a-col> {{ $t("gpu") }}: </a-col>
              <a-col>{{ product.resources.gpu_name }} (x{{ product.resources.gpu_count }})</a-col>
            </a-row>
          </transition>

          <!-- Drive -->
          <transition name="networkApear">
            <a-row
              v-if="parseFloat(diskSize)"
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
              v-if="options.os.name"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
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
              v-if="
                options.network.public.status &&
                  itemSP.type !== 'ovh'
              "
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
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
                <template v-if="tarification !== 'Hourly'">
                  {{ $t("public") }} IPv4:
                </template>
                <template v-else>
                  {{ $t("public") }} IPv4*:
                </template>
              </a-col>
              <a-col>
                {{ options.network.public.count }}
              </a-col>
            </a-row>
          </transition>

          <transition name="networkApear">
            <a-row
              v-if="options.network.private.status"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
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
              v-for="(addon, key) in addons"
              :key="addon"
              type="flex"
              justify="space-between"
              :style="{ 'font-size': '1.1rem' }"
            >
              <a-col> {{ $t(key) | capitalize }} {{ getAddonsValue(key) }}: </a-col>
              <a-col>
                {{ addon }} {{ currency.code }}
              </a-col>
            </a-row>
          </transition-group>

          <a-row
            v-if="filteredPlans.length > 1 && itemSP.type !== 'ione'"
            type="flex"
            justify="space-between"
            style="width: 100%; margin-top: 10px"
          >
            <a-col style="width: 100%">
              <a-select
                v-model="plan"
                placeholder="Price models"
                style="width: 100%"
              >
                <a-select-option
                  v-for="plan in filteredPlans"
                  :key="plan.uuid"
                  :value="plan.uuid"
                >
                  {{ plan.title }}
                </a-select-option>
              </a-select>
            </a-col>
          </a-row>

          <a-row
            v-if="services.length > 1"
            type="flex"
            justify="space-between"
            style="width: 100%; margin-top: 10px"
          >
            <a-col style="width: 100%">
              <a-select
                v-model="service"
                placeholder="Services"
                style="width: 100%"
              >
                <a-select-option
                  v-for="service in services"
                  :key="service.uuid"
                  :value="service.uuid"
                >
                  {{ service.title }}
                </a-select-option>
              </a-select>
            </a-col>
          </a-row>

          <a-row
            v-if="getNameSpaces.length > 1"
            type="flex"
            justify="space-between"
            style="width: 100%; margin-top: 10px"
          >
            <a-col style="width: 100%">
              <a-select
                v-model="namespace"
                style="width: 100%"
                placeholder="Namespaces"
              >
                <a-select-option
                  v-for="name in getNameSpaces"
                  :key="name.uuid"
                  :value="name.uuid"
                >
                  {{ name.title }}
                </a-select-option>
              </a-select>
            </a-col>
          </a-row>
        </template>

        <transition name="networkApear">
          <a-row
            v-if="product.installationFee"
            type="flex"
            justify="space-between"
            style="
              font-size: 1.2rem;
              padding-top: 5px;
              margin-top: 10px;
              border-top: 1px solid #e8e8e8;
            "
          >
            <a-col> {{ $t('installation') | capitalize }}: </a-col>
            <a-col style="margin-left: auto">
              {{ +(product.installationFee * currency.rate).toFixed(2) }} {{ currency.code }}
            </a-col>
          </a-row>
        </transition>

        <transition name="networkApear">
          <a-row
            type="flex"
            justify="space-between"
            style="font-size: 1.2rem; gap: 5px"
            :style="(!product.installationFee) ? {
              paddingTop: '5px',
              marginTop: '10px',
              borderTop: '1px solid #e8e8e8'
            } : null"
          >
            <a-col> {{ $t('recurring payment') | capitalize }}: </a-col>
            <a-col style="margin-left: auto">
              {{ +(productFullPrice - (product.installationFee ?? 0)).toFixed(2) }} {{ currency.code }}
            </a-col>
          </a-row>
        </transition>

        <a-divider
          orientation="left"
          style="margin-bottom: 0; margin-top: 5px"
        >
          {{ $t("Total") }}:
        </a-divider>
        <a-row type="flex" justify="center" style="margin-top: 15px">
          <a-col>
            <a-radio-group
              ref="periods-group"
              v-model="tarification"
              default-value="Monthly"
              :style="{ display: 'grid', textAlign: 'center', gridTemplateColumns: periodColumns }"
            >
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

        <a-row
          ref="sum-order"
          type="flex"
          justify="center"
          :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
        >
          <a-col v-if="activeKey === 'location' && tarification" style="margin-right: 4px">
            {{ $t('from') | capitalize }}:
          </a-col>
          <transition name="textchange" mode="out-in">
            <a-col>
              {{ +(productFullPrice).toFixed(2) }} {{ currency.code }}
            </a-col>
          </transition>
        </a-row>

        <a-row
          type="flex"
          justify="space-around"
          style="
            margin-top: 15px;
            margin-bottom: 10px;
            border-top: 1px solid #e8e8e8;
          "
        >
          <a-col :span="22" style="margin-top: 20px">
            <!-- :loading="getCurrentProd == null" -->
            <div
              v-if="
                (itemSP.type !== 'ovh' &&
                  score > 3 &&
                  password.length > 0 &&
                  !isLoggedIn) ||
                  options.os.name &&
                  vmName &&
                  !isLoggedIn
              "
              class="products__unregistred"
              style="margin-bottom: 10px; text-align: center"
            >
              {{ $t("unregistered.will be able after") }}
              <a href="#" @click.prevent="availableLogin('login')">{{ $t("unregistered.login") }}</a>.
              <br>
              <a href="#" @click.prevent="availableLogin('copy')">
                {{ $t("Copy link") }}
                <a-icon type="copy" />
              </a>
            </div>
            <a-button
              v-if="
                activeKey &&
                  (activeKey !== 'addons' && itemSP.type === 'ovh' && !getPlan.type?.includes('cloud')) ||
                  (activeKey !== 'OS' && itemSP.type !== 'ovh') ||
                  (activeKey !== 'OS' && getPlan.type?.includes('cloud'))
              "
              block
              type="primary"
              shape="round"
              @click="nextStep"
            >
              {{ $t("next") | capitalize }}
            </a-button>
            <a-button
              v-else-if="itemSP.type === 'ovh'"
              block
              type="primary"
              shape="round"
              :disabled="
                vmName == '' ||
                  !namespace ||
                  options.os.name == '' ||
                  !isLoggedIn
              "
              @click="() => (modal.confirmCreate = true)"
            >
              {{ $t("Create") }}
            </a-button>
            <a-button
              v-else
              block
              type="primary"
              shape="round"
              :disabled="
                password.length === 0 ||
                  vmName == '' ||
                  !namespace ||
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
              <span v-if="score < 4 && itemSP.type !== 'ovh'" style="color: var(--err)">
                {{ $t("Password must contain uppercase letters, numbers and symbols") }}
              </span>
              <template v-else>
                {{ $t("Virtual machine will be available after paying the invoice") }}
              </template>

              <a-row style="margin-top: 20px">
                <a-col>
                  <a-checkbox v-model="modal.autoRenew" />
                  {{ $t("renew automatically") | capitalize }}
                </a-col>
              </a-row>
            </a-modal>
          </a-col>
          <a-col
            v-if="itemSP.type !== 'ovh' && tarification === 'Hourly'"
            style="font-size: 14px; margin: 16px 16px 0"
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
      :modal-visible="addfunds.visible"
      :hide-modal="() => addfunds.visible = false"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { NcMap } from 'nocloud-ui'
import loading from '@/components/loading/loading.vue'
import addFunds from '@/components/balance/addFunds.vue'
import notification from '@/mixins/notification.js'
import api from '@/api.js'

export default {
  name: 'NewPaaS',
  components: { loading, NcMap, addFunds },
  mixins: [notification],
  data () {
    return {
      isPlansLoading: true,
      dataLocalStorage: '',
      productSize: '',
      activeKey: 'location',
      periods: [],
      plan: undefined,
      service: undefined,
      namespace: undefined,
      tarification: '',
      showcase: '',
      locationId: 'Location',
      vmName: '',
      username: '',
      password: '',
      sshKey: undefined,
      score: null,
      product: {},
      addfunds: { visible: false, amount: 0 },
      priceOVH: { value: 0, addons: {} },
      options: {
        // kind: "standart",

        // period: "monthly",
        period: '1',
        size: 'VDS L',
        isSSHExist: false,
        isOnCalc: false,
        highCPU: false, // 1 highCPU, 0 basicCPU
        drive: false,
        // slide: 1,

        cpu: {
          size: 1,
          min: 1,
          max: 8
        },
        ram: {
          size: 1,
          min: 1,
          max: 12
        },
        disk: {
          type: 'SSD',
          step: 1,
          size: 1,
          min: 20,
          max: 480
        },
        os: {
          id: -1,
          name: ''
        },
        network: {
          public: {
            status: true,
            count: 1,
            min: 1,
            max: 5
          },
          private: {
            status: false,
            count: 0
          },
          price: 0
        },
        config: { addons: [], configuration: {} }
      },
      modal: {
        confirmCreate: false,
        confirmLoading: false,
        goToInvoice: false,
        autoRenew: true
      }
    }
  },

  computed: {
    ...mapGetters('nocloud/namespaces', ['getNameSpaces']),
    ...mapGetters('nocloud/plans', ['getPlans']),
    ...mapGetters('nocloud/sp', ['getSP']),
    ...mapGetters('nocloud/auth', ['userdata', 'billingData', 'isLoggedIn']),
    ...mapGetters('nocloud/vms', ['getServicesFull']),

    itemService () {
      const data = this.getServicesFull.find((el) => {
        return this.service === el.uuid
      })
      return data
    },
    services () {
      return this.getServicesFull.filter((el) => el.status !== 'DEL')
    },

    locations () {
      const locations = []

      this.showcases.forEach((showcase) => {
        showcase.locations?.forEach((location) => {
          const sp = this.getSP.find(({ locations }) =>
            locations.find(({ id, type }) =>
              location.id.includes(id) && location.type === type
            )
          )

          if (this.showcase === '' || this.showcase === showcase.uuid) {
            locations.push({ ...location, sp: sp?.uuid, showcase: showcase.uuid })
          }
        })
      })

      return locations
    },
    showcases () {
      const showcases = this.$store.getters['nocloud/sp/getShowcases']
      const titles = [{ title: 'all', uuid: '' }]

      showcases.forEach((showcase) => {
        if (showcase.locations.length < 1) return

        titles.push(showcase)
      })

      return titles
    },
    locationDescription () {
      const { showcase: showcaseUuid } = this.locations.find((el) => el.id === this.locationId) ?? {}
      const showcase = this.showcases.find(({ uuid }) => uuid === showcaseUuid)
      const { locale } = this.$i18n

      if (!showcase?.promo) return
      return showcase?.promo[locale]?.service.description
    },
    itemSP () {
      const { sp } = this.locations.find((el) => el.id === this.locationId) || {}

      if (sp) return this.getSP.find((el) => el.uuid === sp)
      else return null
    },
    template () {
      if (this.itemSP?.type.includes('ovh')) {
        const { type = 'ovh vps' } = this.getPlan ?? {}
        const components = import.meta.glob('@/components/appMain/modules/*/createInstance.vue')
        const component = Object.keys(components).find((key) => key.includes(`/${type}/`))

        return () => components[component]()
      } else {
        return () => import('@/components/appMain/modules/ione/createInstance.vue')
      }
    },
    addons () {
      const addons = { ...this.priceOVH.addons }

      if (this.getPlan.type?.includes('dedicated')) {
        delete addons.disk
      }

      delete addons.os
      delete addons.ram
      return addons
    },

    // --------------Plans-----------------
    filteredPlans () {
      const locationItem = this.locations.find((el) => el.id === this.locationId)
      const { plans } = this.showcases.find(({ uuid }) => {
        if (this.showcase === '') {
          return uuid === locationItem?.showcase
        }
        return uuid === this.showcase
      }) ?? { plans: '' }

      if (plans === '' || plans.length < 1) return this.getPlans
      return this.getPlans.filter(({ uuid, type }) =>
        locationItem?.type === type && plans.includes(uuid)
      )
    },
    getPlan () {
      return this.getPlans.find(({ uuid }) => uuid === this.plan) ?? {}
    },
    // -------------------------------------

    getProducts () {
      const isDynamic = this.getPlan.kind === 'DYNAMIC'
      const isIone = this.getPlan.type === 'ione'
      const titles = []

      const { products } = (isDynamic && isIone)
        ? this.getPlans.find(({ uuid }) =>
          uuid === this.getPlan.meta?.linkedPlan
        ) ?? {}
        : this.getPlan ?? {}

      Object.values(products ?? {}).forEach((product) => {
        const isEqual = this.tarification === this.getTarification(product.period)

        if (!product.public) return
        if (isEqual || this.getPlan.kind === 'DYNAMIC') {
          titles.splice(product.sorter, 0, product.title)
        }
      })

      return titles
    },

    productFullPriceStatic () {
      if (!this.getPlan) return 0
      const values = Object.values(this.getPlan.products ?? {})
      const product = (this.activeKey !== 'location')
        ? values.find(({ title }) => title === this.productSize)
        : values.sort((a, b) => a.price - b.price)[0]

      if (!product) return 0
      return product.price / product.period * 3600 * 24 * 30
    },
    productFullPriceCustom () {
      if (this.getPlan) {
        const price = []
        for (const resource of this.getPlan.resources ?? []) {
          const key = resource.key.toLowerCase()

          if (key.includes('ip')) {
            const { count } = (this.activeKey !== 'location')
              ? this.options.network.public
              : { count: 1 }

            price.push(resource.price / resource.period * 3600 * count)
          } else if (key.includes('drive')) {
            const { size } = (this.activeKey === 'location')
              ? { size: this.options.disk.min * 1024 }
              : this.options.disk

            if (key !== `drive_${this.options.drive ? 'ssd' : 'hdd'}`) continue
            price.push(resource.price / resource.period * 3600 * (size / 1024))
          } else {
            const { size } = (this.activeKey === 'location')
              ? { size: this.options[key]?.min ?? 0 }
              : this.options[key]

            price.push(resource.price / resource.period * 3600 * size)
          }
        }
        return price.reduce((accum, item) => accum + item, 0)
      }

      return 0
    },
    productFullPriceOVH () {
      const { value, addons } = this.priceOVH
      const addonsPrice = Object.values(addons).reduce((a, b) => a + b, 0)
      // let percent = (this.getPlan.fee?.default ?? 0) / 100 + 1;

      return value + addonsPrice
      // if (!this.getPlan.fee?.ranges) return value + addonsPrice;

      // for (let range of this.getPlan.fee.ranges) {
      //   if (value <= range.from) continue;
      //   if (value > range.to) continue;
      //   percent = range.factor / 100 + 1;
      // }

      // return value + addonsPrice * percent;
    },
    productFullPrice () {
      const resourcesPrice = (this.itemSP.type === 'ione')
        ? this.productFullPriceCustom * 24 * 30 * this.currency.rate
        : 0
      let price = 0
      let period = ''

      switch (this.tarification) {
        case 'Annually':
          period = 'year'
          break
        case 'Biennially':
          period = '2 years'
          break
        case 'Monthly':
          period = 'month'
          break
        case 'Daily':
          period = 'day'
          break
        case 'Hourly':
          period = 'hour'
          price = this.productFullPriceCustom
      }

      if (this.itemSP.type === 'ovh') {
        period = 'hour'
        price = this.productFullPriceOVH
      } else if (this.getPlan.kind === 'STATIC') {
        price = this.productFullPriceStatic
      }

      price += this.product.installationFee ?? 0
      price *= this.currency.rate

      switch (period) {
        case 'minute':
          return price / 60
        case 'week':
          return (price / 30) * 7
        case 'hour':
          return price
        case 'day':
          return (price + resourcesPrice) / 30
        case 'month':
          return price + resourcesPrice
        case 'year':
          return ((price + resourcesPrice) / 30) * 365
        case '2 years':
          return ((price + resourcesPrice) / 30) * 365 * 2
        default:
          console.error('[VDC Calculator]: Wrong period in calc.', period)
          return 0
      }
    },
    currency () {
      const currencies = this.$store.getters['nocloud/auth/currencies']
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency']

      const code = this.$store.getters['nocloud/auth/unloginedCurrency']
      const { rate } = currencies.find((el) =>
        el.to === code && el.from === defaultCurrency
      ) ?? {}

      const { rate: reverseRate } = currencies.find((el) =>
        el.from === code && el.to === defaultCurrency
      ) ?? { rate: 1 }

      if (!this.isLoggedIn) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: this.billingData.currency_code ?? defaultCurrency }
    },

    diskSize () {
      const size = (this.options.disk.size / 1024).toFixed(1)

      return (size >= 1) ? `${size} Gb` : `${this.options.disk.size} Mb`
    },
    locationTitle () {
      if (this.itemSP?.type !== 'ovh') return this.itemSP?.locations[0].title
      const { configuration } = this.options.config
      const { locations } = this.itemSP
      const key = Object.keys(configuration).find(
        (el) => el.includes('datacenter')
      )

      return locations?.find(({ extra }) =>
        extra.region.toLowerCase() === configuration[key]?.toLowerCase()
      )?.title
    },
    periodColumns () {
      const { length } = Object.keys(this.periods)

      if (length === 4) return 'repeat(2, 1fr)'
      return `repeat(${(length < 3) ? length : 3}, 1fr)`
    },
    isProductExist () {
      return !this.$route.query.product && this.getPlan.type?.includes('dedicated')
    }
  },

  watch: {
    tarification (value) {
      if (this.getPlan.type === 'ione' && value) {
        const type = (value === 'Hourly') ? 'DYNAMIC' : 'STATIC'
        const item = this.filteredPlans.find((el) => {
          if (type === 'DYNAMIC') return el.kind === type
          let period = 0

          switch (value) {
            case 'Daily':
              period = 3600 * 24
              break
            case 'Annually':
              period = 3600 * 24 * 365
              break
            case 'Biennially':
              period = 3600 * 24 * 365 * 2
              break
            default:
              period = 3600 * 24 * 30
          }

          return el.kind === type && Object.values(el.products).find((el) => +el.period === period)
        })

        this.plan = item.uuid
        this.setData({ key: 'productSize', value: this.getProducts[1] ?? this.getProducts[0] })
      } else if (this.getPlan.type?.includes('cloud')) {
        setTimeout(() => {
          const period = (this.options.config.monthlyBilling) ? 'P1M' : 'P1H'
          const { planCode } = this.options.config

          this.product = {
            ...this.getPlan.products[`${period} ${planCode}`],
            key: `${period} ${planCode}`
          }
        }, 100)
      }
    },
    periods (periods) {
      if (this.dataLocalStorage.productSize) return
      this.tarification = ''

      setTimeout(() => {
        this.tarification = periods[0]?.value ?? ''
      })
    },
    itemService (service) {
      const group = service.instancesGroups.find(({ type }) =>
        this.getPlan.type?.includes(type)
      ) ?? {}

      if (group.config?.ssh) this.options.isSSHExist = true
      else this.options.isSSHExist = false
    },
    itemSP () {
      if (!this.dataLocalStorage.config) {
        this.options.os = { id: -1, name: '' }
      }

      if (!this.itemSP?.uuid) return
      this.isPlansLoading = true
      this.$store.dispatch('nocloud/plans/fetch', {
        sp_uuid: this.itemSP.uuid,
        anonymously: !this.isLoggedIn
      })
        .then(({ pool }) => {
          this.plan = this.filteredPlans[0]?.uuid ?? pool[0]?.uuid ?? ''

          if (this.dataLocalStorage.billing_plan) {
            this.plan = this.dataLocalStorage.billing_plan.uuid
            this.setData({ key: 'productSize', value: this.dataLocalStorage.productSize })
          } else if (this.dataLocalStorage.locationId) {
            this.tarification = this.periods[0]?.value ?? ''
          }

          if (this.dataLocalStorage) {
            this.activeKey = this.dataLocalStorage.activeKey ?? 'location'
          }
        })
        .finally(() => {
          this.isPlansLoading = false
        })

      const type = this.options.drive ? 'SSD' : 'HDD'
      const { min_drive_size, max_drive_size } = this.itemSP.vars

      if (min_drive_size) {
        this.options.disk.min = min_drive_size.value[type]
      }
      if (max_drive_size) {
        this.options.disk.max = max_drive_size.value[type]
      }
    },
    getPlan (value) {
      if (value.meta?.minDisk) {
        this.options.disk.min = +value.meta.minDisk
      }
      if (value.meta?.maxDisk) {
        this.options.disk.max = +value.meta.maxDisk
      }
    },
    'options.os.name' () {
      if (this.options.disk.min > 0) return
      const { id } = this.options.os
      const { min_size } = this.itemSP.publicData.templates[id]

      this.options.disk.min = min_size / 1024
    },
    'options.disk.size' (value) {
      if (value / 1024 >= 200) {
        this.options.disk.step = 20
      } else if (value / 1024 >= 100) {
        this.options.disk.step = 10
      } else if (value / 1024 >= 50) {
        this.options.disk.step = 5
      } else {
        this.options.disk.step = 1
      }
    },
    activeKey () {
      setTimeout(() => {
        const { $el } = this.$refs['periods-group']?.$children.at(-1) ?? {}

        if ($el?.style.gridColumn === '' && Object.keys(this.periods).length > 4) {
          if (Object.keys(this.periods).length % 3 === 1) $el.style.gridColumn = '2 / 3'
        }
      })
    },
    showcase () { this.setDefaultLocation() },
    locations () { this.setDefaultLocation() }
  },
  created () {
    this.showcase = this.$route.query.service ?? ''
    this.$store.dispatch('nocloud/sp/fetchShowcases', !this.isLoggedIn)
    this.$store.dispatch('nocloud/sp/fetch', !this.isLoggedIn)
      .then(async () => {
        const data = localStorage.getItem('data')
        const { query } = this.$route

        if (data || ('data' in query)) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 100))
            this.dataLocalStorage = (data)
              ? JSON.parse(localStorage.getItem('data'))
              : JSON.parse(query.data)

            this.tarification = this.dataLocalStorage.tarification ?? ''
            this.vmName = this.dataLocalStorage.titleVM ?? ''
            this.locationId = this.locations.find(({ id }) => {
              const locationId = this.dataLocalStorage.locationId.split('-')

              locationId.shift()
              return id.includes(locationId.join('-'))
            })?.id ?? ''
            this.activeKey = null

            if (this.dataLocalStorage.config) {
              this.options.os.id = this.dataLocalStorage.config.template_id
              this.options.os.name = this.dataLocalStorage.config.template_name
            }

            if (this.dataLocalStorage.ovhConfig) {
              this.options.config = this.dataLocalStorage.ovhConfig
            }

            if (this.dataLocalStorage.resources) {
              this.options.disk.size = this.dataLocalStorage.resources.drive_size
              this.options.drive = this.dataLocalStorage.resources.drive_type
            }
          } catch (e) {
            localStorage.removeItem('data')
          }
        }
      })

    if (this.isLoggedIn) {
      Promise.all([
        this.$store.dispatch('nocloud/vms/fetch'),
        this.$store.dispatch('nocloud/namespaces/fetch')
      ])
        .then(() => {
          setTimeout(this.setOneService, 300)
          setTimeout(this.setOneNameSpace, 300)
        })
    }

    if (this.$store.getters['nocloud/auth/currencies'].length < 1) {
      this.$store.dispatch('nocloud/auth/fetchCurrencies', {
        anonymously: !this.isLoggedIn
      })
    }

    this.$router.beforeEach((to, from, next) => {
      if (
        from.path === '/cloud/newVM' &&
        localStorage.getItem('data') &&
        this.isLoggedIn
      ) {
        const answer = (this.addfunds.amount === 0)
          ? window.confirm(this.$t('Data will be lost'))
          : false

        if (answer) {
          localStorage.removeItem('data')
          next()
        } else if (this.addfunds.amount === 0) {
          next(false)
        } else {
          next()
        }
      } else {
        next()
      }
    })
  },
  methods: {
    onScore ({ score }) {
      this.score = score
    },
    setData ({ key, value, type }) {
      if (type === 'ovh') {
        if (key.includes('datacenter') || key.includes('os')) {
          value = { [key]: value }
        }
        if (key.includes('datacenter')) {
          const confKey = Object.keys(this.options.config.configuration)
            .find((el) => el.includes('os'))

          value[confKey] = this.options.config.configuration[confKey]
          key = 'configuration'
        }
        if (key.includes('os')) {
          const confKey = Object.keys(this.options.config.configuration)
            .find((el) => el.includes('datacenter'))

          value[confKey] = this.options.config.configuration[confKey]
          key = 'configuration'
        }

        this.$set(this.options.config, key, value)
        return
      }
      if (typeof value === 'object') this[key] = Object.assign({}, value)
      else this[key] = value

      if (key === 'productSize') {
        const plan = (this.getPlan.kind === 'DYNAMIC' && this.getPlan.type === 'ione')
          ? this.getPlans.find((el) => el.uuid === this.getPlan.meta.linkedPlan)
          : this.getPlan

        if (!plan) return
        for (const [key, value] of Object.entries(plan.products ?? {})) {
          const period = (this.options.config.monthlyBilling) ? 'P1M' : 'P1H'

          if (value.title === this.productSize) {
            const product = { ...value, key }

            this.options.ram.size = product.resources.ram / 1024
            this.options.cpu.size = product.resources.cpu
            this.options.disk.size = product.resources.disk ?? plan.meta.minDisk ?? 20 * 1024
            this.product = product
          } else if (
            (value.title.includes(this.productSize) && !this.getPlan.type.includes('cloud')) ||
            (value.title.includes(this.productSize) && value.resources.period === period)
          ) {
            this.product = { ...value, key }
          }
        }
      }

      if (key === 'type') {
        const plan = this.getPlans.find(({ type }) => type.includes(value))
        const products = Object.values(plan.products)
        const product = products[1] ?? products[0]

        this.plan = plan.uuid
        this.setData({ key: 'productSize', value: product.title })
      }
    },
    setOneService () {
      console.log(this.services)
      if (this.services?.length === 1) {
        this.service = this.services[0].uuid
      }
    },
    setOneNameSpace () {
      if (this.getNameSpaces.length === 1) {
        this.namespace = this.getNameSpaces[0].uuid
      }
    },
    nextStep () {
      if (this.activeKey === 'location') {
        this.activeKey = 'plan'
      } else if (this.activeKey === 'plan') {
        if (!this.isProductExist) {
          this.activeKey = 'OS'
          return
        }
        this.$router.push({ query: { product: this.productSize } })
      } else if (this.activeKey === 'OS') {
        this.activeKey = 'addons'
      }
    },
    getPopupContainer (trigger) {
      const elem = trigger.parentElement.parentElement.parentElement
      return elem
    },
    getAddonsValue (key) {
      const addon = this.options.config.addons.find((el) => el.includes(key))
      const value = parseFloat(addon.split('-').at(-1))

      return isFinite(value) ? `(${value} Gb)` : ''
    },
    getTarification (timestamp) {
      const day = 3600 * 24
      const month = day * 30
      const year = day * 365

      switch (+timestamp) {
        case 3600:
          return 'Hourly'
        case day:
          return 'Daily'
        case month:
          return 'Monthly'
        case year:
          return 'Annually'
        case year * 2:
          return 'Biennially'
      }
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
    handleOkOnCreateOrder () {
      // --------------------------------
      const newInstance = {
        title: this.vmName,
        config: {
          template_id: this.options.os.id,
          username: this.username,
          password: this.password,
          ssh_public_key: this.sshKey,
          auto_renew: this.modal.autoRenew
        },
        resources: {
          cpu: this.options.cpu.size,
          ram: this.options.ram.size * 1024,
          drive_type: this.options.drive ? 'SSD' : 'HDD',
          drive_size: this.options.disk.size,
          ips_private: this.options.network.private.count,
          ips_public: this.options.network.public.count
        },
        billing_plan: {
          uuid: this.getPlan.uuid,
          title: this.getPlan.title,
          type: this.getPlan.type,
          public: this.getPlan.public
        },
        product: this.product.key
      }

      const newGroup = {
        title: this.userdata.title + Date.now(),
        resources: {
          ips_private: 0,
          ips_public: 0
        },
        type: this.itemSP.type,
        instances: [],
        sp: this.itemSP.uuid
      }
      // -------------------------------------
      // update service
      if (newGroup.type === 'ovh') {
        newInstance.config = {
          ...this.options.config,
          type: this.getPlan.type.split(' ')[1],
          auto_renew: this.modal.autoRenew
        }

        if (newInstance.config.type === 'cloud') {
          const { resources } = this.getPlan.products[newInstance.product]

          newInstance.resources = { ...resources, ips_private: 0, ips_public: 1 }
          newGroup.config = { ssh: newInstance.config.ssh }
          delete newInstance.config.ssh
        }

        delete newInstance.product
      }
      if (this.itemService?.instancesGroups?.length < 1) {
        this.itemService.instancesGroups = [newGroup]
      }
      if (this.service) {
        this.$store.dispatch('nocloud/vms/fetch')
          .then(() => {
            setTimeout(() => {
              this.setOneService()
              const orderDataNew = Object.assign({}, this.itemService)
              let group = orderDataNew.instancesGroups.find(
                (el) => el.sp === this.itemSP.uuid
              )

              if (!group) {
                orderDataNew.instancesGroups.push(newGroup)
                group = orderDataNew.instancesGroups.at(-1)
              }
              if (newInstance.config.type === 'cloud') {
                group.config = { ssh: this.options.config.ssh }
              }
              group.instances.push(newInstance)

              const res = group.instances.reduce((prev, curr) => ({
                private: prev.private + (curr.resources.ips_private ?? 0),
                public: prev.public + (curr.resources.ips_public ?? 0)
              }), { private: 0, public: 0 })

              group.resources.ips_private = res.private
              group.resources.ips_public = res.public

              if (this.checkBalance()) this.updateVM(orderDataNew)
            }, 300)
          })
      } else {
        // create service
        const orderData = {
          namespace: this.namespace,
          service: {
            title: this.userdata.title,
            context: {},
            version: '1',
            instancesGroups: [
              {
                title: this.userdata.title + Date.now(),
                resources: {
                  ips_private: newInstance.resources.ips_private,
                  ips_public: newInstance.resources.ips_public
                },
                type: this.itemSP.type,
                instances: [newInstance],
                sp: this.itemSP.uuid
              }
            ]
          }
        }

        if (newInstance.config.type === 'cloud') {
          orderData.service.instancesGroups[0].config = { ssh: this.options.config.ssh }
        }
        if (this.checkBalance()) this.orderVM(orderData)
      }
    },
    orderVM (orderData) {
      this.modal.confirmLoading = true
      this.$store
        .dispatch('nocloud/vms/createService', orderData)
        .then((result) => {
          if (result) {
            this.$message.success(this.$t('Order created successfully'))
            this.deployService(result.uuid)
            if (this.modal.goToInvoice) {
              this.$router.push(`/billing/${result.invoiceid}`)
            }
          } else {
            throw new Error('error')
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })
    },
    updateVM (orderDataNew) {
      this.modal.confirmLoading = true
      this.$store
        .dispatch('nocloud/vms/updateService', orderDataNew)
        .then((result) => {
          if (result) {
            this.$message.success(this.$t('Order update successfully'))
            this.deployService(result.uuid)
            if (this.modal.goToInvoice) {
              this.$router.push(`/billing/${result.invoiceid}`)
            }
          } else {
            throw new Error('error')
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })
    },
    checkBalance () {
      const sum = this.$refs['sum-order'].$el.firstElementChild.innerText
      const { balance = 0 } = this.userdata

      if (balance < parseFloat(sum.replace('~', ''))) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance'),
          content: this.$t('Click OK to replenish the account with the missing amount'),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(sum) - (this.userdata.balance || 0))
            this.addfunds.visible = true
            this.availableLogin()
          }
        })
        return false
      }
      return true
    },
    deployService (uuidService) {
      api.services
        .up(uuidService)
        .then(() => {
          this.$message.success('VM created succefully')
          this.$router.push({ path: '/services' })
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
        })
        .finally(() => {
          this.modal.confirmLoading = false
        })
    },
    availableLogin (mode) {
      const data = {
        path: '/cloud/newVM',
        titleSP: this.itemSP.title,
        tarification: this.tarification,
        productSize: this.productSize,
        titleVM: this.vmName,
        locationId: this.locationId,
        activeKey: this.activeKey,
        resources: {
          cpu: this.options.cpu.size,
          ram: this.options.ram.size * 1024,
          drive_type: this.options.drive,
          drive_size: this.options.disk.size,
          ips_private: this.options.network.private.count,
          ips_public: this.options.network.public.count
        },
        config: {
          template_id: this.options.os.id,
          template_name: this.options.os.name
        },
        billing_plan: { uuid: this.getPlan.uuid },
        ovhConfig: this.options.config
      }

      if (mode === 'login') {
        localStorage.setItem('data', JSON.stringify(data))
        this.$router.push({ name: 'login' })
      } else if (mode === 'copy') {
        const link = location.href

        this.addToClipboard(`${link}?data=${JSON.stringify(data)}`)
      } else {
        localStorage.setItem('data', JSON.stringify(data))
      }
    },
    addToClipboard (text) {
      if (navigator?.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.openNotificationWithIcon('success', {
              message: this.$t('Link copied')
            })
          })
          .catch((res) => {
            console.error(res)
          })
      } else {
        this.openNotificationWithIcon('error', {
          message: this.$t('Clipboard is not supported')
        })
      }
    },
    setDefaultLocation () {
      const item = this.showcases.find(({ uuid }) => uuid === this.showcase)
      const locationItem = this.locations.find(({ id }) =>
        id.includes(item?.promo.main?.default)
      )

      if (!locationItem) return
      this.locationId = locationItem.id
    },
    sliderNavNext () {
      if (this.sliderIsCanNext) {
        this.options.slide += 1
      }
    },
    sliderNavPrev () {
      if (this.sliderIsCanPrev) {
        this.options.slide -= 1
      }
    }
  }
}
</script>

<style>
.password.invalid {
  border: 1px solid red;
}
.location_item {
  display: flex;
  justify-content: center;
}
.ant-slider-mark-text {
  white-space: nowrap;
}
.ant-slider-mark-text:first-of-type {
  transform: translateX(-10px) !important;
}
.ant-slider-mark-text:last-of-type {
  transform: translateX(calc(-100% + 10px)) !important;
}
.newCloud_wrapper .ant-radio-button-wrapper {
  margin: 1px;
  border-radius: 4px !important;
  border-left: 1px solid #d9d9d9;
}
.newCloud_wrapper .ant-radio-button-wrapper-checked:not(
  .ant-radio-button-wrapper-disabled
 ) {
  border-left-color: #1890ff;
}
.newCloud_wrapper .ant-radio-button-wrapper:not(:first-child)::before {
  content: none;
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
  background-color: #fff;
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  transition: all 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  max-width: calc(50% - 9px);
}
.newCloud__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}
.newCloud__template-item.active {
  box-shadow: 5px 8px 12px rgba(0, 0, 0, 0.08), 0px 0px 13px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
  background-color: var(--main);
  color: var(--bright_font);
}
.newCloud__template-image {
  padding: 5px 0 5px 10px;
  overflow: hidden;
}
.newCloud__template-image img {
  object-fit: cover;
  max-width: 100%;
  max-height: 80px;
}
.newCloud__template-image img::before {
  width: 16px;
  display: inline-block;
  overflow: hidden;
  height: 15px;
}
.newCloud__template-image img::after {
  content: url('/img/OS/default.png');
  display: block;
  position: absolute;
  transform: translate(-36px, -59px) scale(0.21);
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.newCloud__template-name {
  padding: 10px;
  word-break: break-word;
}
.newCloud__template-item.active .newCloud__template-image img {
  padding: 2px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.newCloud__template-item.active .newCloud__template-image img::after {
  transform: translate(-37px, -61px) scale(0.18);
  padding: 2px;
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
@media screen and (max-width: 575px) {
  .newCloud__template-item {
    grid-template-columns: 40px 1fr;
  }
  .newCloud__template-image {
    padding: 7px 0 7px 10px;
  }
  .newCloud__template-image__rate {
    line-height: 42px;
    font-size: 1.4rem;
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
  .ant-form-item-label {
    line-height: inherit;
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

.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter {
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
