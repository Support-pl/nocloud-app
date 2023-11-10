<template>
  <a-collapse
    accordion
    :active-key="activeKey"
    :style="{ 'border-radius': '20px' }"
    @change="(value) => $emit('setData', { key: 'activeKey', value })"
  >
    <a-collapse-panel
      key="location"
      :style="{ minHeight: panelHeight }"
      :header="`${$t('Location')}: ${(!itemSP) ? ' ' : ` (${itemSP.locations[0].title})`}`"
    >
      <slot name="location" />
    </a-collapse-panel>

    <a-collapse-panel
      key="plan"
      :header="`${$t('Plan')}: ${planHeader}`"
      :collapsible="itemSP ? null : 'disabled'"
    >
      <template v-if="getPlan && getPlan.uuid">
        <template v-for="(resource, key) in resources" :key="key">
          <a-row
            v-if="Array.isArray(resource) && resource.length > 0"
            type="flex"
            justify="space-between"
            align="middle"
          >
            <a-col>{{ $t(key) }}: ({{ prefixes[key] }})</a-col>
            <a-col :span="24" :md="20">
              <a-slider
                range
                style="margin-top: 10px"
                :marks="{ ...resource }"
                :tip-formatter="null"
                :default-value="[0, resource.length - 1]"
                :max="resource.length - 1"
                :min="0"
                @change="([i, j]) => filters[key] = [resource[i], resource[j]]"
              />
            </a-col>
          </a-row>

          <div
            v-else-if="resource === true"
            style="display: inline-flex; gap: 10px; width: 50%; margin-top: 10px"
          >
            <span style="display: inline-block">{{ capitalize($t(key)) }}:</span>

            <a-switch v-model:checked="filters[key]" size="small" />
          </div>
        </template>

        <a-divider style="margin: 10px 0" />

        <div v-if="getProducts.length > 5" class="newCloud__drive">
          <span
            style="display: inline-block"
            :style="{ gridColumn: (driveTypes.length < 2) ? '1 / 3' : null }"
          >
            {{ $t("Drive") }}:
          </span>

          <a-switch
            v-if="driveTypes.length > 1"
            v-model:checked="options.drive"
            checked-children="SSD"
            un-checked-children="HDD"
          />

          <a-slider
            style="margin-top: 10px"
            :tip-formatter="null"
            :step="options.disk.step"
            :max="options.disk.max"
            :min="options.disk.min"
            :value="parseFloat(diskSize)"
            @change="(value) => (options.disk.size = value * 1024)"
          />

          <div class="changing__field" style="text-align: right">
            <template v-if="isProductsExist">
              {{ diskSize }}
            </template>
            <template v-else>
              <a-input-number v-model:value="options.disk.size" allow-clear :min="0" :max="512 * 1024" /> Mb
            </template>
          </div>
        </div>

        <a-slider
          v-if="getProducts.length > 1 && getProducts.length < 6"
          style="margin-top: 10px"
          :marks="{ ...getProducts }"
          :tip-formatter="null"
          :max="getProducts.length - 1"
          :min="0"
          :value="getProducts.indexOf(productSize)"
          @change="(value) => $emit('setData', { key: 'productSize', value: getProducts[value] })"
        />

        <div v-else class="order__grid">
          <div
            v-for="product of filteredProducts"
            :key="product"
            class="order__grid-item"
            :class="{ 'order__grid-item--active': productSize === product }"
            @click="$emit('setData', { key: 'productSize', value: product })"
          >
            <h1>{{ product }}</h1>
            <div>
              {{ $t('cpu') }}: {{ getProduct(product)?.cpu ?? '?' }} vCPU
            </div>
            <div>
              {{ $t('ram') }}: {{ getProduct(product)?.ram / 1024 ?? '?' }} Gb
            </div>
          </div>
        </div>

        <a-row
          v-if="getProducts.length > 1 && getProducts.length < 6"
          type="flex"
          justify="space-between"
          align="middle"
          class="newCloud__prop"
          :style="{ marginTop: (!getProducts.length < 2) ? null : '50px' }"
        >
          <a-col>
            <span style="display: inline-block; width: 70px">CPU:</span>
          </a-col>
          <transition name="textchange" mode="out-in">
            <a-col class="changing__field" span="6" style="text-align: right">
              <template v-if="isProductsExist">
                {{ options.cpu.size }} vCPU
              </template>
              <template v-else>
                <a-input-number v-model:value="options.cpu.size" allow-clear :min="0" :max="32" /> Gb
              </template>
            </a-col>
          </transition>
        </a-row>

        <a-row
          v-if="getProducts.length < 6"
          type="flex"
          justify="space-between"
          align="middle"
          class="newCloud__prop"
        >
          <a-col>
            <span style="display: inline-block; width: 70px">RAM:</span>
          </a-col>
          <transition name="textchange" mode="out-in">
            <a-col class="changing__field" span="6" style="text-align: right">
              <template v-if="isProductsExist">
                {{ options.ram.size.toFixed(0) }} Gb
              </template>
              <template v-else>
                <a-input-number v-model:value="options.ram.size" allow-clear :min="0" :max="64" /> Gb
              </template>
            </a-col>
          </transition>
        </a-row>

        <div v-if="getProducts.length < 6" class="newCloud__drive">
          <span
            style="display: inline-block"
            :style="{ gridColumn: (driveTypes.length < 2) ? '1 / 3' : null }"
          >
            {{ $t("Drive") }}:
          </span>

          <a-switch
            v-if="driveTypes.length > 1"
            v-model:checked="options.drive"
            checked-children="SSD"
            un-checked-children="HDD"
          />

          <a-slider
            style="margin-top: 10px"
            :tip-formatter="null"
            :step="options.disk.step"
            :max="options.disk.max"
            :min="options.disk.min"
            :value="parseFloat(diskSize)"
            @change="(value) => (options.disk.size = value * 1024)"
          />

          <div class="changing__field" style="text-align: right">
            <template v-if="isProductsExist">
              {{ diskSize }}
            </template>
            <template v-else>
              <a-input-number v-model:value="options.disk.size" allow-clear :min="0" :max="512 * 1024" /> Mb
            </template>
          </div>
        </div>
      </template>
      <a-alert
        v-else
        show-icon
        type="warning"
        :message="$t('No linked plans. Choose another location')"
      />
    </a-collapse-panel>

    <!-- OS -->
    <a-collapse-panel
      key="OS"
      :collapsible="(!itemSP || !getPlan) ? 'disabled' : null"
      :header="`${$t('os')}: ${(options.os.name == '') ? ' ' : ` (${options.os.name})`}`"
    >
      <div class="newCloud__option-field">
        <div v-if="itemSP" class="newCloud__template">
          <div
            v-for="(item, index) in images"
            :key="index"
            class="newCloud__template-item"
            :class="{ active: options.os.name == item.name }"
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
            <template v-else>
              <div class="newCloud__template-image">
                <img :src="`/img/OS/${getImageName(item.name)}.png`" :alt="item.desc">
              </div>
              <div class="newCloud__template-name">
                {{ item.name }}
              </div>
            </template>
          </div>
        </div>
        <a-row>
          <a-col :xs="24" :sm="10">
            <a-form no-style autocomplete="off" layout="vertical">
              <a-form-item
                style="margin-top: 15px"
                class="newCloud__form-item"
                :label="`${capitalize($t('server name'))}:`"
              >
                <a-input
                  :style="{ boxShadow: (vmName.length < 2) ? '0 0 2px 2px var(--err)' : null }"
                  :value="vmName"
                  @change="({ target: { value } }) => $emit('setData', { key: 'vmName', value })"
                />
                <div v-if="vmName.length < 2" style="line-height: 1.5; color: var(--err)">
                  {{ $t('ssl_product.field is required') }}
                </div>
              </a-form-item>

              <a-form-item
                style="margin-top: 15px"
                class="newCloud__form-item"
                :label="`${capitalize($t('clientinfo.username'))}:`"
              >
                <a-input
                  :style="{ boxShadow: (username.length < 2) ? '0 0 2px 2px var(--err)' : null }"
                  :value="username"
                  @change="({ target: { value } }) => $emit('setData', { key: 'username', value })"
                />
                <div v-if="username.length < 2" style="line-height: 1.5; color: var(--err)">
                  {{ $t('ssl_product.field is required') }}
                </div>
              </a-form-item>

              <a-form-item
                v-if="userdata.uuid"
                class="newCloud__form-item"
                :label="`${$t('clientinfo.password')}:`"
              >
                <password-meter
                  :style="{
                    height: (password.length > 0) ? '10px' : '0',
                    marginTop: (password.length < 1) ? '0' : null,
                    marginBottom: (password.length > 0) ? '4px': null
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
                v-if="userdata.uuid"
                class="newCloud__form-item"
                :label="`${$t('SSH key')}:`"
              >
                <a-select
                  style="width: 100%"
                  :options="userdata.data && userdata.data.ssh_keys"
                  :value="sshKey"
                  @change="(value) => $emit('setData', { key: 'sshKey', value })"
                />
              </a-form-item>
            </a-form>
          </a-col>
        </a-row>
      </div>
    </a-collapse-panel>

    <!-- network -->
    <a-collapse-panel
      v-if="false && getPlan.kind === 'STATIC'"
      key="network"
      :header="`${$t('Network')}: ${networkHeader}`"
      :collapsible="itemSP ? null : 'disabled'"
    >
      <div class="newCloud__option-field">
        <a-row :gutter="[10, 10]">
          <a-col :sm="12" :span="24">
            <a-row :style="{ display: 'flex', alignItems: 'center' }">
              <a-col :sm="10" :span="12">
                {{ $t("Public network") }}:
              </a-col>
              <a-col :sm="12" :span="12">
                <a-switch
                  v-model:checked="options.network.public.status"
                  @change="changeNetwork('public')"
                />
                <a-input-number
                  v-model:value="options.network.public.count"
                  :min="(options.network.public.status) ? 1 : 0"
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
                {{ $t("Private network") }}:
              </a-col>
              <a-col :sm="12" :span="12">
                <a-switch
                  v-model:checked="options.network.private.status"
                  @change="changeNetwork('private')"
                />
                <a-input-number
                  v-model:value="options.network.private.count"
                  :min="(options.network.private.status) ? 1 : 0"
                  :max="10"
                  :disabled="!options.network.private.status"
                  :style="{ 'margin-left': '10px' }"
                />
              </a-col>
            </a-row>
          </a-col>
        </a-row>
      </div>
    </a-collapse-panel>
  </a-collapse>
