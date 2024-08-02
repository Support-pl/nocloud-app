import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import cookies from 'js-cookie'
import { useAuthStore } from './auth.js'
import { useCurrenciesStore } from './currencies.js'
import api from '@/api.js'

export const useInstancesStore = defineStore('instances', () => {
  const authStore = useAuthStore()
  const currenciesStore = useCurrenciesStore()

  const services = ref([])
  const instances = ref([])
  const allInstances = ref([])
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

  function setInstances (service, items = instances) {
    items.value = items.value.filter(({ uuidService }) =>
      uuidService !== service.uuid
    )

    service.instancesGroups.forEach(group => {
      if (group.config.is_vdc) {
        items.value.push({
          ...group,
          type: 'vdc',
          title: service.title,
          uuidService: service.uuid,
          billingPlan: { products: {}, resources: [] },
          state: {
            meta: {},
            state: (group.status === 'UP') ? 'RUNNING' : 'UNKNOWN'
          }
        })
      }
      group.instances.forEach((inst) => {
        const { currencies, defaultCurrency } = currenciesStore
        const {
          userdata: { currency: code = defaultCurrency }
        } = authStore

        const { rate } = currencies.find((el) =>
          el.from.id === defaultCurrency.id && el.to.id === code.id
        ) ?? {}

        const { rate: reverseRate } = currencies.find((el) =>
          el.to.id === defaultCurrency.id && el.from.id === code.id
        ) ?? { rate: 1 }

        const resources = inst.billingPlan.resources.map((res) => {
          const k = rate || reverseRate
          const n = (inst.billingPlan.type === 'openai') ? 4 : 2

          return { ...res, price: +(res.price * k).toFixed(n) }
        })
        const products = {}

        Object.entries(inst.billingPlan.products).forEach(([key, value]) => {
          products[key] = {
            ...value, price: +(value.price * (rate || reverseRate)).toFixed(2)
          }
        })

        items.value.push({
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

    if (!inst) return
    data.state.meta.networking = inst.state.meta.networking
    inst.state = JSON.parse(JSON.stringify(data.state))
  }

  return {
    services,
    instances,
    getInstances,
    allInstances,

    isLoading,
    isActionLoading,

    socket,
    searchString,

    async fetch (silent, options = {}) {
      try {
        isLoading.value = !silent
        const response = await api.post('/services', {
          filters: { account: authStore.userdata.uuid },
          ...options
        })

        if (currenciesStore.currencies.length < 1) {
          await currenciesStore.fetchCurrencies()
        }

        services.value = response.pool
        response.pool.forEach((service) => {
          setInstances(service)
        })

        return response
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },

    async fetchAll () {
      try {
        const response = await api.post('/services?show_deleted=true', {
          filters: { account: authStore.userdata.uuid }
        })

        response.pool.forEach((service) => {
          setInstances(service, allInstances)
        })

        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    async createService (data) {
      try {
        const response = await api.services._create(data)

        setInstances(response)
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    async updateService (data) {
      try {
        const response = await api.services._update(data)

        setInstances(response)
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    subscribeWebSocket (uuid) {
      const token = cookies.get('noCloudinApp-token')
      const url = VUE_APP_BASE_URL.replace('http', 'ws')

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
        console.error(error)
        throw error
      } finally {
        isActionLoading.value = false
      }
    },
    async loginToCpanel (id) {
      const instance = instances.value.find(({ uuid }) => uuid === id)

      if (instance) {
        const response = await this.invokeAction({
          uuid: id, action: 'session'
        })

        if (!response.result) throw new Error(response)
        return response.meta.url
      } else {
        const response = await api.get(authStore.baseURL, {
          params: { run: 'shared_start', orderid: id }
        })

        if (response.cpanelresult?.error) throw response
        if (!response.data.url) throw new Error('[Error]: Failed to sign in')
        return response.data.url
      }
    },
    async deleteInstance (uuid) {
      try {
        const response = await api.delete(`/instances/${uuid}`)

        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    $reset () {
      services.value = []
      instances.value = []
      allInstances.value = []
      searchString.value = ''
      socket.value = null
    }
  }
})
