import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useCloudStore } from '@/stores/cloud.js'

function useCloudPanels (tarification, options, productName) {
  const i18n = useI18n()
  const route = useRoute()

  const spStore = useSpStore()
  const plansStore = usePlansStore()
  const cloudStore = useCloudStore()

  const provider = computed(() => {
    const { sp } = cloudStore.locations.find(({ id }) =>
      id === cloudStore.locationId
    ) ?? {}

    return spStore.servicesProviders.find(({ uuid }) => uuid === sp) ?? null
  })

  const plan = computed(() =>
    plansStore.plans.find(({ uuid }) => uuid === cloudStore.planId)
  )

  const region = computed(() => {
    const { extra, title } = provider.value?.locations
      .find(({ id }) => cloudStore.locationId.includes(id)) ?? {}

    if (!extra) return null
    return { value: extra.region, title }
  })

  const locationHeader = computed(() => {
    if (!provider.value) {
      return ' '
    }
    return (provider.value.type === 'ione')
      ? ` (${provider.value.locations[0].title})`
      : ` (${region.value.title})`
  })

  const planHeader = computed(() => {
    if (provider.value && plan.value) {
      if (productName) return productName
      return (tarification.value === 'Hourly')
        ? ` (VDC ${i18n.t('Pay-as-you-Go')})`
        : ` (VDS ${i18n.t('Pre-Paid')})`
    }
    return ' '
  })

  const osHeader = computed(() => {
    const osNotExist = options.os.name === '' || options.os.name.includes('none')

    return (osNotExist) ? ' ' : ` (${options.os.name})`
  })

  const networkHeader = computed(() => {
    const pub = options.network.public
    const priv = options.network.private

    if (!provider.value) {
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
  })

  const isProductExist = computed(() => {
    if (plan.value.type === 'ione') return
    return !route.query.product && plan.value.type?.includes('dedicated')
  })

  const panels = computed(() => ({
    location: {
      title: `${i18n.t('Location')}: ${locationHeader.value}`
    },
    plan: {
      title: `${i18n.t('Plan')}: ${planHeader.value}`,
      disabled: (provider.value) ? null : 'disabled'
    },
    os: {
      title: `${i18n.t('os')}: ${osHeader.value}`,
      disabled: (!provider.value || !plan.value) ? 'disabled' : null
    },
    network: {
      title: `${i18n.t('Network')}: ${networkHeader.value}`,
      disabled: (provider.value) ? null : 'disabled',
      visible: false && plan.value.kind === 'STATIC'
    },
    addons: {
      title: `${i18n.t('Addons')}:`,
      disabled: (!provider.value || !plan.value || isProductExist) ? 'disabled' : null,
      visible: !['ione', 'ovh cloud'].includes(plan.value?.type)
    }
  }))
  return { panels }
}

export default useCloudPanels
