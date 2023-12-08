import { computed } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import { usePlansStore } from '@/stores/plans.js'

function useProducts (options, tarification, productSize) {
  const cloudStore = useCloudStore()
  const plansStore = usePlansStore()

  const products = computed(() =>
    (cloudStore.plan.type === 'ione') ? getIoneProducts() : getOvhProducts()
  )
  const mode = computed(() => {
    switch (tarification.value) {
      case 'Annually':
        return 'upfront12'
      case 'Biennially':
        return 'upfront24'
      case 'Hourly':
        return 'hourly'
      default:
        return 'default'
    }
  })

  const productKey = computed(() => {
    const { cpu, ram, disk } = options

    const values = { cpu, ram: { size: ram.size * 1024 }, disk }
    const keys = Object.keys({ cpu, ram, disk })
    const plan = products.value.find(({ group, resources }) =>
      group === productSize.value && keys.every((key) =>
        resources[key] === values[key].size
      )
    )

    return plan?.value
  })

  function sortProducts (products) {
    products.sort((a, b) => {
      const resA = a.value.split('-')
      const resB = b.value.split('-')

      const isCpuEqual = resB.at(-3) === resA.at(-3)
      const isRamEqual = resB.at(-2) === resA.at(-2)

      if (isCpuEqual && isRamEqual) return resA.at(-1) - resB.at(-1)
      if (isCpuEqual) return resA.at(-2) - resB.at(-2)
      return resA.at(-3) - resB.at(-3)
    })
  }

  function getTarification (timestamp) {
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
  }

  function getOvhProducts () {
    const result = []
    const keys = Object.keys(cloudStore.plan.products ?? {})

    keys.forEach((key) => {
      const { title, price, meta, resources, group } = cloudStore.plan.products[key]
      const value = key.split(' ')[1]

      const i = result.findIndex((product) => product.value === value)
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

      const config = options.config.configuration
      const datacenter = Object.keys(config).find((key) => key.includes('datacenter'))

      if (!meta.datacenter?.includes(config[datacenter])) return
      if (i === -1) {
        result.push({
          value, title, resources, group, periods: [period], addons: meta.addons
        })
      } else result[i].periods.push(period)
    })

    sortProducts(result)
    return result
  }

  function getIoneProducts () {
    const { products: productsList } = (cloudStore.plan.kind === 'DYNAMIC')
      ? plansStore.plans.find(({ uuid }) =>
        uuid === cloudStore.plan.meta?.linkedPlan
      ) ?? {}
      : cloudStore.plan ?? {}

    return Object.values(productsList ?? {})
      .filter((product) => {
        const isEqual = tarification.value === getTarification(product.period)

        if (!product.public) return false
        return isEqual || cloudStore.plan.kind === 'DYNAMIC'
      })
      .sort((a, b) => a.sorter - b.sorter)
      .map(({ title }) => title)
  }

  return { mode, products, productKey }
}

export default useProducts
