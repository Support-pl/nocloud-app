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
  const defaultCurrency = ref({ id: 0, title: 'USD' })
  const unloginedCurrency = ref({ id: 0, title: 'USD' })
  const isLoading = ref(false)

  function setDefaultCurrency (currencies) {
    const currency = currencies.find((el) =>
      el.rate === 1 && [el.from.title, el.to.title].includes('NCU')
    )

    if (!currency) return
    defaultCurrency.value = (currency.from.title === 'NCU') ? currency.to : currency.from
  }

  return {
    list,
    currencies,
    whmcsCurrencies,
    defaultCurrency,
    unloginedCurrency,

    setDefaultCurrency,
    async fetch () {
      try {
        const response = await api.get('/billing/currencies')

        console.log(response)
        list.value = response.currencies
          .filter((code) => code.title !== 'NCU')

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

        currencies.value = response.rates
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
