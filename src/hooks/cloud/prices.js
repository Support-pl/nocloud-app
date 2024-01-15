import { computed } from 'vue'
import { useCloudStore } from '@/stores/cloud.js'
import { useCurrency } from '@/hooks/utils'
import { getTarification } from '@/functions.js'

function useCloudPrices (currentProduct, tarification, activeKey, options, priceOVH) {
  const cloudStore = useCloudStore()
  const { currency } = useCurrency()

  const plan = computed(() => cloudStore.plan ?? {})

  const product = computed(() => {
    if (activeKey.value !== 'location' && tarification.value !== '-') {
      return currentProduct.value
    }

    const config = options.config.configuration ?? {}
    const datacenter = Object.keys(config).find((key) => key.includes('datacenter'))
    const values = Object.values(plan.value.products ?? {})
      .filter((product) => product.public)

    values.sort((a, b) => a.price - b.price)
    const result = values.find(({ period, meta }) =>
      tarification.value === getTarification(period) && (
        meta.datacenter?.includes(config[datacenter]) || !plan.value.type.includes('ovh')
      )
    )

    if (result?.meta.cpu) result.resources.cpu = result.meta.cpu ?? 'No Data'
    if (plan.value.type !== 'ovh vps') result.resources.drive_type = 'HDD'
    else result.resources.drive_type = 'SSD'
    if (result) result.resources.drive_size = plan.value.meta?.minSize ?? 20 * 1024

    return result
  })

  const productFullPriceStatic = computed(() => {
    if (!plan.value) return 0
    const values = Object.values(plan.value.products ?? {})
      .filter((product) => product.public)
    const value = (activeKey.value !== 'location')
      ? values.find(({ title }) => title === product.value.title)
      : product.value

    if (!value) return 0
    return value.price / value.period * 3600 * 24 * 30
  })

  const productFullPriceCustom = computed(() => {
    const price = []
    for (const resource of plan.value.resources ?? []) {
      const key = resource.key.toLowerCase()

      if (key.includes('ip')) {
        const { count } = (activeKey.value !== 'location')
          ? options.network.public
          : { count: 1 }

        price.push(resource.price / resource.period * 3600 * count)
      } else if (key.includes('drive')) {
        const { size } = (activeKey.value === 'location')
          ? { size: options.disk.min * 1024 }
          : options.disk
        const type = (activeKey.value === 'location')
          ? 'hdd'
          : options.disk.type.toLowerCase()

        if (key !== `drive_${type}`) continue
        price.push(resource.price / resource.period * 3600 * (size / 1024))
      } else {
        const { size } = (activeKey.value === 'location')
          ? { size: options[key]?.min ?? 0 }
          : options[key] ?? {}

        price.push(resource.price / resource.period * 3600 * size)
      }
    }
    return price.reduce((accum, item) => accum + item, 0)
  })

  const productFullPriceOVH = computed(() => {
    const { value, addons } = priceOVH
    const addonsPrice = Object.values(addons).reduce((a, b) => a + b, 0)

    if (activeKey.value === 'location') {
      return product.value?.price ?? value
    }
    // let percent = (plan.value.fee?.default ?? 0) / 100 + 1;

    return value + addonsPrice
    // if (!plan.value.fee?.ranges) return value + addonsPrice;

    // for (let range of plan.value.fee.ranges) {
    //   if (value <= range.from) continue;
    //   if (value > range.to) continue;
    //   percent = range.factor / 100 + 1;
    // }

    // return value + addonsPrice * percent;
  })

  return {
    minProduct: computed(() => product.value ?? {}),
    productFullPrice: computed(() => {
      const resourcesPrice = (plan.value.type === 'ione')
        ? productFullPriceCustom.value * 24 * 30 * currency.value.rate
        : 0
      let price = 0
      let period = ''

      switch (tarification.value) {
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
          price = productFullPriceCustom.value
      }

      if (plan.value.type?.includes('ovh') || plan.value.type === 'keyweb') {
        period = 'hour'
        price = productFullPriceOVH.value
      } else if (plan.value.kind === 'STATIC') {
        price = productFullPriceStatic.value
      }

      price += product.value?.installationFee ?? 0
      price *= currency.value.rate

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
    })
  }
}

export default useCloudPrices
