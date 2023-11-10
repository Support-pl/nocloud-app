import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api.js'

export const useCurrenciesStore = defineStore('currencies', () => {
  const currencies = ref([])
  const defaultCurrency = ref('USD')
  const unloginedCurrency = ref('USD')

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
    currencies,
    defaultCurrency,
    unloginedCurrency,

    setCurrencies,
    setDefaultCurrency,

    async fetchCurrencies () {
      try {
        const response = await api.get('/billing/currencies/rates')

        setCurrencies(response.rates)
        setDefaultCurrency(response.rates)

        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
