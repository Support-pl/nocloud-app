<template>
  <ovh-creation-template
    :active-key="activeKey"
    :item-s-p="itemSP"
    :get-plan="getPlan"
    :options="options"
    :tarification="tarification"
    :vm-name="vmName"
    :password="password"
    :location-id="locationId"
    :resources="resources"
    :addons="addons"
    :set-data="setData"
    :plan="plan"
    :images="images"
    :plans="plans"
    :all-addons="allAddons"
    :addons-codes="addonsCodes"
    :price="price"
    @set-data="(value) => $emit('setData', value)"
    @change-plans="(value) => plans = value"
    @change-plan="(value) => plan = value"
    @change-type="(value) => $emit('setData', { key: 'type', value })"
  >
    <template #location>
      <slot name="location" />
    </template>
  </ovh-creation-template>
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import ovhCreationTemplate from '@/components/cloud/create/ovhTemplate.vue'

export default {
  name: 'CreateInstanceOvh',
  components: { ovhCreationTemplate },
  props: {
    getPlan: { type: Object, default: () => ({}) },
    itemSP: { type: Object, default: null },
    options: { type: Object, required: true },
    activeKey: { type: String, required: true },
    tarification: { type: String, required: true },
    locationId: { type: String, required: true },
    vmName: { type: String, required: true },
    password: { type: String, required: true }
  },
  emits: ['setData'],
  data: () => ({
    plan: '',
    images: [],
    plans: [],
    allAddons: {},
    addonsCodes: {},
    price: {},
    catalog: {}
  }),
  computed: {
    ...mapState(useAuthStore, ['isLogged']),
    resources () {
      const plans = new Set(this.plans.map(({ group }) => group))

      const ram = new Set()
      const disk = new Set()

      const filteredPlans = this.plans.filter(({ group }) => group === this.plan)

      filteredPlans.forEach(({ resources }) => {
        ram.add(resources.ram / 1024)
        disk.add(resources.disk / 1024)
      })

      return {
        plans: Array.from(plans),
        ram: Array.from(ram).sort((a, b) => a - b),
        disk: Array.from(disk).sort((a, b) => a - b)
      }
    },
    addons () {
      const addons = { backup: {}, snapshot: {}, disk: {} }

      Object.keys(addons).forEach((addon) => {
        this.getPlan.resources?.forEach(({ price, key, title }) => {
          const { value } = this.plans.find((el) => el.value === this.planKey) ?? {}

          const [duration, addonKey] = key.split(' ')
          const period = {
            price: { value: price },
            duration,
            pricingMode: (duration === 'P1Y') ? 'upfront12' : 'default'
          }

          const isInclude = this.allAddons[value]?.includes(addonKey)
          const isEqualMode = period.pricingMode === this.mode

          if (title === '') title = addonKey
          if (isInclude && key.includes(addon) && isEqualMode) {
            addons[addon][addonKey] = { periods: [period], title }
          }
        })
      })

      return addons
    },
    region () {
      const { extra, title } = this.itemSP?.locations.find(({ id, type }) =>
        this.locationId.includes(id) && type === this.getPlan?.type
      ) ?? {}

      if (!extra) return null
      return { value: extra.region, title }
    },
    mode () {
      switch (this.tarification) {
        case 'Annually':
          return 'upfront12'
        case 'Biennially':
          return 'upfront24'
        default:
          return 'default'
      }
    },
    planKey () {
      const { cpu, ram, disk } = this.options

      const values = { cpu, ram: { size: ram.size * 1024 }, disk }
      const keys = Object.keys({ cpu, ram, disk })
      const plan = this.plans.find(({ group, resources }) =>
        group === this.plan && keys.every((key) =>
          resources[key] === values[key].size
        )
      )

      return plan?.value
    }
  },
  watch: {
    tarification () { this.setData(this.planKey, false) },
    plan (value) {
      const plan = this.plans.find(({ group }) => group === value)

      this.setData(plan?.value)
      this.$emit('setData', { key: 'productSize', value })
      const products = Object.entries(this.getPlan.products ?? {}).filter(
        ([key]) => key.includes(this.planKey)
      )

      if (!products[0]) return
      const { os } = products[0][1].meta

      const changeOS = (images) => {
        this.images = images.map((el) => ({ name: el, desc: el }))
        this.images.forEach(({ name }, i, arr) => {
          if (name.toLowerCase().includes('windows')) {
            arr[i].prices = products.map(([key, { meta }]) => ({
              price: { value: meta.windows },
              duration: key.split(' ')[0],
              pricingMode: (key.split(' ')[0] === 'P1Y') ? 'upfront12' : 'default'
            }))
          }
        })
      }

      os.sort()
      this.filterImages(os)
        .then((filteredImages) => { changeOS(filteredImages) })
        .catch(() => { changeOS(os) })
    },
    'options.ram.size' (size) {
      const plan = this.plans?.find(({ value }) => value === this.planKey)

      if (plan) return
      const { resources } = this.plans?.find((el) =>
        el.group === this.plan && el.resources.ram / 1024 === size
      ) ?? {}

      this.options.disk.size = resources.disk
    },
    'options.disk.size' (size) {
      const plan = this.plans?.find(({ value }) => value === this.planKey)

      if (plan) return
      const { resources } = this.plans?.find((el) =>
        el.group === this.plan && el.resources.disk === size
      ) ?? {}

      this.options.ram.size = resources.ram / 1024
    }
  },
  created () {
    this.$emit('setData', {
      key: 'vps_datacenter',
      type: 'ovh',
      value: this.region.value.replace(/\d/g, '')
    })
  },
  methods: {
    setAddons (plans) {
      const resources = this.getPlan.resources.map(({ key }) => key.split(' ')[1])

      plans.forEach(({ planCode, addonFamilies }) => {
        this.allAddons[planCode] = addonFamilies.reduce(
          (res, { addons }) => [...res, ...addons], []
        )

        this.allAddons[planCode] = this.allAddons[planCode]
          .filter((el) => resources.includes(el))
      })
    },
    setData (planKey, changeTarifs = true) {
      const { periods, value, resources } = this.plans.find((el) => el.value === planKey) ?? {}
      if (!value) return

      const tarifs = []
      let plan = periods[0]

      this.options.cpu.size = +resources.cpu
      this.options.ram.size = resources.ram / 1024
      this.options.disk.size = +resources.disk
      this.options.drive = true

      periods.forEach((period) => {
        if (period.pricingMode === this.mode) plan = period
        switch (period.pricingMode) {
          case 'upfront12':
            tarifs.push({ value: 'Annually', label: 'annually' })
            break
          case 'upfront24':
            tarifs.push({ value: 'Biennially', label: 'biennially' })
            break
          case 'default':
            tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' })
        }
      })
      this.price = { value: plan.price.value, addons: {} }
      this.addonsCodes = {}

      if (changeTarifs) this.$emit('setData', { key: 'periods', value: tarifs })
      this.$emit('setData', { key: 'priceOVH', value: this.price })
      this.$emit('setData', { key: 'planCode', value, type: 'ovh' })
      this.$emit('setData', { key: 'duration', value: plan.duration, type: 'ovh' })
      this.$emit('setData', { key: 'pricingMode', value: plan.pricingMode, type: 'ovh' })
    },
    async filterImages (images) {
      let response = null
      if (this.catalog.plans || !this.isLogged) {
        response = { meta: { catalog: this.catalog } }
      } else {
        response = await this.$api.servicesProviders.action(
          { action: 'get_plans', uuid: this.itemSP.uuid }
        )

        this.catalog = response.meta.catalog
      }
      const { meta: { catalog } } = response
      const { configurations } = catalog.plans.find(
        ({ planCode }) => planCode === this.planKey
      )
      const os = configurations[1].values

      return images.filter((image) => os.includes(image))
    }
  }
}
</script>
