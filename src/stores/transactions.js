import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api.js'

export const useTransactionsStore = defineStore('transactions', () => {
  const allTransactions = ref({})
  const transactions = ref([])

  const total = ref(10)
  const size = ref(10)
  const page = ref(1)
  const tab = ref('Invoice')

  const isLoading = ref(false)
  const filter = ref([])

  const filteredTransactions = computed(() =>
    transactions.value.filter(({ exec }) => {
      if (filter.value.length < 1) return true

      const startOf = filter.value[0]._d.getTime() / 1000
      const endOf = filter.value[1]._d.getTime() / 1000

      return exec > startOf && exec < endOf
    })
  )

  function setAll ({ records, page, size }) {
    for (let i = page; i <= size / 5 * page; i++) {
      allTransactions.value[i] = records.slice(i * 5 / page - 5, i * 5 / page)
    }
  }

  return {
    allTransactions,
    filteredTransactions,

    total,
    size,
    page,
    tab,

    isLoading,
    filter,
    setAll,

    async fetch (params) {
      const records = []

      for (let i = params.limit / 5 * params.page; i >= params.page; i--) {
        if (!allTransactions.value[i]) break

        records.push(...allTransactions.value[i])
      }

      if (records.length > 0) {
        transactions.value = records
        return { records }
      }

      try {
        isLoading.value = true
        const response = await api.post('/billing/reports', params)

        response.page = params.page
        response.size = params.limit

        transactions.value = response.records
        setAll(response)

        return response
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },

    async fetchCount (params) {
      try {
        const response = await api.post('/billing/count/reports', params)

        total.value = +response.total
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
