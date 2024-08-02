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
      const code = store.unloginedCurrency.title
      const { rate } = store.currencies.find((el) =>
        el.to.title === code && el.from.id === store.defaultCurrency.id
      ) ?? {}

      const { rate: reverseRate } = store.currencies.find((el) =>
        el.from.title === code && el.to.id === store.defaultCurrency.id
      ) ?? { rate: 1 }

      const { title } = userdata.value.currency ?? store.defaultCurrency

      if (!isLogged.value) return { rate: (rate) || 1 / reverseRate, code }
      return { rate: 1, code: title.split('_').at(0) }
    })
  }
}

export default useCurrency
