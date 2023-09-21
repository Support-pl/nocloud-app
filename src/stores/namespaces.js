import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api.js'

export const useNamespasesStore = defineStore('namespaces', () => {
  const namespaces = ref([])
  const isLoading = ref(false)

  return {
    namespaces,
    isLoading,

    async fetch () {
      try {
        isLoading.value = true
        const response = api.namespaces.list()

        namespaces.value = response.pool
        return response
      } catch (error) {
        return error
      } finally {
        isLoading.value = false
      }
    }
  }
})
