<template>
  <div class="newCloud_wrapper">
    <div class="newCloud">
      <div class="newCloud__inputs order__field">
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
          @set-data="setData"
        >
          <template #location>
            <a-row justify="space-between" style="margin-bottom: 10px">
              <a-col span="24">
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
                  v-model:value="showcase"
                  :placeholder="$t('select service')"
                  style="width: 180px; position: relative; z-index: 4"
                >
                  <a-select-option v-for="item in showcases" :key="item.uuid">
                    {{ item.title }}
                  </a-select-option>
                </a-select>
              </a-col>

              <a-col span="24" style="overflow: hidden; margin-top: 15px">
                <nc-map
                  :value="locationId"
                  :markers="locations"
                  :marker-color="itemSP?.meta.markerColor"
                  :marker-url="itemSP?.meta.markerUrl"
                  @input="(value) => locationId = value"
                />
              </a-col>
            </a-row>
          </template>
        </component>
      </div>

      <div v-if="itemSP && plans.length > 0" class="newCloud__calculate order__field">
        <editor-container
          v-if="locationDescription && activeKey === 'location'"
          :value="locationDescription"
        />

        <template v-else>
          <!-- Location Tarif CPU RAM GPU Drive os network -->
          <cloud-resources
            :options="options"
            :item-s-p="itemSP"
            :product="product"
            :product-size="productSize"
            :tarification="tarification"
            :disk-size="diskSize"
            :price-o-v-h="priceOVH"
          />

          <!-- addons -->
          <transition-group name="networkApear">
            <a-row
              v-for="(addon, key) in addons"
              :key="addon"
              justify="space-between"
              style="font-size: 1.1rem"
            >
              <a-col> {{ capitalize($t(key)) }} {{ getAddonsValue(key) }}: </a-col>
              <a-col> {{ addon }} {{ currency.code }} </a-col>
            </a-row>
          </transition-group>

          <selects-to-create
            v-model:plan="plan"
            v-model:service="service"
            v-model:namespace="namespace"
            :plans-list="filteredPlans"
            :is-plans-visible="itemSP.type !== 'ione'"
          />
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
            <a-col> {{ capitalize($t('installation')) }}: </a-col>
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
            <a-col> {{ capitalize($t('recurring payment')) }}: </a-col>
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
              v-model:value="tarification"
              default-value="Monthly"
              :style="{ display: 'grid', textAlign: 'center', gridTemplateColumns: periodColumns }"
            >
              <a-radio-button
                v-for="period of periods"
                :key="period.value"
                :value="period.value"
              >
                {{ capitalize($t(period.label || period.value)) }}
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
            {{ capitalize($t('from')) }}:
          </a-col>
          <transition name="textchange" mode="out-in">
            <a-col>
              {{ +(productFullPrice).toFixed(2) }} {{ currency.code }}
            </a-col>
          </transition>
        </a-row>

        <create-button :options="createButtonOptions">
          <template #before>
            <a-col
              v-if="
                (itemSP.type !== 'ovh' && score > 3 && password.length > 0 && !isLogged) ||
                  options.os.name && vmName && !isLogged
              "
              class="products__unregistred"
              style="margin-top: 15px; text-align: center"
            >
              {{ $t('unregistered.will be able after') }}
              <a href="#" @click.prevent="availableLogin('login')">
                {{ $t('unregistered.login') }}
              </a>.
              <br>
              <a href="#" @click.prevent="availableLogin('copy')">
                {{ $t('Copy link') }} <copy-icon />
              </a>
            </a-col>
          </template>

          <template #modalContent>
            <span v-if="score < 4 && itemSP.type !== 'ovh'" style="color: var(--err)">
              {{ $t('Password must contain uppercase letters, numbers and symbols') }}
            </span>
            <template v-else>
              {{ $t('Virtual machine will be available after paying the invoice') }}
            </template>

            <a-row v-if="score > 3" style="margin-top: 20px">
              <a-col>
                <a-checkbox v-model:checked="modal.autoRenew" />
                {{ capitalize($t('renew automatically')) }}
              </a-col>
            </a-row>
          </template>

          <template #after>
            <a-col
              v-if="itemSP.type !== 'ovh' && tarification === 'Hourly'"
              style="font-size: 14px; margin: 16px 16px 0"
            >
              <span style="position: absolute; left: -8px">*</span>
              {{ $t('Payment will be made immediately after purchase') }}
            </a-col>
          </template>
        </create-button>
      </div>

      <promo-page class="order__promo" />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { NcMap, EditorContainer } from 'nocloud-ui'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useInstancesStore } from '@/stores/instances.js'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'

