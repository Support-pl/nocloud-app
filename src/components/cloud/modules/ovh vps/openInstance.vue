<template>
  <div class="Fcloud">
    <slot name="header" />
    <div class="Fcloud__buttons">
      <div
        v-if="VM.state && VM.state.state !== 'STOPPED'"
        class="Fcloud__button"
        :class="{ disabled: statusVM.shutdown, }"
        @click="sendAction('poweroff')"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Power off") }}
        </div>
      </div>
      <div
        v-else
        class="Fcloud__button"
        :class="{ disabled: statusVM.start, }"
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
        class="Fcloud__button btn_disabled_wiggle"
        :class="{ disabled: statusVM.reboot }"
        @click="sendAction('reboot')"
      >
        <div class="Fcloud__BTN-icon">
          <redo-icon />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Reboot") }}
        </div>
      </div>
      <div
        class="Fcloud__button"
        :class="{ disabled: statusVM.recover }"
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
          @ok="sendRecover"
        >
          <template v-if="VM.config.addons?.find((el) => el.includes('backup'))">
            <p>{{ $t("cloud_Recover_invite_line1") }}</p>
            <p>{{ $t("cloud_Recover_invite_line2") }}</p>
            <p>{{ $t("cloud_Recover_invite_line3") }}</p>
            <p>{{ $t("cloud_Recover_invite") }}</p>

            <a-spin :tip="$t('loading')" :spinning="actionLoading">
              <a-radio-group v-model:value="option.recover" name="recover">
                <a-radio v-for="item of dates" :key="item">
                  {{ item }}
                </a-radio>
              </a-radio-group>
            </a-spin>
          </template>

          <a-button
            v-else
            type="primary"
            shape="round"
            size="large"
            :loading="actionLoading"
            @click="sendAddingAddon('backup')"
          >
            {{ $t("Add recover") }}
          </a-button>
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
                  <tr v-for="nic in networking.public" :key="nic">
                    <td>{{ nic }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="dataSP" class="block__value" style="font-size: 18px">
              <table class="Fcloud__table">
                <tbody>
                  <tr v-for="nic in networking.private" :key="nic">
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
              {{ locationTitle }}
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
              {{ osName || $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.config.planCode" class="block__column">
            <div class="block__title">
              {{ capitalize($t('tariff')) }}
            </div>
            <div class="block__value">
              {{ tariffTitle || $t('No Data') }}
              <swap-icon title="Switch tariff" @click="openModal('switch')" />
            </div>
          </div>

          <div v-if="VM.data.expiration" class="block__column">
            <div class="block__title">
              {{ capitalize($t("userService.next payment date")) }}
            </div>
            <div class="block__value">
              {{ toDate(VM.data.expiration, '.', false) }}
              <sync-icon :title="$t('renew')" @click="sendRenew" />
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

      <a-modal
        v-model:open="modal.switch"
        title="Switch tariff"
        :ok-button-props="{ props: { disabled: planCode === '' } }"
        :confirm-loading="isSwitchLoading"
        @ok="sendNewTariff"
      >
        <a-spin :tip="$t('loading')" :spinning="isPlansLoading">
          <span style="margin-right: 16px">{{ $t("Select new tariff") }}:</span>
          <a-select
            v-model:value="planCode"
            show-search
            style="width: 100%"
            :filter-option="searchTafiff"
          >
            <a-select-option v-for="(item, key) in tariffs" :key="key">
              {{ item.title }}
            </a-select-option>
          </a-select>

          <div
            v-if="planCode"
            style="
              display: grid;
              grid-template-columns: 100px 1fr;
              margin-top: 10px;
              text-align: right
            "
          >
            <span style="font-weight: 700; text-align: left">{{ $t('cpu') }}:</span>
            {{ tariffs[planCode].resources.cpu }} cores
            <span style="font-weight: 700; text-align: left">{{ $t('ram') }}:</span>
            {{ tariffs[planCode].resources.ram / 1024 }} Gb
            <span style="font-weight: 700; text-align: left">{{ $t('disk') }}:</span>
            {{ tariffs[planCode].resources.disk / 1024 }} Gb
          </div>
        </a-spin>
      </a-modal>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <card-icon /> {{ capitalize($t("prices")) }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <div class="block__column block__column_table">
            <div class="block__title">
              {{ capitalize($t('tariff')) }}
            </div>
          </div>
          <div class="block__column block__column_table block__column_price">
            <div class="block__title">
              {{ tariffTitle || $t('No Data') }}:
            </div>
            <div class="block__value">
              {{ +tariffPrice.toFixed(2) }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table">
            <div class="block__title">
              {{ $t('Addons') }}
            </div>
          </div>
          <template v-if="Object.keys(addonsPrice).length > 0">
            <div
              v-for="(price, addon) in addonsPrice"
              :key="addon"
              class="block__column block__column_table block__column_price"
            >
              <div class="block__title">
                {{ addon }}:
              </div>
              <div class="block__value">
                {{ +price.toFixed(2) }} {{ currency.code }}
              </div>
            </div>
          </template>
          <div v-else class="block__column" style="align-items: flex-end">
            <div class="block__value">
              0 {{ currency.code }}
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
              {{ VM.resources.cpu }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Memory") }}
            </div>
            <div class="block__value">
              {{ (VM.resources.ram / 1024).toFixed(2) }} GB
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
              {{ VM.resources.drive_type }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Size") }}
            </div>
            <div class="block__value">
              {{ (VM.resources.drive_size / 1024).toFixed(2) }} GB
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
                printWidthRange(chart1Data[chart1Data.length - 1].value)
              }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ capitalize($t("outgoing")) }}
            </div>
            <div class="block__value">
              {{
                printWidthRange(chart2Data[chart2Data.length - 1].value)
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
                    {{ dateFormat((item.ts * 1000)) }}
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
                v-if="(
                  VM.config.addons &&
                  VM.config.addons.find((el) => el.includes('snapshot'))
                )"
                type="primary"
                shape="round"
                size="large"
                @click="openModal('createSnapshot')"
              >
                + {{ $t("Take snapshot") }}
              </a-button>
              <a-button
                v-else
                type="primary"
                shape="round"
                size="large"
                :loading="actionLoading"
                @click="sendAddingAddon('snapshot')"
              >
                {{ $t("Add snapshot") }}
              </a-button>
            </div>
            <a-modal
              v-model:open="snapshots.addSnap.modal"
              :footer="null"
              :title="$t('Create snapshot')"
            >
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
                  @click="createSnapshot"
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
            :disabled="VM.state.state !== 'RUNNING' || VM.data.lock"
          >
            <router-link :to="{ path: `${$route.params.uuid}/vnc` }">
              VNC
            </router-link>
          </a-button>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="jsx">
import { defineAsyncComponent, defineComponent } from 'vue'
import { Button, Modal, Switch } from 'ant-design-vue'
import { mapState, mapActions } from 'pinia'
import { GChart } from 'vue-google-charts'
import notification from '@/mixins/notification.js'
import { createRenewInvoice, toDate } from '@/functions.js'

import { useSpStore } from '@/stores/sp.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useInstancesStore } from '@/stores/instances.js'
import { usePlansStore } from '@/stores/plans.js'

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
  () => import('@ant-design/icons-vue/EnvironmentFilled')
)
const infoIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/InfoCircleOutlined')
)

const swapIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SwapOutlined')
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
    redoIcon,
    backwardIcon,
    flagIcon,
    envIcon,
    infoIcon,
    swapIcon,
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
      snapshot: false,
      switch: false
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

    dates: [],
    planCode: '',
    actionLoading: false,
    isSwitchLoading: false,
    isLoading: false,
    autoRenew: false
  }),
  computed: {
    ...mapState(usePlansStore, { plans: 'plans', isPlansLoading: 'isLoading' }),
    ...mapState(useSpStore, ['servicesProviders']),
    ...mapState(useAuthStore, ['userdata', 'baseURL']),
    ...mapState(useCurrenciesStore, ['defaultCurrency']),
    ...mapState(useInstancesStore, ['services']),
    statusVM () {
      if (!this.VM) return
      const isPending = ['PENDING', 'OPERATION'].includes(this.VM.state.state)
      const isSuspended = this.VM.state.state === 'SUSPENDED' || this.VM.data.suspended_manually

      if (isPending || isSuspended || this.VM.data.lock) {
        return { shutdown: true, reboot: true, start: true, recover: true }
      }

      return {
        shutdown: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        reboot: this.VM.state.meta.state === 'BUILD' ||
          this.VM.state.state === 'STOPPED',
        start: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED',
        recover: this.VM.state.state !== 'RUNNING' &&
          this.VM.state.state !== 'STOPPED'
      }
    },

    dataSP () {
      return this.servicesProviders.find((el) => el.uuid === this.VM.sp)
    },
    osName () {
      const type = this.VM.billingPlan.type.split(' ')[1]

      return this.VM.config.configuration[`${type}_os`]
    },
    locationTitle () {
      if (!this.VM?.config.configuration) return this.dataSP.title
      const type = this.VM.billingPlan.type.split(' ')[1]
      const region = this.VM.config.configuration[`${type}_datacenter`]
      const locationItem = this.dataSP.locations.find((el) => el.extra.region === region)

      return locationItem?.title ?? this.$t('No Data')
    },
    tariffTitle () {
      const key = `${this.VM.config.duration} ${this.VM.config.planCode}`

      return this.VM.billingPlan.products[key]?.title
    },
    tariffPrice () {
      const key = `${this.VM.config.duration} ${this.VM.config.planCode}`

      return this.VM.billingPlan.products[key]?.price ?? 0
    },
    addonsPrice () {
      return this.VM.config.addons.reduce((res, addon) => {
        const { price } = this.VM.billingPlan.resources.find(
          ({ key }) => key === `${this.VM.config.duration} ${addon}`
        )
        let key = ''

        if (addon.includes('additional')) key = this.$t('adds drive')
        if (addon.includes('snapshot')) key = this.$t('Snapshot')
        if (addon.includes('backup')) key = this.$t('Backup')
        if (addon.includes('windows')) key = this.$t('Windows')

        return { ...res, [key]: +price }
      }, {})
    },
    fullPrice () {
      return this.tariffPrice + Object.values(this.addonsPrice)
        .reduce((sum, curr) => sum + curr, 0)
    },
    currency () {
      return { code: this.userdata.currency ?? this.defaultCurrency }
    },

    tariffs () {
      if (!this.VM?.billingPlan) return {}
      const tariffs = {}
      const { products } = this.plans.find(({ uuid }) => uuid === this.VM.billingPlan.uuid) ?? {}
      const productKey = this.VM.product ?? `${this.VM.config.duration} ${this.VM.config.planCode}`

      Object.keys(products).forEach((key) => {
        const [a, b] = [products[productKey], products[key]]
        const isPriceMore = a.price <= b.price
        const isPeriodsEqual = a.period === b.period

        if (productKey === key) return
        if (isPriceMore && isPeriodsEqual) {
          tariffs[key] = products[key]
        }
      })

      return tariffs
    },
    networking () {
      const { networking } = this.VM?.state?.meta

      if (!networking) return { public: [], private: [] }
      const regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/

      const publicIPs = networking.public?.filter((el) => !regexp.test(el))
      const privateIPs = networking.private?.filter((el) => !regexp.test(el))

      return { public: publicIPs ?? [], private: privateIPs ?? [] }
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
      const range = this.checkRange(data[data.length - 1].value)
      data = data.map((pair) => [
        new Date(pair.timestamp * 1000),
        this.fromBytesTo(parseInt(pair.value), range)
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
      const range = this.checkRange(data[data.length - 1].value)
      data = data.map((pair) => [
        new Date(pair.timestamp * 1000),
        this.fromBytesTo(parseInt(pair.value), range)
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
      data = data.map((pair) => [new Date(pair.timestamp * 1000), parseInt(pair.value)])
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
      const range = this.checkRange(data[data.length - 1].value * 1048576)
      data = data.map((pair) => [
        new Date(pair.timestamp * 1000),
        this.fromBytesTo(parseInt(pair.value * 1048576), range)
      ])
      data.unshift([this.chartHead[0], range])
      return data
    }
  },
  watch: {
    'VM.uuidService' () { this.fetchMonitoring() }
  },
  created () {
    this.fetchMonitoring()
    this.fetchPlans({ sp_uuid: this.VM.sp, anonymously: false })
  },
  mounted () { this.autoRenew = this.VM.config.auto_renew },
  methods: {
    ...mapActions(useInstancesStore, ['invokeAction', 'updateService']),
    ...mapActions(usePlansStore, { fetchPlans: 'fetch' }),
    createRenewInvoice,
    toDate,
    searchTafiff (string, option) {
      const title = this.tariffs[option.key].title.toLowerCase()

      return title.includes(string.toLowerCase())
    },
    deployService () {
      this.actionLoading = true
      this.$api.services
        .up(this.VM.uuidService)
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
        .finally(() => {
          this.actionLoading = false
        })
    },
    printWidthRange (value) {
      const range = this.checkRange(value)
      let newVal = this.fromBytesTo(value, range)
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000
      }
      return `${newVal || ''} ${range}`
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
        range = this.checkRange(this.chart1Data[this.chart1Data.length - 1].value)
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1)
      } else if (title.toLowerCase() === 'outgoing') {
        range = this.checkRange(this.chart2Data[this.chart2Data.length - 1].value)
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1)
      } else if (title.toLowerCase() === 'cpu') {
        range = '%'
        capitalized = this.$t(title).toUpperCase()
      } else if (title.toLowerCase() === 'ram') {
        range = this.checkRange(this.chart4Data[this.chart4Data.length - 1].value * 1048576)
        capitalized = this.$t(title).toUpperCase()
      }
      newOpt.title = `${capitalized} (${range})`
      return newOpt
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
        action: 'snap_create'
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
        action: 'snap_delete'
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
        action: 'snap_revert'
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
          this.actionLoading = true
          this.invokeAction({
            uuid: this.VM.uuid,
            uuidService: this.VM.uuidService,
            action: 'backup_restore_points'
          })
            .then(({ meta }) => {
              this.dates = meta.restorePoints
            })
            .finally(() => {
              this.actionLoading = false
            })
          break
        case 'snapshot':
          this.snapshots.modal = true
          break
        case 'createSnapshot':
          this.snapshots.addSnap.modal = true
      }
      this.modal[name] = true
    },
    sendRecover () {
      this.$confirm({
        title: this.$t('Do you want to download a backup?'),
        maskClosable: true,
        content: this.$t('All unsaved progress will be lost, are you sure?'),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        onOk: () => {
          this.sendAction('recover')
          this.modal.recover = false
        },
        onCancel () {}
      })
    },
    sendRenew () {
      const key = `${this.VM.config.duration} ${this.VM.config.planCode}`
      const { period } = this.VM.billingPlan.products[key]
      const currentPeriod = this.toDate(this.VM.data.expiration)
      const newPeriod = this.toDate(this.VM.data.expiration + +period)

      this.$confirm({
        title: this.$t('Do you want to renew server?'),
        content: () => (
          <div>
            <div style="font-weight: 700">{ `${this.VM.title}` }</div>
            <div>
              { `${this.$t('from')} ` }
              <span style="font-style: italic">{ `${currentPeriod}` }</span>
            </div>
            <div>
              { `${this.$t('to')} ` }
              <span style="font-style: italic">{ `${newPeriod}` }</span>
            </div>

            <div style="margin-top: 10px">
              <span style="line-height: 1.7">{ this.$t('Automatic renewal') }: </span>
              <Switch
                size="small"
                loading={ this.isLoading }
                checked={ this.autoRenew }
                onChange={ (value) => { this.autoRenew = value } }
              />
              { (this.VM.config.auto_renew !== this.autoRenew) &&
                <Button
                  size="small"
                  type="primary"
                  style="margin-left: 5px"
                  loading={ this.isLoading }
                  onClick={ this.onClick }
                >
                  OK
                </Button>
              }
            </div>

            <div style="margin-top: 10px">
              <div>{ this.$t('Manual renewal') }:</div>
              <span style="font-weight: 700">{ this.$t('Tariff price') }: </span>
              { this.tariffPrice } { this.currency.code }
              { Object.keys(this.addonsPrice).length > 0 &&
                <div>
                  <span style="font-weight: 700">{ this.$t('Addons prices') }:</span>
                  <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
                    { Object.entries(this.addonsPrice).map(([key, value]) =>
                      <li>{ key }: { value } { this.currency.code }</li>
                    ) }
                  </ul>
                </div>
              }

              <div>
                <span style="font-weight: 700">{ this.$t('Total') }: </span>
                { this.fullPrice } { this.currency.code }
              </div>
            </div>
          </div>
        ),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        okButtonProps: { disabled: (this.VM.data.blocked) },
        onOk: () => this.renewInstance(),
        onCancel () {}
      })
    },
    async onClick () {
      const service = this.services.find(({ uuid }) =>
        uuid === this.VM.uuidService
      )
      const instance = service.instancesGroups
        .find(({ sp }) => sp === this.VM.sp).instances
        .find(({ uuid }) => uuid === this.VM.uuid)

      try {
        this.isLoading = true
        instance.config.auto_renew = this.autoRenew
        await this.updateService(service)

        Modal.destroyAll()
        this.openNotificationWithIcon('success', { message: this.$t('Done') })
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.openNotificationWithIcon('error', { message })
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },
    async renewInstance () {
      try {
        await this.createRenewInvoice(this.VM, this.baseURL)

        this.openNotificationWithIcon('success', { message: this.$t('Done') })
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.openNotificationWithIcon('error', { message: this.$t(message) })
      }
    },
    sendNewTariff () {
      const service = this.services.find(({ uuid }) =>
        uuid === this.VM.uuidService
      )
      const instance = service.instancesGroups
        .find(({ sp }) => sp === this.VM.sp).instances
        .find(({ uuid }) => uuid === this.VM.uuid)

      try {
        this.isSwitchLoading = true
        const { price, resources } = this.tariffs[this.planCode]

        instance.config.planCode = this.planCode.split(' ')[1]
        instance.product = this.planCode
        instance.resources = { ...instance.resources, ...resources }

        this.$confirm({
          title: this.$t('Do you want to switch tariff?'),
          content: `${this.$t('invoice_Price')}: ${price} ${this.currency.code}`,
          okText: this.$t('Yes'),
          cancelText: this.$t('Cancel'),
          onOk: async () => {
            await this.updateService(service)
            await this.fetch()

            Modal.destroyAll()
            this.modal.switch = false
            this.openNotificationWithIcon('success', { message: this.$t('Done') })
          },
          onCancel () {}
        })
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.openNotificationWithIcon('error', { message })
        console.error(error)
      } finally {
        this.isSwitchLoading = false
      }
    },
    sendAddingAddon (action) {
      this.$confirm({
        title: this.$t(`Do you want to add an ${action}?`),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        onOk: () => {
          const key = `${this.VM.config.duration} ${this.VM.config.planCode}`
          const planCode = this.VM.billingPlan.products[key].meta.addons
            .find((addon) => addon.includes(action))
          this.actionLoading = true
          this.invokeAction({
            uuid: this.VM.uuid,
            uuidService: this.VM.uuidService,
            action: 'add_addon',
            params: { planCode }
          })
            .then(() => {
              this.openNotificationWithIcon('success', { message: 'Done!' })
            })
            .catch((err) => {
              const opts = {
                message: `Error: ${err.response?.data?.message ?? 'Unknown'}.`
              }

              if (err.response?.status >= 500) {
                opts.message = `Error: ${this.$t('Failed to load data')}`
              }
              this.openNotificationWithIcon('error', opts)
              console.error(err)
            })
            .finally(() => {
              this.actionLoading = false
            })
        },
        onCancel () {}
      })
    },
    async sendAction (action) {
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action
      }

      if (action === 'recover') {
        data.action = 'backup_restore'
        data.params = { type: 'full', restorePoint: this.option.recover }
      }
      if (action === 'get_upgrade_price') {
        data.params = { newPlanCode: this.planCode }
      }

      return this.invokeAction(data)
        .then((res) => {
          this.openNotificationWithIcon('success', { message: 'Done!' })

          return res
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
          }

          if (err.response?.status >= 500) {
            opts.message = `Error: ${this.$t('Failed to load data')}`
          }
          this.openNotificationWithIcon('error', opts)
        })
    },
    openVNC () {
      this.invokeAction({
        uuid: this.$route.params.uuid,
        action: 'start_vnc'
      })
        .then(({ meta }) => {
          location.href = meta.url
        })
        .catch((err) => console.error(err))
    },
    fetchMonitoring () {
      if (!this.VM?.uuidService || this.VM.state.state === 'PENDING') return
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: 'monitoring',
        params: { period: 'lastday' }
      }

      this.invokeAction(data)
        .then((res) => {
          if (res.meta['net:rx'] !== undefined) {
            this.chart1Data = res.meta['net:rx'].values
          }
          if (res.meta['net:tx'] !== undefined) {
            this.chart2Data = res.meta['net:tx'].values
          }
          if (res.meta?.cpu !== undefined) {
            this.chart3Data = res.meta.cpu.values
          }
          if (res.meta?.mem !== undefined) {
            this.chart4Data = res.meta.mem.values
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          if (err.response?.status >= 500) return
          this.openNotificationWithIcon('error', { message: this.$t(message) })
          console.error(err)
        })
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
