import { computed, nextTick, ref, watch } from 'vue'

import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'
import { usePlansStore } from '@/stores/plans.js'

import { useNotification } from '@/hooks/utils'
import { getTarification } from '@/functions.js'

function useCloudPlans (tarification, options) {
  const { openNotification } = useNotification()

  const authStore = useAuthStore()
  const plansStore = usePlansStore()
  const cloudStore = useCloudStore()

  const isPlansLoading = ref(false)
  const productSize = ref('')
  const product = ref({})
  const cachedPlans = ref({})

  const filteredPlans = computed(() => {
    const locationItem = cloudStore.locations.find(({ id }) =>
      id === cloudStore.locationId
    )

    const { items } = cloudStore.showcases.find(({ uuid }) => {
      if (cloudStore.showcaseId === '') {
        return uuid === locationItem?.showcase
      }
      return uuid === cloudStore.showcaseId
    }) ?? {}
    const plans = []
    const publicPlans = plansStore.plans.filter((plan) => plan.public)

    if (!items) return publicPlans
    items.forEach(({ servicesProvider, plan }) => {
      if (servicesProvider === cloudStore.provider?.uuid) {
        plans.push(plan)
      }
    })

    if (plans.length < 1) return publicPlans
    return publicPlans.filter(({ uuid, type }) =>
      locationItem?.type === type && plans.includes(uuid)
    )
  })

  async function setProduct () {
    await nextTick()
    if (cloudStore.plan.type?.includes('cloud')) {
      const period = (options.config.monthlyBilling) ? 'P1M' : 'P1H'
      const { planCode } = options.config

      product.value = {
        ...cloudStore.plan.products[`${period} ${planCode}`],
        key: `${period} ${planCode}`
      }
    } else {
      if (!tarification.value || !productSize.value) return

      for (let plan of filteredPlans.value) {
        const isHourly = tarification.value === 'Hourly'
        const isDynamic = plan.kind === 'DYNAMIC'
        const isIone = plan.type === 'ione'
        let result = false
        let uuid = null

        if (isDynamic && isIone && isHourly) {
          uuid = plan.uuid
          plan = plansStore.plans.find(({ uuid }) => uuid === plan.meta.linkedPlan)
        }

        for (const [key, item] of Object.entries(plan.products)) {
          const { period, title } = item
          const isEqualKey = (plan.type.includes('ovh'))
            ? key.split(' ').at(-1) === options.config.planCode
            : true

          const isEqualSize = title === productSize.value
          const isHighCpu = options.highCPU === (plan.meta.highCPU ?? false)
          let isEqualPeriod = getTarification(period) === tarification.value

          if (isDynamic && isIone && isHourly) {
            isEqualPeriod = true
          }

          if (isEqualPeriod && isEqualKey && isEqualSize && isHighCpu) {
            product.value = { ...item, key }
            cloudStore.planId = uuid ?? plan.uuid

            result = true
            break
          }
        }
        if (result) break
      }
    }
  }

  watch(
    [() => options.highCPU, () => options.config.planCode, tarification, productSize],
    setProduct
  )

  watch(() => [cloudStore.provider, cloudStore.locationId], async ([value]) => {
    options.highCPU = false
    if (!value?.uuid) return
    if (cachedPlans.value[value.uuid]) {
      plansStore.setPlans(cachedPlans.value[value.uuid])

      const { items } = cloudStore.showcases.find(
        ({ uuid }) => uuid === cloudStore.showcaseId
      ) ?? {}
      const { plan } = items?.find((item) =>
        item.locations.includes(cloudStore.locationId)
      ) ?? {}

      cloudStore.planId = plan ?? filteredPlans.value[0]?.uuid ?? ''
      return
    }

    await fetchPlans(value)
  })

  async function fetchPlans (provider) {
    try {
      isPlansLoading.value = true
      const { pool } = await plansStore.fetch({
        sp_uuid: provider.uuid,
        anonymously: !authStore.isLogged
      })

      cachedPlans.value[provider.uuid] = pool
      cloudStore.planId = filteredPlans.value[0]?.uuid ?? pool[0]?.uuid ?? ''
    } catch (error) {
      openNotification('error', {
        message: error.response?.data.message ?? error.message ?? error
      })
    } finally {
      isPlansLoading.value = false
    }
  }

  return { filteredPlans, product, productSize, isPlansLoading }
}

export default useCloudPlans
