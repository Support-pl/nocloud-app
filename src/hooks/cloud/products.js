import { useRoute } from 'vue-router'
import { useCloudStore } from '@/stores/cloud.js'

function useProducts (options) {
  const route = useRoute()
  const cloudStore = useCloudStore()

  return {
    changePlans () {
      const plans = []
      const products = Object.keys(cloudStore.plan.products ?? {})

      products.forEach((key) => {
        const { title, price, meta, resources, group } = cloudStore.plan.products[key]
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

        const config = options.config.configuration
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
        : route.query.data ?? '{}'

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

export default useProducts