</template>

<script>
import { mapState } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'CreateInstanceIone',
  components: { passwordMeter },
  props: {
    activeKey: { type: String, required: true },
    itemSP: { type: Object, default: null },
    plans: { type: Array, required: true },
    getPlan: { type: Object, required: true },
    options: { type: Object, required: true },
    getProducts: { type: Array, required: true },
    productSize: { type: String, required: true },
    tarification: { type: String, required: true },
    vmName: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    sshKey: { type: String, default: null }
  },
  emits: ['setData', 'score'],
  data: () => ({
    panelHeight: null,
    filters: { cpu: [], ram: [] },
    prefixes: { cpu: 'cores', ram: 'Gb' }
  }),
  computed: {
    ...mapState(useAuthStore, ['userdata', 'isLogged', 'fetchUserData']),
    isProductsExist () {
      return this.getProducts.length > 0
    },
    images () {
      const { templates } = this.itemSP.publicData
      const images = {}

      Object.entries(templates ?? {}).forEach(([key, value]) => {
        if (value.is_public !== false) {
          images[key] = value
        }
      })

      return images
    },
    resources () {
      const { highCPU, withAdministration } = this.itemSP?.vars ?? {}
      const cpu = []
      const ram = []

      if (this.getProducts.length < 6) return { cpu, ram }
      this.plans.forEach(({ products }) => {
        Object.values(products).forEach(({ resources, title }) => {
          if (!this.getProducts.includes(title)) return
          if (!cpu.includes(resources.cpu)) {
            cpu.push(resources.cpu)
          }
          if (!ram.includes(Math.round(resources.ram / 1024))) {
            ram.push(Math.round(resources.ram / 1024))
          }
        })
      })

      cpu.sort((a, b) => a - b)
      ram.sort((a, b) => a - b)

      return { cpu, ram, highCPU, withAdministration }
    },
    filteredProducts () {
      const result = []

      this.plans.forEach(({ products }) => {
        Object.values(products).forEach(({ resources, title }) => {
          if (!this.getProducts.includes(title)) return
          const byCpu = resources.cpu >= this.filters.cpu.at(0) &&
            resources.cpu <= this.filters.cpu.at(-1)

          const byRam = Math.round(resources.ram / 1024) >= this.filters.ram.at(0) &&
            Math.round(resources.ram / 1024) <= this.filters.ram.at(-1)

          if (byCpu && byRam && !result.includes(title)) result.push(title)
        })
      })

      return result
    },
    networkHeader () {
      const pub = this.options.network.public
      const priv = this.options.network.private

      if (!this.itemSP) {
        return ' '
      }
      if (pub.status && priv.status) {
        return ` (Public - ${pub.count}, Private - ${priv.count})`
      }
      if (pub.status) {
        return ` (Public - ${pub.count})`
      }
      if (priv.status) {
        return ` (Private - ${priv.count})`
      }
      return ' '
    },
    planHeader () {
      if (this.itemSP && this.getPlan) {
        return this.tarification === 'Hourly'
          ? ` (VDC ${this.$t('Pay-as-you-Go')})`
          : ` (VDS ${this.$t('Pre-Paid')})`
      } else {
        return ' '
      }
    },
    diskSize () {
      const size = (this.options.disk.size / 1024).toFixed(1)

      return (size >= 1) ? `${size} Gb` : `${this.options.disk.size} Mb`
    },
    driveTypes () {
      return this.getPlan.resources.filter(({ key }) => key.includes('drive'))
    }
  },
  watch: {
    plans () { this.changePeriods() },
    'resources.cpu' (value) {
      this.filters.cpu = [value.at(0), value.at(-1)]
    },
    'resources.ram' (value) {
      this.filters.ram = [value.at(0), value.at(-1)]
    }
  },
  created () {
    if (!this.userdata?.uuid && this.isLogged) {
      this.fetchUserData()
    }
    this.changePeriods()
  },
  beforeMount () {
    const images = Object.entries(this.itemSP?.publicData.templates ?? {})

    if (images.length === 1) this.setOS(images[0][1], images[0][0])
  },
  methods: {
    getProduct (product) {
      const products = Object.values(this.getPlan.products)

      return products.find(({ title }) => title === product)?.resources
    },
    setOS (item, index) {
      if (item.warning) {
        this.$message.warn(item.warning)
        return
      }
      this.options.os.id = +index
      this.options.os.name = item.name
    },
    getImageName (name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
    },
    changePeriods () {
      const value = []
      const types = new Set()
      const day = 3600 * 24
      const month = day * 30
      const year = day * 365

      this.plans.forEach((plan) => {
        types.add(plan.type)

        if (plan.kind === 'DYNAMIC') {
          value.push(
            { value: 'Hourly', label: 'ssl_product.Hourly' }
          )
        }

        if (plan.kind !== 'STATIC') return
        const periods = Object.values(plan.products).map((el) => +el.period)

        if (periods.includes(day)) {
          value.push(
            { value: 'Daily', label: 'daily', period: day }
          )
        }

        if (periods.includes(month)) {
          value.push(
            { value: 'Monthly', label: 'ssl_product.Monthly', period: month }
          )
        }

        if (periods.includes(year)) {
          value.push(
            { value: 'Annually', label: 'annually', period: year }
          )
        }

        if (periods.includes(year * 2)) {
          value.push(
            { value: 'Biennially', label: 'biennially', period: year * 2 }
          )
        }
      })

      if (types.size > 1) return
      value.sort((a, b) => (a.value === 'Hourly') ? 1 : a.period - b.period)

      this.options.drive = false
      this.$emit('setData', { key: 'periods', value })
    },
    changeNetwork (type) {
      switch (type) {
        case 'public':
          if (!this.options.network.public.status) {
            this.options.network.private.status = true
            this.options.network.public.count = 0
          }
          break
        case 'private':
          if (!this.options.network.private.status) {
            this.options.network.public.status = true
            this.options.network.private.count = 0
          }
          break
      }
    },
    changeMinMax (value) {
      const { max, min } = this.options.disk

      if (value === 128 && max === 128) this.options.disk.min -= 20
      if (max === value) {
        if (max >= 512) return
        this.options.disk.max += 128
        this.options.disk.min += 128
      }
      if (min === 128 && value === 128) this.options.disk.min += 20
      if (min === value) {
        if (min <= 20) return
        this.options.disk.max -= 128
        this.options.disk.min -= 128
      }
    }
  }
}
</script>

<style scoped>
.newCloud__drive {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 0;
}

.order__grid-item {
  padding: 10px 20px;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__grid-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__grid-item h1 {
  margin-bottom: 5px;
  word-break: break-all;
  color: inherit;
}

.order__grid-item--active {
  background-color: var(--main);
  color: var(--bright_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
