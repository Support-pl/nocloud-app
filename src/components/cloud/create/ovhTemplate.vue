<template>
  <a-collapse
    accordion
    :active-key="activeKey"
    :style="{ 'border-radius': '20px' }"
    @change="(value) => $emit('setData', { key: 'activeKey', value })"
  >
    <a-collapse-panel
      key="location"
      :header="`${$t('Location')}: ${(!itemSP) ? ' ' : ` (${region.title})`}`"
    >
      <slot name="location" />
    </a-collapse-panel>

    <a-collapse-panel
      key="plan"
      :header="`${$t('Plan')}: ${planHeader}`"
      :collapsible="(!itemSP || isFlavorsLoading) ? 'disabled' : null"
    >
      <a-spin
        v-if="isFlavorsLoading"
        style="display: block; margin: 0 auto"
        :tip="$t('loading')"
      />

      <slot v-else-if="!getPlan.type.includes('vps') && !$route.query.product" name="plan" />
      <template v-else-if="!isFlavorsLoading">
        <a-row
          v-if="!$route.query.product"
          style="margin-bottom: 15px"
          type="flex"
          align="middle"
        >
          <a-col v-if="resources.plans.length < 6 && resources.plans.length > 1" span="24">
            <a-slider
              style="margin-top: 10px"
              :marks="{ ...resources.plans }"
              :tip-formatter="null"
              :max="resources.plans.length - 1"
              :min="0"
              :value="resources.plans.indexOf(plan)"
              @change="(i) => $emit('update:plan', resources.plans[i])"
            />
          </a-col>
          <a-col v-else span="24">
            <div class="order__grid">
              <div
                v-for="provider of resources.plans"
                :key="provider"
                class="order__slider-item"
                :class="{ 'order__slider-item--active': plan === provider }"
                @click="$emit('update:plan', provider)"
              >
                {{ provider }}
              </div>
            </div>
          </a-col>
        </a-row>
        <left-icon
          v-else-if="$route.query.product"
          style="margin-bottom: 10px; font-size: 20px"
          @click="$router.go(-1)"
        />
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">CPU:</span>
          </a-col>
          <a-col class="changing__field" style="text-align: right">
            <loading-icon v-if="options.cpu.size === 'loading'" />
            <template v-else>
              {{ options.cpu.size }} {{ (isNaN(+options.cpu.size)) ? '' : 'vCPU' }}
            </template>
          </a-col>
        </a-row>
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">RAM:</span>
          </a-col>
          <a-col v-if="resources.ram.length > 1" :sm="{ span: 18, order: 0 }" :xs="{ span: 24, order: 1 }">
            <a-slider
              style="margin-top: 10px"
              :marks="{ ...resources.ram }"
              :tip-formatter="null"
              :max="resources.ram.length - 1"
              :min="0"
              :value="resources.ram.indexOf(options.ram.size)"
              @change="(i) => options.ram.size = resources.ram[i]"
              @after-change="setResource({ key: 'ram', value: options.ram.size })"
            />
          </a-col>
          <transition name="textchange" mode="out-in">
            <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
              {{ options.ram.size }} Gb
            </a-col>
          </transition>
        </a-row>
        <a-row type="flex" justify="space-between" align="middle" class="newCloud__prop">
          <a-col>
            <span style="display: inline-block; width: 70px">{{ $t("Drive") }}:</span>
          </a-col>
          <a-col v-if="resources.disk.length > 1" :sm="{ span: 18, order: 0 }" :xs="{ span: 24, order: 1 }">
            <a-slider
              style="margin-top: 10px"
              :marks="{ ...resources.disk }"
              :tip-formatter="null"
              :max="resources.disk.length - 1"
              :min="0"
              :value="resources.disk.indexOf(parseInt(diskSize))"
              @change="(i) => options.disk.size = resources.disk[i] * 1024"
              @after-change="setResource({ key: 'disk', value: options.disk.size / 1024 })"
            />
          </a-col>
          <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
            {{ diskSize }}
          </a-col>
        </a-row>
      </template>
    </a-collapse-panel>

    <!-- OS -->
    <a-collapse-panel
      key="OS"
      :collapsible="(!itemSP || isFlavorsLoading || !plan || isProductExist) ? 'disabled' : null"
      :header="osHeader"
    >
      <div v-if="images.length > 0" class="newCloud__option-field">
        <a-row>
          <a-col :xs="24" :sm="10">
            <a-form no-style autocomplete="off" layout="vertical">
              <a-form-item :label="`${capitalize($t('server name'))}:`">
                <a-input
                  :value="vmName"
                  :style="{ boxShadow: `0 0 2px 2px var(${(vmName.length > 1) ? '--main' : '--err'})` }"
                  @change="({ target: { value } }) => $emit('setData', { key: 'vmName', value })"
                />
                <div v-if="vmName.length < 2" style="line-height: 1.5; color: var(--err)">
                  {{ $t('ssl_product.field is required') }}
                </div>
              </a-form-item>

              <a-form-item v-if="false" :label="`${$t('clientinfo.password')}:`">
                <password-meter
                  :style="{
                    height: (password.length > 0) ? '10px' : '0',
                    marginTop: (password.length < 1) ? '0' : null
                  }"
                  :password="password"
                  @score="(value) => $emit('score', value)"
                />

                <a-input-password
                  class="password"
                  :value="password"
                  @change="({ target: { value } }) => $emit('setData', { key: 'password', value })"
                />
              </a-form-item>

              <a-form-item
                v-if="getPlan.type?.includes('cloud') && !options.isSSHExist"
                :label="`${$t('SSH key')}:`"
              >
                <div style="display: flex; align-items: center; gap: 10px">
                  <a-select
                    style="width: 100%"
                    :options="userdata.data?.ssh_keys"
                    :value="options.config.ssh"
                    :style="{ boxShadow: `0 0 2px 2px var(${(options.config.ssh?.length > 1) ? '--main' : '--err'})` }"
                    @change="(value) => $emit('setData', { key: 'ssh', value, type: 'ovh' })"
                  />

                  <add-ssh>
                    <template #actions="{ showModal }">
                      <plus-icon
                        style="color: var(--main); font-size: 20px; vertical-align: middle"
                        @click="showModal"
                      />
                    </template>
                  </add-ssh>
                </div>
                <div v-if="!(options.config.ssh?.length > 1)" style="line-height: 1.5; color: var(--err)">
                  {{ $t('ssl_product.field is required') }}
                </div>
              </a-form-item>
            </a-form>
          </a-col>
        </a-row>
        <div v-if="itemSP" class="newCloud__template">
          <div
            v-for="(item, index) in images"
            :key="index"
            class="newCloud__template-item"
            :class="{ active: options.os.name === item.name }"
            @click="setOS(item, index)"
          >
            <template v-if="item.warning">
              <div class="newCloud__template-image">
                <img src="/img/OS/default.png" :alt="item.desc">
              </div>
              <div class="newCloud__template-name">
                {{ item.name }}
              </div>
            </template>
            <template v-else-if="!item.name.includes('none')">
              <div class="newCloud__template-image">
                <img :src="`/img/OS/${getImageName(item.name)}.png`" :alt="item.desc" @error="onError">
              </div>
              <div class="newCloud__template-name">
                {{ item.name }} <br>
                <template v-if="item.prices">
                  ({{ osPrice(item.prices) }} {{ currency.code }})
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
      <a-alert
        v-else-if="!isFlavorsLoading"
        show-icon
        type="warning"
        :message="$t('No OS. Choose another plan')"
      />
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
    </a-collapse-panel>

    <!-- Addons -->
    <a-collapse-panel
      v-if="!getPlan.type?.includes('cloud')"
      key="addons"
      :collapsible="(!itemSP || isFlavorsLoading || !plan || isProductExist) ? 'disabled' : null"
      :header="$t('Addons') + ':'"
      :style="{ 'border-radius': '0 0 20px 20px' }"
    >
      <template v-if="!isFlavorsLoading">
        <a-row v-for="(addon, key) in addons" :key="key" class="newCloud__prop">
          <a-col span="8" :xs="6">
            {{ capitalize($t(key)) }}:
          </a-col>
          <a-col span="16" :xs="18">
            <a-select
              default-value="-1"
              style="width: 100%"
              :value="addonName(addon)"
              @change="(value) => setAddon(value, addon[value], key)"
            >
              <a-select-option value="-1">
                {{ $t('none') }}
              </a-select-option>
              <a-select-option v-for="(a, id) in addon" :key="id">
                {{ a.title }} ({{ addonPrice(a) }})
              </a-select-option>
            </a-select>
          </a-col>
        </a-row>
      </template>
      <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
    </a-collapse-panel>
  </a-collapse>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import addSsh from '@/components/ui/addSSH.vue'

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)
const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)
const plusIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/PlusOutlined')
)

