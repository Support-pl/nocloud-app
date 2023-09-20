import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import cookies from 'js-cookie'
import { useAuthStore } from './auth.js'
import api from '@/api.js'

export const useInstancesStore = defineStore('instances', () => {
  const store = useAuthStore()

  const services = ref([])
  const instances = ref([])
  const searchString = ref('')
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const socket = ref(null)

  const getInstances = computed(() => {
    if (searchString.value) {
      return instances.value.filter((inst) => {
        const net = inst.state?.meta?.networking
        const rules = [
          inst.title.toLowerCase().includes(searchString.value),
          inst.state?.state.toLowerCase().includes(searchString.value),
          net?.private?.some((el) => el.includes(searchString.value)),
          net?.public?.some((el) => el.includes(searchString.value))
        ]

        return rules.some(el => !!el) && inst.state?.state !== 'DELETED'
      })
    }
    return instances.value.filter(({ state }) => state?.state !== 'DELETED')
  })

  function setInstances (service) {
    instances.value = instances.value.filter(({ uuidService }) =>
      uuidService !== service.uuid
    )

    service.instancesGroups.forEach(group => {
      group.instances.forEach((inst) => {
        const {
          currencies,
          defaultCurrency,
          billingUser: { currency_code: code = defaultCurrency }
        } = store

        const { rate } = currencies.find((el) =>
          el.from === defaultCurrency && el.to === code
        ) ?? {}

        const { rate: reverseRate } = currencies.find((el) =>
          el.to === defaultCurrency && el.from === code
        ) ?? { rate: 1 }

        const resources = inst.billingPlan.resources.map((res) => ({
          ...res, price: +(res.price * (rate || reverseRate)).toFixed(2)
        }))
        const products = {}

        Object.entries(inst.billingPlan.products).forEach(([key, value]) => {
          products[key] = {
            ...value, price: +(value.price * (rate || reverseRate)).toFixed(2)
          }
        })

        instances.value.push({
          ...inst,
          uuidService: service.uuid,
          type: group.type,
          sp: group.sp,
          billingPlan: { ...inst.billingPlan, resources, products }
        })
      })
    })
  }

  function setInstanceInvoke (data) {
    const inst = instances.value.find(item => item.uuid === data.uuid)

    data.state.meta.networking = inst.state.meta.networking
    inst.state = JSON.parse(JSON.stringify(data.state))
  }

  return {
    services,
    instances,
    getInstances,

    isLoading,
    isActionLoading,

    socket,
    searchString,

    async fetch (silent) {
      try {
        isLoading.value = !silent
        const response = await api.services.list()

        if (store.currencies.length < 1) {
          await store.fetchCurrencies()
        }

        services.value = response.pool
        response.pool.forEach((service) => {
          setInstances(service)
        })

        return response
      } catch (error) {
        return error
      } finally {
        isLoading.value = false
      }
    },

    async createService (data) {
      try {
        const response = await api.services._create(data)

        setInstances(response)
        return response
      } catch (error) {
        return error
      }
    },
    async updateService (data) {
      try {
        const response = await api.services._update(data)

        setInstances(response)
        return response
      } catch (error) {
        return error
      }
    },

    subscribeWebSocket (uuid) {
      const token = cookies.get('noCloudinApp-token')
      const url = VUE_APP_BASE_URL.replace('https', 'wss')

      socket.value = new WebSocket(`${url}services/${uuid}/stream`, ['Bearer', token])

      socket.value.onopen = (event) => {
        console.log(event)
      }
      socket.value.onmessage = (event) => {
        const response = JSON.parse(event.data).result

        if (response) setInstanceInvoke(response)
        console.log(event)
      }
      socket.value.onclose = (event) => {
        console.log(event)
      }
      socket.value.onerror = (event) => {
        console.log(event)
      }
    },
    async invokeAction (data) {
      try {
        isActionLoading.value = true
        const response = await api.instances.action(data)

        return response
      } catch (error) {
        return error
      } finally {
        isActionLoading.value = false
      }
    },
    async deleteInstance (_, uuid) {
      try {
        const response = await api.delete(`/instances/${uuid}`)

        return response
      } catch (error) {
        return error
      }
    }
  }
})
