import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth.js'
import api from '@/api.js'

export const useNamespasesStore = defineStore('namespaces', () => {
  const authStore = useAuthStore()
  const namespaces = ref([])
  const isLoading = ref(false)

  return {
    namespaces,
    isLoading,

    async fetch () {
      try {
        isLoading.value = true
        const response = await api.post('/namespaces', {
          filters: { account: authStore.userdata.uuid }
        })

        namespaces.value = response.pool
        return response
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    }
  }
})