export default {
  name: 'OvhCreationTemplate',
  components: { passwordMeter, addSsh, loadingIcon, leftIcon, plusIcon },
  props: {
    getPlan: { type: Object, default: () => ({}) },
    itemSP: { type: Object, default: null },
    options: { type: Object, required: true },
    activeKey: { type: String, required: true },
    tarification: { type: String, required: true },
    locationId: { type: String, required: true },
    vmName: { type: String, required: true },
    password: { type: String, required: true },

    resources: { type: Object, required: true },
    addons: { type: Object, required: true },
    setData: { type: Function, required: true },

    plan: { type: String, required: true, default: '' },
    images: { type: Array, required: true },
    products: { type: Array, required: true },
    allAddons: { type: Object, required: true },
    addonsCodes: { type: Object, required: true },
    price: { type: Object, required: true }
  },
  emits: ['setData', 'update:plan', 'score', 'update:products'],
  data: () => ({ isFlavorsLoading: false }),
  computed: {
    ...mapState(useAuthStore, ['userdata', 'isLogged']),
    ...mapState(useCurrenciesStore, ['currencies', 'defaultCurrency', 'unloginedCurrency']),
    currency () {
      const { currency: currencyCode } = this.userdata

      const code = this.unloginedCurrency
      const { rate } = this.currencies.find((el) =>
        el.to === code && el.from === this.defaultCurrency
      ) ?? {}

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.from === code && el.to === this.defaultCurrency
      ) ?? { rate: 1 }

      if (!this.isLogged) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: currencyCode ?? this.defaultCurrency }
    },
    region () {
      const { extra, title } = this.itemSP?.locations
        .find(({ id }) => this.locationId.includes(id)) ?? {}

      if (!extra) return null
      return { value: extra.region, title }
    },
    mode () {
      switch (this.tarification) {
        case 'Annually':
          return 'upfront12'
        case 'Biennially':
          return 'upfront24'
        case 'Hourly':
          return 'hourly'
        default:
          return 'default'
      }
    },
    planKey () {
      const { cpu, ram, disk } = this.options

      const values = { cpu, ram: { size: ram.size * 1024 }, disk }
      const keys = Object.keys({ cpu, ram, disk })
      const plan = this.products.find(({ group, resources }) =>
        group === this.plan && keys.every((key) =>
          resources[key] === values[key].size
        )
      )

      return plan?.value
    },
    planHeader () {
      if (this.itemSP) return this.plan && ` (${this.plan})`
      else return ' '
    },
    osHeader () {
      const { name } = this.options.os
      const osNotExist = name === '' || name.includes('none')

      return `${this.$t('os')}: ${(osNotExist) ? ' ' : ` (${name})`}`
    },
    diskSize () {
      const size = (this.options.disk.size / 1024).toFixed(1)

      return (size >= 1) ? `${size} Gb` : `${this.options.disk.size} Mb`
    },
    isProductExist () {
      return !this.$route.query.product && this.getPlan.type?.includes('dedicated')
    }
  },
  watch: {
    getPlan () { this.changePlans() },
    addons (value) {
      const data = (localStorage.getItem('data'))
        ? JSON.parse(localStorage.getItem('data'))
        : JSON.parse(this.$route.query.data ?? '{}')

      if (!data.ovhConfig) return
      if (data.ovhConfig.addons.length < 1) return

      this.options.config.addons.forEach((addon) => {
        const keys = Object.keys(value)
        const key = keys.find((el) => addon.includes(el))

        if (!value[key][addon]) return
        this.setAddon(addon, value[key][addon], key)
      })
    }
  },
  created () { this.changePlans() },
  methods: {
    setOS (item, index) {
      if (item.warning) return
      this.options.os.id = +index
      this.options.os.name = item.name

      if (item.prices) {
        this.price.addons.os = this.osPrice(item.prices)
        this.$emit('setData', { key: 'priceOVH', value: this.price })
      } else if (this.price.addons.os !== 0) {
        this.price.addons.os = 0
        this.$emit('setData', { key: 'priceOVH', value: this.price })
      }

      if (this.getPlan.type.includes('cloud')) {
        this.$emit('setData', { key: 'cloud_os', value: item.id, type: 'ovh' })
        return
      }

      const type = this.getPlan.type.split(' ')[1]
      this.$emit('setData', { key: `${type}_os`, value: item.name, type: 'ovh' })
    },
    getImageName (name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
    },
    osPrice (prices) {
      const addon = prices.find(({ pricingMode }) => pricingMode === this.mode)

      return addon?.price.value ?? 0
    },
    onError ({ target }) {
      target.src = '/img/OS/default.png'
    },
    setAddon (planCode, addon, key) {
      if (planCode === '-1') {
        delete this.price.addons[key]
        delete this.addonsCodes[key]
      } else {
        const period = addon.periods.find(({ pricingMode }) => pricingMode === this.mode)

        this.price.addons[key] = period.price.value
        this.addonsCodes[key] = planCode
      }
      const addons = Object.values(this.addonsCodes)

      this.$emit('setData', { key: 'priceOVH', value: this.price })
      this.$emit('setData', { key: 'addons', value: addons, type: 'ovh' })
    },
    addonName (addons) {
      const codes = Object.values(this.addonsCodes)
      const keys = Object.keys(addons)

      return codes.find((el) => keys.includes(el)) ?? '-1'
    },
    addonPrice ({ periods }) {
      const period = periods.find(({ pricingMode }) => pricingMode === this.mode) ??
        { price: { value: 0 } }
      const price = +(period.price.value * this.currency.rate).toFixed(2)

      return `${price} ${this.currency.code}`
    },
    setResource (value) {
      if (this.getPlan.type.includes('vps')) {
        this.setData(this.planKey)
      } else {
        this.setData(value, false)
      }
    },
    changePlans () {
      const plans = []
      const products = Object.keys(this.getPlan.products ?? {})

      products.forEach((key) => {
        const { title, price, meta, resources, group } = this.getPlan.products[key]
        const value = key.split(' ')[1]

        const i = plans.findIndex((plan) => plan.value === value)
        const period = {
          price: { value: price },
          duration: key.split(' ')[0],
          pricingMode: ''
        }

        switch (key.split(' ')[0]) {
          case 'P1H':
            period.pricingMode = 'hourly'
            break
          case 'P1Y':
            period.pricingMode = 'upfront12'
            break
          default:
            period.pricingMode = 'default'
        }

        this.allAddons[value] = meta.addons

        const config = this.options.config.configuration
        const datacenter = Object.keys(config).find((key) => key.includes('datacenter'))

        if (!meta.datacenter?.includes(config[datacenter])) return
        if (i === -1) {
          plans.push({
            value, title, resources, group, periods: [period]
          })
        } else plans[i].periods.push(period)
      })

      plans.sort((a, b) => {
        const resA = a.value.split('-')
        const resB = b.value.split('-')

        const isCpuEqual = resB.at(-3) === resA.at(-3)
        const isRamEqual = resB.at(-2) === resA.at(-2)

        if (isCpuEqual && isRamEqual) return resA.at(-1) - resB.at(-1)
        if (isCpuEqual) return resA.at(-2) - resB.at(-2)
        return resA.at(-3) - resB.at(-3)
      })
      this.$emit('update:products', plans)
      if (plans.length < 1) return

      const dataString = (localStorage.getItem('data'))
        ? localStorage.getItem('data')
        : this.$route.query.data ?? '{}'

      if (dataString.includes('productSize')) {
        const data = JSON.parse(dataString)

        this.$emit('update:plan', data.productSize)
      } else if (this.plan === '') {
        setTimeout(() => {
          this.$emit('update:plan', this.resources.plans[1] ?? this.resources.plans[0])
        })
      }
    }
  }
}
</script>

<style scoped>
.order__slider{
  display: flex;
  overflow-x: auto;
  padding-bottom: 10px;
  padding-top: 15px;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item:not(:last-child){
  margin-right: 10px;
}

.order__slider-item{
  flex-shrink: 0;
  /* border: 1px solid rgba(0, 0, 0, .15); */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover{
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active{
  background-color: var(--main);
  color: var(--bright_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
