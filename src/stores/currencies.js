import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import config from '@/appconfig.js'
import api from '@/api.js'

export const useCurrenciesStore = defineStore('currencies', () => {
  const authStore = useAuthStore()

  const list = ref([])
  const currencies = ref([])
  const whmcsCurrencies = ref([])
  const defaultCurrency = ref('USD')
  const unloginedCurrency = ref('USD')
  const isLoading = ref(false)

  function setCurrencies (rates) {
    currencies.value = rates.map((el) => ({ ...el, id: `${el.from} ${el.to}` }))
  }

  function setDefaultCurrency (currencies) {
    const currency = currencies.find((el) =>
      el.rate === 1 && [el.from, el.to].includes('NCU')
    )

    if (!currency) return
    defaultCurrency.value = (currency.from === 'NCU') ? currency.to : currency.from
  }

  return {
    list,
    currencies,
    whmcsCurrencies,
    defaultCurrency,
    unloginedCurrency,

    setCurrencies,
    setDefaultCurrency,

    async fetch () {
      try {
        const response = await api.get('/billing/currencies')

        list.value = response.currencies
          .filter((code) => code !== 'NCU')
          .map((code) => ({ code, id: code }))

        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    async fetchCurrencies () {
      if (isLoading.value) return
      try {
        isLoading.value = true
        const response = await api.get('/billing/currencies/rates')

        setCurrencies(response.rates)
        setDefaultCurrency(response.rates)

        return response
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },
    async fetchWhmcsCurrencies () {
      if (!config.whmcsSiteUrl) return
      try {
        const response = await api.get(authStore.baseURL, {
          params: { run: 'get_currencies' }
        })

        whmcsCurrencies.value = response.currency
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
