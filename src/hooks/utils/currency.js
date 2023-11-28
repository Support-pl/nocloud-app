import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

function useCurrency () {
  const store = useCurrenciesStore()
  const { isLogged, userdata } = storeToRefs(useAuthStore())

  if (store.currencies.length < 1) {
    store.fetchCurrencies()
  }

  return {
    currency: computed(() => {
      const code = store.unloginedCurrency
      const { rate } = store.currencies.find((el) =>
        el.to === code && el.from === store.defaultCurrency
      ) ?? {}

      const { rate: reverseRate } = store.currencies.find((el) =>
        el.from === code && el.to === store.defaultCurrency
      ) ?? { rate: 1 }

      if (!isLogged.value) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: userdata.value.currency ?? store.defaultCurrency }
    })
  }
}

export default useCurrency
