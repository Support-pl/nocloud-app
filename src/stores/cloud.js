import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from './auth.js'
import { useSpStore } from './sp.js'
import { usePlansStore } from './plans.js'
import { useInstancesStore } from './instances.js'

import useCreateInstance from '@/hooks/instances/create.js'

export const useCloudStore = defineStore('cloud', () => {
  const i18n = useI18n()
  const { createInstance } = useCreateInstance()

  const authStore = useAuthStore()
  const spStore = useSpStore()
  const plansStore = usePlansStore()
  const instancesStore = useInstancesStore()

  const authData = reactive({
    vmName: '',
    username: '',
    password: '',
    sshKey: undefined,
    score: null
  })
  const autoRenew = ref(true)
  const deployMessage = 'VM created successfully'

  const locationId = ref('Location')
  const showcaseId = ref('')
  const planId = ref()
  const serviceId = ref()
  const namespaceId = ref()

  const showcases = computed(() => {
    const result = [{ title: 'all', uuid: '' }]

    spStore.showcases.forEach((showcase) => {
      if (showcase.locations.length < 1) return

      result.push(showcase)
    })

    return result
  })

  const locations = computed(() => {
    const locations = []

    showcases.value.forEach((showcase) => {
      showcase.locations?.forEach((location) => {
        const sp = spStore.servicesProviders.find(({ locations }) =>
          locations.find(({ id, type }) =>
            location.id.includes(id) && location.type === type
          )
        )

        if (showcaseId.value === '' || showcaseId.value === showcase.uuid) {
          locations.push({ ...location, sp: sp?.uuid, showcase: showcase.uuid })
        }
      })
    })

    return locations
  })

  const provider = computed(() => {
    const { sp } = locations.value.find(({ id }) => id === locationId.value) ?? {}

    return spStore.servicesProviders.find(({ uuid }) => uuid === sp) ?? null
  })

  const plan = computed(() =>
    plansStore.plans.find(({ uuid }) => uuid === planId.value) ?? {}
  )

  const service = computed(() =>
    instancesStore.services.find(({ uuid }) => uuid === serviceId.value) ?? {}
  )

  async function createOrder (options, product) {
    const [newInstance, newGroup] = setInstance(options, product)

    if (newGroup.type === 'ovh') {
      newInstance.config = {
        ...options.config,
        type: plan.value.type.split(' ')[1],
        auto_renew: false
      }

      if (newInstance.config.type === 'cloud') {
        const { resources } = plan.value.products[newInstance.product]

        newInstance.resources = { ...resources, ips_private: 0, ips_public: 1 }
        newGroup.config = { ssh: newInstance.config.ssh }
        delete newInstance.config.ssh
      }
    }

    if (service.value?.instancesGroups?.length < 1) {
      service.value.instancesGroups = [newGroup]
    }

    if (serviceId.value) {
      await updateService(newGroup, newInstance, options)
    } else {
      await createService(newInstance, options)
    }
  }

  function setInstance (options, product) {
    const instance = {
      title: authData.vmName,
      config: {
        template_id: options.os.id,
        username: authData.username,
        password: authData.password,
        ssh_public_key: authData.sshKey,
        auto_renew: autoRenew.value
      },
      resources: {
        cpu: options.cpu.size,
        ram: options.ram.size * 1024,
        drive_type: options.disk.type,
        drive_size: options.disk.size,
        ips_private: options.network.private.count,
        ips_public: options.network.public.count
      },
      billing_plan: { uuid: planId.value }
    }

    if (plan.value.kind === 'STATIC' || plan.value.type !== 'ione') {
      instance.product = product.value.key
    }

    const group = {
      title: authStore.userdata.title + Date.now(),
      resources: { ips_private: 0, ips_public: 0 },
      type: provider.value.type,
      instances: [],
      sp: provider.value.uuid
    }

    return [instance, group]
  }

  async function createService (newInstance, options) {
    const orderData = {
      namespace: namespaceId.value,
      service: {
        title: authStore.userdata.title,
        context: {},
        version: '1',
        instancesGroups: [
          {
            title: authStore.userdata.title + Date.now(),
            resources: {
              ips_private: newInstance.resources.ips_private,
              ips_public: newInstance.resources.ips_public
            },
            type: provider.value.type,
            instances: [newInstance],
            sp: provider.value.uuid
          }
        ]
      }
    }

    if (newInstance.config.type === 'cloud') {
      orderData.service.instancesGroups[0].config = { ssh: options.config.ssh }
    }
    const message = i18n.t('Order created successfully')

    await createInstance('create', orderData, namespaceId.value, message, deployMessage)
  }

  async function updateService (newGroup, newInstance, options) {
    const orderData = Object.assign({}, service.value)
    let group = orderData.instancesGroups.find(
      (el) => el.sp === provider.value.uuid
    )

    if (!group) {
      orderData.instancesGroups.push(newGroup)
      group = orderData.instancesGroups.at(-1)
    }
    if (newInstance.config.type === 'cloud') {
      group.config = { ssh: options.config.ssh }
    }
    group.instances.push(newInstance)

    const res = group.instances.reduce((prev, curr) => ({
      private: prev.private + (curr.resources.ips_private ?? 0),
      public: prev.public + (curr.resources.ips_public ?? 0)
    }), { private: 0, public: 0 })

    group.resources.ips_private = res.private
    group.resources.ips_public = res.public

    const message = i18n.t('Order update successfully')

    await createInstance('update', orderData, namespaceId.value, message, deployMessage)
  }

  return {
    autoRenew,
    authData,
    provider,
    plan,

    locationId,
    showcaseId,

    planId,
    serviceId,
    namespaceId,

    showcases,
    locations,

    createOrder
  }
})