import api from '@/api.js'
import notification from '@/mixins/notification.js'

import cloudResources from '@/components/cloud/create/resources.vue'
import selectsToCreate from '@/components/ui/selectsToCreate.vue'
import createButton from '@/components/cloud/create/button.vue'
import loading from '@/components/ui/loading.vue'
import promoPage from '@/components/ui/promo.vue'

const copyIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CopyOutlined')
)

export default {
  name: 'NewPaaS',
  components: {
    NcMap,
    EditorContainer,
    loading,
    createButton,
    cloudResources,
    selectsToCreate,
    promoPage,
    copyIcon
  },
  mixins: [notification],
  inject: ['checkBalance'],
  data () {
    return {
      isPlansLoading: false,
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
    ...mapState(useAuthStore, ['userdata', 'isLogged']),
    ...mapState(useCurrenciesStore, ['currencies', 'defaultCurrency', 'unloginedCurrency']),
    ...mapState(useNamespasesStore, ['namespaces']),
    ...mapState(useSpStore, { servicesProviders: 'servicesProviders', getShowcases: 'showcases' }),
    ...mapState(usePlansStore, ['plans']),
    ...mapState(useInstancesStore, { getServicesFull: 'services' }),

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
          const sp = this.servicesProviders.find(({ locations }) =>
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
      const titles = [{ title: 'all', uuid: '' }]

      this.getShowcases.forEach((showcase) => {
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

      if (sp) return this.servicesProviders.find((el) => el.uuid === sp)
      else return null
    },
    template () {
      if (this.itemSP?.type.includes('ovh')) {
        const { type = 'ovh vps' } = this.getPlan ?? {}
        const components = import.meta.glob('@/components/cloud/modules/*/createInstance.vue')
        const component = Object.keys(components).find((key) => key.includes(`/${type}/`))

        return defineAsyncComponent(() => components[component]())
      } else {
        return defineAsyncComponent(() => import('@/components/cloud/modules/ione/createInstance.vue'))
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
      const { items } = this.showcases.find(({ uuid }) => {
        if (this.showcase === '') {
          return uuid === locationItem?.showcase
        }
        return uuid === this.showcase
      }) ?? {}
      const plans = []

      if (!items) return this.plans
      items.forEach(({ servicesProvider, plan }) => {
        if (servicesProvider === this.itemSP?.uuid) {
          plans.push(plan)
        }
      })

      if (plans.length < 1) return this.plans
      return this.plans.filter(({ uuid, type }) =>
        locationItem?.type === type && plans.includes(uuid)
      )
    },
    getPlan () {
      return this.plans.find(({ uuid }) => uuid === this.plan) ?? {}
    },
    // -------------------------------------

    getProducts () {
      const isDynamic = this.getPlan.kind === 'DYNAMIC'
      const isIone = this.getPlan.type === 'ione'

      const { products } = (isDynamic && isIone)
        ? this.plans.find(({ uuid }) =>
          uuid === this.getPlan.meta?.linkedPlan
        ) ?? {}
        : this.getPlan ?? {}

      return Object.values(products ?? {})
        .filter((product) => {
          const isEqual = this.tarification === this.getTarification(product.period)

          if (!product.public) return false
          return isEqual || this.getPlan.kind === 'DYNAMIC'
        })
        .sort((a, b) => a.sorter - b.sorter)
        .map(({ title }) => title)
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
      const code = this.unloginedCurrency
      const { rate } = this.currencies.find((el) =>
        el.to === code && el.from === this.defaultCurrency
      ) ?? {}

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.from === code && el.to === this.defaultCurrency
      ) ?? { rate: 1 }

      if (!this.isLogged) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: this.userdata.currency ?? this.defaultCurrency }
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
    },
    createButtonOptions () {
      const isWeakPass = this.score < 4 && this.itemSP.type !== 'ovh'
      const options = {
        nextButton: {
          visible: this.activeKey && (
            (this.activeKey !== 'addons' && this.itemSP.type === 'ovh' && !this.getPlan.type?.includes('cloud')) ||
            (this.activeKey !== 'OS' && this.itemSP.type !== 'ovh') ||
            (this.activeKey !== 'OS' && this.getPlan.type?.includes('cloud'))
          ),
          onClick: this.nextStep
        },
        createButton: {
          disabled: true,
          onClick: () => {
            this.modal.confirmCreate = true
          }
        },
        modal: {
          title: (isWeakPass) ? 'Weak pass' : 'Confirm',
          visible: this.modal.confirmCreate,
          loading: this.modal.confirmLoading,
          okProps: { disabled: isWeakPass },
          onOk: this.handleOkOnCreateOrder,
          onCancel: () => {
            this.modal.confirmCreate = false
          }
        }
      }

      if (this.itemSP.type === 'ovh') {
        options.createButton.disabled =
          this.vmName === '' ||
          !this.namespace ||
          this.options.os.name === '' ||
          !this.isLogged
      } else {
        options.createButton.disabled =
          this.password.length === 0 ||
          this.vmName === '' ||
          !this.namespace ||
          this.options.os.name === '' ||
          !this.isLogged
      }

      return options
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
    itemSP (value, prev) {
      if (!this.dataLocalStorage.config) {
        this.options.os = { id: -1, name: '' }
      }

      if (!value?.uuid || value.uuid === prev?.uuid) return
      this.isPlansLoading = true
      this.fetchPlans({
        sp_uuid: value.uuid,
        anonymously: !this.isLogged
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
      const { min_drive_size: minSize, max_drive_size: maxSize } = value.vars

      if (minSize) {
        this.options.disk.min = minSize.value[type]
      }
      if (maxSize) {
        this.options.disk.max = maxSize.value[type]
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
      const { min_size: minSize } = this.itemSP.publicData.templates[id]

      this.options.disk.min = minSize / 1024
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
        const { $el } = this.$refs['periods-group'] ?? {}

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
    this.fetchShowcases(!this.isLogged)
    this.fetchProviders(!this.isLogged)
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

    if (this.isLogged) {
      Promise.all([
        this.fetchServices(),
        this.fetchNamespaces()
      ])
        .then(() => {
          setTimeout(this.setOneService, 300)
          setTimeout(this.setOneNameSpace, 300)
        })
    }

    if (this.currencies.length < 1) this.fetchCurrencies()

    this.$router.beforeEach((to, from, next) => {
      if (
        from.path === '/cloud/newVM' &&
        localStorage.getItem('data') &&
        this.isLogged
      ) {
        if (window.confirm(this.$t('Data will be lost'))) {
          localStorage.removeItem('data')
          next()
        } else next(false)
      } else next()
    })
  },
  methods: {
    ...mapActions(useCurrenciesStore, ['fetchCurrencies']),
    ...mapActions(useNamespasesStore, { fetchNamespaces: 'fetch' }),
    ...mapActions(useSpStore, {
      fetchProviders: 'fetch',
      fetchShowcases: 'fetchShowcases'
    }),
    ...mapActions(usePlansStore, { fetchPlans: 'fetch' }),
    ...mapActions(useInstancesStore, {
      fetchServices: 'fetch',
      updateService: 'updateService',
      createService: 'createService'
    }),

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

        this.options.config[key] = value
        return
      }
      if (typeof value === 'object') this[key] = Object.assign({}, value)
      else this[key] = value

      if (key === 'productSize') {
        const plan = (this.getPlan.kind === 'DYNAMIC' && this.getPlan.type === 'ione')
          ? this.plans.find((el) => el.uuid === this.getPlan.meta.linkedPlan)
          : this.getPlan

        if (!plan) return
        for (const [key, value] of Object.entries(plan.products ?? {})) {
          if (value.title === this.productSize) {
            const product = { ...value, key }

            this.options.ram.size = product.resources.ram / 1024
            this.options.cpu.size = product.resources.cpu
            this.options.disk.size = product.resources.disk ?? (plan.meta.minDisk ?? 20) * 1024
            this.product = product
          } else if (value.group === this.productSize) {
            this.product = { ...value, key }
          }
        }
      }

      if (key === 'type') {
        const plan = this.plans.find(({ type }) => type.includes(value))
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
      if (this.namespaces.length === 1) {
        this.namespace = this.namespaces[0].uuid
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
    handleOkOnCreateOrder () {
      // --------------------------------
      const sum = this.$refs['sum-order'].$el.firstElementChild.innerText
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
        this.fetchServices().then(() => {
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

            if (this.checkBalance(sum)) this.updateVM(orderDataNew)
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
        if (this.checkBalance(sum)) this.orderVM(orderData)
      }
    },
    orderVM (orderData) {
      this.modal.confirmLoading = true
      this.createService(orderData)
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
        .catch(async (error) => {
          const config = { namespace: this.namespace, service: orderData }
          const message = error.response?.data?.message ?? error.message ?? error

          const { result, errors } = await api.services.testConfig(config)

          if (!result) {
            errors.forEach(({ error }) => {
              this.openNotificationWithIcon('error', { message: error })
            })
          }

          this.openNotificationWithIcon('error', { message: this.$t(message) })
        })
        .finally(() => {
          this.modal.confirmLoading = false
        })
    },
    updateVM (orderDataNew) {
      this.modal.confirmLoading = true
      this.updateService(orderDataNew)
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
        .catch(async (error) => {
          const config = { namespace: this.namespace, service: orderDataNew }
          const message = error.response?.data?.message ?? error.message ?? error

          const { result, errors } = await api.services.testConfig(config)

          if (!result) {
            errors.forEach(({ error }) => {
              this.openNotificationWithIcon('error', { message: error })
            })
          }

          this.openNotificationWithIcon('error', { message: this.$t(message) })
        })
        .finally(() => {
          this.modal.confirmLoading = false
        })
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
        id.includes(item?.promo?.main?.default)
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
  left: 50%;
  display: grid;
  grid-template-columns: calc(72% - 20px) 28%;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.newCloud__change-tariff {
  color: var(--main);
  cursor: pointer;
}

.order__field {
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  background-color: var(--bright_font);
  height: max-content;
}

.newCloud__calculate {
  padding: 10px 15px 10px;
  font-size: 1.1rem;
}

.field--fluid {
  width: 100%;
  padding: 10px 15px;
}

.newCloud__calculate .ant-col {
  font-size: inherit;
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
  color: var(--bright_font);
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
  background-color: var(--bright_font);
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
  background: var(--bright_font);
  border-radius: 50%;
  transition: 0.2s;
}
.newCloud__template-name {
  padding: 10px;
  word-break: break-word;
}
.newCloud__template-item.active .newCloud__template-image img {
  padding: 2px;
  background: var(--bright_font);
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
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .order__field {
    box-shadow: none;
    border-radius: 20px 20px 0 0;
  }
  .newCloud__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }
  .order__promo {
    margin-top: 20px;
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
.networkApear-enter-from,
.networkApear-leave-to {
  opacity: 0;
  height: 0;
}

.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
