<template>
  <div class="Fcloud">
    <slot name="header" />
    <div class="Fcloud__buttons">
      <div
        v-if="
          VM.state &&
            VM.state.meta.state !== 8 &&
            VM.state.meta.lcm_state !== 0
        "
        class="Fcloud__button"
        :class="{
          disabled: statusVM.shutdown,
        }"
        @click="openModal('shutdown')"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Power off") }}
        </div>
        <a-modal
          v-model:open="modal.shutdown"
          :title="$t('cloud_Shutdown_modal')"
          @ok="handleOk('shutdown')"
        >
          <p>{{ $t("cloud_Shutdown_invite") }}</p>
          <a-radio-group
            v-model:value="option.shutdown"
            name="shutdownOption"
            :default-value="1"
          >
            <a-radio :value="0" :style="{ 'margin-bottom': '10px' }">
              <a-tag color="green" :style="{ margin: '0 2px 0 0' }">
                {{ $t('cloud_Regular') }}
              </a-tag>
              {{ $t('cloud_Shutdown') }}
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
      <div
        v-else
        class="Fcloud__button"
        :class="{
          disabled: statusVM && statusVM.start,
        }"
        @click="sendAction('resume')"
      >
        <div class="Fcloud__BTN-icon">
          <caret-right-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Start") }}
        </div>
      </div>
      <div
        class="Fcloud__button"
        :class="{
          disabled: statusVM && statusVM.reboot,
          btn_disabled_wiggle: true,
        }"
        @click="openModal('reboot')"
      >
        <div class="Fcloud__BTN-icon">
          <redo-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Reboot") }}
        </div>
        <a-modal
          v-model:open="modal.reboot"
          :title="$t('cloud_Reboot_modal')"
          @ok="handleOk('reboot')"
        >
          <p>{{ $t("cloud_Reboot_invite") }}</p>
          <a-radio-group
            v-model:value="option.reboot"
            name="rebootOption"
            :default-value="1"
          >
            <a-radio :value="0">
              <a-tag color="green">
                {{ $t("cloud_Regular") }}
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red">
                HARD
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
      <div
        class="Fcloud__button"
        :class="{
          disabled: statusVM && statusVM.recover,
        }"
        @click="openModal('recover')"
      >
        <div class="Fcloud__BTN-icon">
          <backward-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Recover") }}
        </div>
        <a-modal
          v-model:open="modal.recover"
          :title="$t('cloud_Recover_modal')"
          @ok="handleOk('recover')"
        >
          <p>{{ $t("cloud_Recover_invite_line1") }}</p>
          <p>{{ $t("cloud_Recover_invite_line2") }}</p>
          <p>{{ $t("cloud_Recover_invite_line3") }}</p>
          <p>{{ $t("cloud_Recover_invite") }}</p>
          <a-radio-group
            v-model:value="option.recover"
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
      <div
        v-if="VM.state && VM.state.meta.networking"
        class="Fcloud__info-block block"
      >
        <div class="Fcloud__block-header">
          <flag-icon /> IP
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column" style="flex-direction: row">
            <div
              v-if="dataSP" class="block__value" style="font-size: 18px"
            >
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in VM.state?.meta.networking.public" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="dataSP" class="block__value" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in VM.state?.meta.networking.private" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <env-icon /> {{ $t("Location") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div
              v-if="dataSP"
              class="block__value"
              style="font-size: 18px"
            >
              {{ dataSP.locations[0].title }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <info-icon /> {{ capitalize($t("info")) }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              OS
            </div>
            <div class="block__value">
              {{ OSName || $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.product" class="block__column">
            <div class="block__title">
              {{ $t('Product') }}
            </div>
            <div class="block__value">
              {{ productName || $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.data.next_payment_date" class="block__column">
            <div class="block__title">
              {{ capitalize($t("userService.next payment date")) }}
            </div>
            <div class="block__value">
              {{ new Intl.DateTimeFormat().format(VM.data.next_payment_date * 1000) }}
              <sync-icon title="Renew" @click="isVisible = !isVisible" />
            </div>
          </div>

          <div class="block__column">
            <div class="block__title">
              {{ capitalize($t('userService.auto renew')) }}
            </div>
            <div class="block__value">
              {{ VM.config.auto_renew ? $t('enabled') : $t('disabled') }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <card-icon /> {{ capitalize($t("prices")) }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <template v-if="tariffPrice">
            <div class="block__column block__column_table">
              <div class="block__title">
                {{ capitalize($t('tariff')) }}
              </div>
            </div>
            <div class="block__column block__column_table block__column_price">
              <div class="block__title">
                {{ productName || $t('No Data') }}:
              </div>
              <div class="block__value">
                {{ +tariffPrice.toFixed(2) }} {{ currency.code }}
              </div>
            </div>
          </template>

          <div class="block__column block__column_table">
            <div class="block__title">
              {{ $t('Addons') }}
            </div>
          </div>
          <div
            v-for="(price, addon) in addonsPrice"
            :key="addon"
            class="block__column block__column_table block__column_price"
          >
            <div class="block__title">
              {{ capitalize(addon) }}:
            </div>
            <div class="block__value">
              {{ +price.toFixed(2) }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table block__column_total">
            <div class="block__title">
              {{ $t('Total') }}:
            </div>
            <div class="block__value">
              {{ +fullPrice.toFixed(2) }} {{ currency.code }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <setting-icon /> {{ capitalize($t("cloud_system")) }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              CPU
            </div>
            <div class="block__value">
              {{ VM.resources && VM.resources.cpu }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Memory") }}
            </div>
            <div class="block__value">
              {{ VM.resources && VM.resources.ram / 1024 }} GB
            </div>
          </div>
        </div>
      </div>
      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <database-icon /> {{ $t("cloud_Storage") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Type") }}
            </div>
            <div class="block__value">
              {{ VM.resources && VM.resources.drive_type }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Size") }}
            </div>
            <div class="block__value">
              {{ mbToGb(VM.resources && VM.resources.drive_size) }} GB
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
        class="Fcloud__info-block block"
      >
        <div class="Fcloud__block-header">
          <apartment-icon /> {{ $t("Network") }}
        </div>
        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              {{ capitalize($t("inbound")) }}
            </div>
            <div class="block__value">
              {{
                printWidthRange(chart1Data[chart1Data.length - 1][1])
              }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ capitalize($t("outgoing")) }}
            </div>
            <div class="block__value">
              {{
                printWidthRange(chart2Data[chart2Data.length - 1][1])
              }}
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
        class="Fcloud__info-block block"
      >
        <div class="Fcloud__block-header">
          <line-chart-icon /> {{ capitalize($t("graphs")) }}
        </div>
        <div
          class="Fcloud__block-content Fcloud__block-content--charts"
        >
          <a-row type="flex" justify="space-around" style="width: 100%">
            <a-col>
              <g-chart
                type="LineChart"
                :data="inbChartDataReady"
                :options="chartOption('inbound')"
              />
            </a-col>
            <a-col>
              <g-chart
                type="LineChart"
                :data="outChartDataReady"
                :options="chartOption('outgoing')"
              />
            </a-col>
            <a-col>
              <g-chart
                type="LineChart"
                :data="cpuChartDataReady"
                :options="chartOption('cpu')"
              />
            </a-col>
            <a-col>
              <g-chart
                type="LineChart"
                :data="ramChartDataReady"
                :options="chartOption('ram')"
              />
            </a-col>
          </a-row>
        </div>
      </div>

      <a-row v-if="VM.state" :gutter="[15, 15]" style="margin-top: 20px">
        <a-col :span="24" :md="12">
          <a-button
            type="primary"
            shape="round"
            block
            size="large"
            :disabled="VM.data.lock"
            @click="openModal('snapshot')"
          >
            {{ $t("Snapshots") }}
          </a-button>
          <a-modal
            v-model:open="snapshots.modal"
            :title="$t('Snapshots')"
            :footer="null"
          >
            <div
              v-for="(item, index) in VM.state.meta.snapshots"
              :key="item.name"
              style="display: flex; align-items: center; margin-bottom: 10px"
            >
              <a-col style="width: 100%">
                <div style="display: flex; font-size: 16px">
                  <div style="margin-right: 30px; width: 30%">
                    {{ item.name }}
                  </div>
                  <div style="width: 70%">
                    {{ dateFormat(item.ts * 1000) }}
                  </div>
                </div>
              </a-col>
              <a-col style="margin-left: auto; display: flex">
                <a-button
                  type="primary"
                  style="margin-right: 10px"
                  :loading="snapshots.addSnap.loading"
                  @click="revSnapshot(index)"
                >
                  <caret-right-icon />
                </a-button>
                <a-button
                  danger
                  :loading="snapshots.loading"
                  @click="deleteSnapshot(index)"
                >
                  <close-icon />
                </a-button>
              </a-col>
            </div>

            <div class="modal__buttons">
              <a-button
                type="primary"
                shape="round"
                size="large"
                @click="openModal('createSnapshot')"
              >
                + {{ $t("Take snapshot") }}
              </a-button>
            </div>
            <a-modal
              v-model:open="snapshots.addSnap.modal"
              :footer="null"
              :title="$t('Create snapshot')"
            >
              <p>{{ $t("You can only have 3 snapshots at a time.") }}</p>
              <p>{{ $t("Each snapshot exists for 24 hours and is then deleted.") }}</p>
              <p>{{ $t("Choose a name for the new snapshot:") }}</p>
              <a-input
                ref="snapNameInput"
                v-model:value="snapshots.addSnap.snapname"
                :placeholder="$t('Snapshot name')"
              />

              <div class="modal__buttons">
                <a-button
                  shape="round"
                  :style="{ 'margin-right': '10px' }"
                  @click="snapshots.addSnap.modal = false"
                >
                  {{ $t("Cancel") }}
                </a-button>
                <a-button
                  type="primary"
                  shape="round"
                  :disabled="snapshots.addSnap.snapname.length < 1"
                  :loading="snapshots.addSnap.loading"
                  @click="createSnapshot()"
                >
                  + {{ $t("Take snapshot") }}
                </a-button>
              </div>
            </a-modal>
          </a-modal>
        </a-col>

        <a-col :span="24" :md="12">
          <a-button
            block
            type="primary"
            shape="round"
            size="large"
            :disabled="!(VM.state.meta.state === 3 || VM.state.meta.lcm_state === 3) || VM.data.lock"
            @click="openVNC"
          >
            VNC
          </a-button>
        </a-col>
      </a-row>
    </div>
    <renewal-modal v-bind="renewalProps" v-model:visible="isVisible" />
  </div>
</template>

<script lang="jsx">
import { defineAsyncComponent, defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { GChart } from 'vue-google-charts'

import { useSpStore } from '@/stores/sp.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useInstancesStore } from '@/stores/instances.js'
import { usePlansStore } from '@/stores/plans.js'

import notification from '@/mixins/notification.js'
import renewalModal from '@/components/ui/renewalModal.vue'

const redoIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RedoOutlined')
)
const backwardIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/BackwardOutlined')
)

const flagIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/FlagFilled')
)
const envIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/EnvironmentOutlined')
)
const infoIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/InfoCircleOutlined')
)

const syncIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SyncOutlined')
)
const cardIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CreditCardOutlined')
)

const settingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SettingFilled')
)
const databaseIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/DatabaseFilled')
)
const apartmentIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ApartmentOutlined')
)

const lineChartIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LineChartOutlined')
)
const caretRightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CaretRightOutlined')
)
const closeIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CloseOutlined')
)

const columns = [
  {
    title: 'Name',
    key: 'Name',
    dataIndex: 'NAME'
  },
  {
    title: 'Time',
    dataIndex: 'TIME',
    key: 'Time',
    scopedSlots: { customRender: 'time' }
  },
  {
    title: 'Actions',
    key: 'Actions',
    scopedSlots: { customRender: 'actions' }
  }
]
const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

export default defineComponent({
  name: 'OpenInstance',
  components: {
    GChart,
    renewalModal,
    redoIcon,
    backwardIcon,
    flagIcon,
    envIcon,
    infoIcon,
    syncIcon,
    cardIcon,
    settingIcon,
    databaseIcon,
    apartmentIcon,
    lineChartIcon,
    caretRightIcon,
    closeIcon
  },
  mixins: [notification],
  props: {
    VM: { type: Object, required: true }
  },
  data: () => ({
    chart1Data: [['Time', '']],
    chart2Data: [['Time', '']],
    chart3Data: [['Time', '']],
    chart4Data: [['Time', '']],
    chartHead: ['Timestamp'],
    chartOptions: {
      title: 'network',
      curveType: 'function',
      legend: 'none',
      width: 300,
      height: 150,
      vAxis: {
        viewWindowMode: 'explicit',
        viewWindow: { min: 0 }
      }
    },
    modal: {
      reboot: false,
      shutdown: false,
      recover: false,
      snapshot: false
    },
    snapshots: {
      modal: false,
      loading: false,
      columns,
      data: [],
      loadingSnaps: [],
      addSnap: {
        modal: false,
        snapname: 'Snapshot',
        loading: false
      }
    },
    option: {
      reboot: 0,
      shutdown: 0,
      recover: 0
    },
    actualAction: '',
    actionLoading: false,
    selectedSP: '',
    deployLoading: false,
    isVisible: false
  }),
  computed: {
    ...mapState(useSpStore, ['servicesProviders']),
    ...mapState(useAuthStore, ['userdata', 'baseURL']),
    ...mapState(useCurrenciesStore, ['defaultCurrency']),
    ...mapState(useInstancesStore, ['services']),
    ...mapState(usePlansStore, ['plans']),
    statusVM () {
      if (!this.VM?.state) {
        return {
          start: true, shutdown: true, reboot: true, recover: true
        }
      }
      const isSuspended = this.VM.state.meta.state === 1 || this.VM.data.suspended_manually

      if (isSuspended || this.VM.data.lock || this.VM.state.state === 'PENDING') {
        return {
          start: true, shutdown: true, reboot: true, recover: true
        }
      }
      return {
        shutdown:
          (this.VM.state.meta.lcm_state === 18 &&
            this.VM.state.meta.state === 3) ||
          (this.VM.state.meta.lcm_state === 20 &&
            this.VM.state.meta.state === 3),
        reboot:
          (this.VM.state.meta.lcm_state === 18 &&
            this.VM.state.meta.state === 3) ||
          (this.VM.state.meta.lcm_state === 20 &&
            this.VM.state.meta.state === 3) ||
          (this.VM.state.meta.lcm_state === 0 &&
            this.VM.state.meta.state === 8),
        start:
          (this.VM.state.meta.lcm_state === 18 &&
            this.VM.state.meta.state === 3) ||
          (this.VM.state.meta.lcm_state === 20 &&
            this.VM.state.meta.state === 3),
        recover:
          (this.VM.state.meta.lcm_state === 18 &&
            this.VM.state.meta.state === 3) ||
          (this.VM.state.meta.lcm_state === 20 &&
            this.VM.state.meta.state === 3)
      }
    },

    tariffPrice () {
      const key = this.VM.product

      return this.VM.billingPlan.products[key]?.price ?? 0
    },
    addonsPrice () {
      return this.VM.billingPlan.resources.reduce((prev, curr) => {
        if (curr.key === `drive_${this.VM.resources.drive_type.toLowerCase()}`) {
          const key = this.$t('Drive')

          return {
            ...prev,
            [key]: +(curr.price * this.VM.resources.drive_size / 1024).toFixed(2)
          }
        } else if (curr.key === 'ram') {
          const key = this.$t('ram')

          return {
            ...prev,
            [key]: +(curr.price * this.VM.resources.ram / 1024).toFixed(2)
          }
        } else if (this.VM.resources[curr.key]) {
          const key = this.$t(curr.key.replace('_', ' '))

          return {
            ...prev,
            [key]: +(curr.price * this.VM.resources[curr.key]).toFixed(2)
          }
        }
        return prev
      }, {})
    },
    fullPrice () {
      return this.tariffPrice + Object.values(this.addonsPrice)
        .reduce((sum, curr) => sum + curr, 0)
    },
    currency () {
      return { code: this.userdata.currency ?? this.defaultCurrency }
    },
    renewalProps () {
      const { period } = this.VM.billingPlan.products[this.VM.product]
      const currentPeriod = this.date(this.VM.data.next_payment_date)
      const newPeriod = this.date(this.VM.data.next_payment_date + +period)

      return {
        title: this.VM.title,
        currentPeriod,
        newPeriod,
        price: this.tariffPrice,
        addonsPrice: this.addonsPrice,
        currentAutoRenew: this.VM.config.auto_renew,
        blocked: this.VM.data.blocked
      }
    },

    inbChartDataReady () {
      let data = this.chart1Data
      if (data === undefined) {
        console.error("can't get chart1")
        return [[0], [0]]
      }
      if (data[0] === undefined || data[1] === undefined) {
        return [
          [this.chartHead[0], 'bytes'],
          [0, 0]
        ]
      }
      const range = this.checkRange(data[data.length - 1][1])
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range)
      ])
      data.unshift([this.chartHead[0], range])
      return data
    },
    outChartDataReady () {
      let data = this.chart2Data
      if (data === undefined) {
        console.error("can't get chart2")
        return [[0], [0]]
      }
      if (data[0] === undefined || data[1] === undefined) {
        return [
          [this.chartHead[0], 'bytes'],
          [0, 0]
        ]
      }
      const range = this.checkRange(data[data.length - 1][1])
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range)
      ])
      data.unshift([this.chartHead[0], range])
      return data
    },
    cpuChartDataReady () {
      let data = this.chart3Data
      if (data === undefined) {
        console.error("can't get chart3")
        return [[0], [0]]
      }
      if (data[0] === undefined || data[1] === undefined) {
        return [
          [this.chartHead[0], '%'],
          [0, 0]
        ]
      }
      data = data.map((pair) => [new Date(pair[0] * 1000), parseInt(pair[1])])
      data.unshift([this.chartHead[0], 'usage'])
      return data
    },
    ramChartDataReady () {
      let data = this.chart4Data
      if (data === undefined) {
        console.error("can't get chart4")
        return [[0], [0]]
      }
      if (data[0] === undefined || data[1] === undefined) {
        return [
          [this.chartHead[0], 'mb'],
          [0, 0]
        ]
      }
      const range = this.checkRange(data[data.length - 1][1])
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range)
      ])
      data.unshift([this.chartHead[0], range])
      return data
    },

    dataSP () {
      return this.servicesProviders.find((el) => el.uuid === this.VM.sp)
    },
    OSName () {
      const i = this.VM?.config?.template_id

      return this.dataSP?.publicData.templates[i]?.name
    },
    productName () {
      const key = this.VM.product
      const plan = this.plans.find(({ products }) => products[key])

      return plan?.products[key]?.title ?? key
    }
  },
  watch: {
    'VM.uuidService' () { this.fetchMonitoring() }
  },
  created () {
    this.fetchPlans({ anonymously: false, sp_uuid: this.VM.sp })
    this.fetchMonitoring()
  },
  methods: {
    ...mapActions(usePlansStore, { fetchPlans: 'fetch' }),
    ...mapActions(useInstancesStore, ['invokeAction', 'updateService']),
    deployService () {
      this.actionLoading = true
      this.$api.services
        .up(this.VM.uuidService)
        .then(() => {
          const opts = {
            message: 'Done!'
          }
          this.openNotificationWithIcon('success', opts)
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.actionLoading = false
        })
    },
    mbToGb (mb) {
      return (mb / 1024).toFixed(1)
    },
    openVNC () {
      this.$router.push({ name: 'VNC', params: { uuid: this.$route.params.uuid } })
    },
    handleOk (from) {
      this.VM.state.meta.state = 0

      switch (from) {
        case 'reboot':
          this.sendAction('reboot')
          this.modal.reboot = false
          break
        case 'shutdown':
          if (this.option.shutdown) {
            this.sendAction('poweroffHard')
          } else {
            this.sendAction('poweroff')
          }
          this.modal.shutdown = false
          break
        case 'recover':
          this.$confirm({
            title: this.$t('Do you want to download a backup?'),
            maskClosable: true,
            content: this.$t('All unsaved progress will be lost, are you sure?'),
            okText: this.$t('Yes'),
            cancelText: this.$t('Cancel'),
            onOk: () => {
              if (this.option.recover) {
                this.sendAction('recoverToday')
              } else {
                this.sendAction('recoverYesterday')
              }
              this.modal.recover = false
            },
            onCancel () {}
          })
          break
      }
    },
    printWidthRange (value) {
      const range = this.checkRange(value)
      let newVal = this.fromBytesTo(value, range)
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000
      }
      return `${newVal} ${range}`
    },
    createSnapshot () {
      // if (this.snapshots.data.lenght >= 3) {
      //   this.$error({
      //     title: this.$t("You can't have more than 3 snaps at the same time"),
      //     content: this.$t("remove or commit old ones to create new"),
      //   });
      // }

      const data = {
        uuid: this.VM.uuid,
        params: { snap_name: this.snapshots.addSnap.snapname },
        action: 'snapcreate'
      }

      this.snapshots.addSnap.loading = true
      this.invokeAction(data)
        .then((res) => {
          this.VM.state.meta.snapshots = res?.meta.snapshots
          this.openNotificationWithIcon('success', {
            message: this.$t('Create snapshot')
          })
          this.snapshots.addSnap.modal = false
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.snapshots.addSnap.loading = false
        })
    },
    deleteSnapshot (index) {
      const data = {
        uuid: this.VM.uuid,
        params: { snap_id: +index },
        action: 'snapdelete'
      }

      this.snapshots.loading = true
      this.invokeAction(data)
        .then(() => {
          delete this.VM.state.meta.snapshots[index]
          this.openNotificationWithIcon('success', {
            message: this.$t('Delete snapshot')
          })
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.snapshots.loading = false
        })
    },
    revSnapshot (index) {
      const data = {
        uuid: this.VM.uuid,
        params: { snap_id: +index },
        action: 'snaprevert'
      }

      this.snapshots.addSnap.loading = true
      this.invokeAction(data)
        .then(() => {
          this.openNotificationWithIcon('success', {
            message: this.$t('Revert snapshot')
          })
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.snapshots.addSnap.loading = false
        })
    },
    openModal (name) {
      switch (name) {
        case 'start':
          if (this.statusVM.start) return
          break
        case 'shutdown':
          if (this.statusVM.shutdown) return
          break
        case 'reboot':
          if (this.statusVM.reboot) return
          break
        case 'delete':
          if (this.statusVM.delete) return
          break
        case 'recover':
          if (this.statusVM.recover) return
          break
        case 'snapshot':
          this.snapshots.modal = true
          break
        case 'createSnapshot':
          this.snapshots.addSnap.modal = true
      }
      this.modal[name] = true
    },
    checkRange (val) {
      let count = 0
      for (; val > 1024; count++) {
        val = val / 1024
      }
      return sizes[count]
    },
    fromBytesTo (val, newRange) {
      let count = sizes.indexOf(newRange)
      if (count === -1) {
        console.log("can't get such range")
        return
      }
      while (count > 0) {
        val = val / 1024
        count--
      }
      return val
    },
    chartOption (title) {
      const newOpt = JSON.parse(JSON.stringify(this.chartOptions))
      let range = ''
      let capitalized = ''
      if (title.toLowerCase() === 'inbound') {
        range = this.checkRange(this.chart1Data[this.chart1Data.length - 1][1])
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1)
      } else if (title.toLowerCase() === 'outgoing') {
        range = this.checkRange(this.chart2Data[this.chart2Data.length - 1][1])
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1)
      } else if (title.toLowerCase() === 'cpu') {
        range = '%'
        capitalized = this.$t(title).toUpperCase()
      } else if (title.toLowerCase() === 'ram') {
        range = this.checkRange(this.chart4Data[this.chart4Data.length - 1][1])
        capitalized = this.$t(title).toUpperCase()
      }
      newOpt.title = `${capitalized} (${range})`
      return newOpt
    },
    async sendAction (action) {
      const hard = this.option.reboot || action.includes('Hard')
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: action.replace('Hard', ''),
        params: (hard) ? { hard: true } : {}
      }

      if (action === 'recoverYesterday' || action === 'recoverToday') {
        action = action.replace('recover', '')
        this.$api.get(this.baseURL, {
          params: {
            run: 'create_ticket',
            subject: `Recover VM - ${this.VM.title}`,
            message: `1. ID: ${this.VM.uuid}\n2. Date: ${action}`,
            department: 1
          }
        })
          .then((resp) => {
            if (resp.result === 'success') {
              this.$message.success(this.$t('Ticket created successfully'))
            } else {
              throw resp
            }
          })
          .catch((err) => {
            const message = err.response?.data?.message ?? err.message ?? err

            this.openNotificationWithIcon('error', {
              message: this.$t(message)
            })
            console.error(err)
          })
        return
      }
      return this.invokeAction(data)
        .then(() => {
          const opts = {
            message: `${this.$t('Done')}!`
          }
          this.openNotificationWithIcon('success', opts)
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
    },
    fetchMonitoring () {
      if (!this.VM?.uuidService || this.VM.state.state === 'PENDING') return
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: 'monitoring'
      }

      this.invokeAction(data)
        .then((res) => {
          if (res.meta?.NETRX !== undefined) {
            this.chart1Data = res.meta.NETRX
          }
          if (res.meta?.NETTX !== undefined) {
            this.chart2Data = res.meta.NETTX
          }
          if (res.meta?.CPU !== undefined) {
            this.chart3Data = res.meta.CPU
          }
          if (res.meta?.MEMORY !== undefined) {
            this.chart4Data = res.meta.MEMORY
          }
        })
        .catch((err) => {
          console.error(err)
          this.openNotificationWithIcon('error', {
            message: `Error: ${err.response?.data?.message ?? 'Unknown'}.`
          })
        })
    },
    date (timestamp) {
      if (timestamp < 1) return '-'

      const date = new Date(timestamp * 1000)
      const time = date.toTimeString().split(' ')[0]

      const year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()

      if (`${month}`.length < 2) month = `0${month}`
      if (`${day}`.length < 2) day = `0${day}`

      return `${day}.${month}.${year} ${time}`
    }
  }
})
</script>

<style scoped>
.block-content_table {
  position: relative;
  display: grid;
  padding: 10px 15px;
}

.block-content_table::before {
  content: '';
  position: absolute;
  bottom: 40px;
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
  background: var(--gray);
}

.block-content_table::after {
  content: "";
  position: absolute;
  top: 35px;
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
  background: var(--gray);
}

.block__column_table {
  flex-direction: row;
  justify-content: start;
  gap: 7px;
}

.block__column_price {
  grid-column: 2 / 3;
  justify-content: end;
  overflow: hidden;
}

.block__column_price .block__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.block__column_price .block__value {
  white-space: nowrap;
}

.block__column_total {
  grid-column: 1 / 3;
  justify-content: end;
  margin-top: 5px;
}

@media (max-width: 575px) {
  .block-content_table {
    justify-content: initial;
  }
}
</style>
