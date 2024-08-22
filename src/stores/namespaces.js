import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth.js'
import api from '@/api.js'

export const useNamespasesStore = defineStore('namespaces', () => {
  const authStore = useAuthStore()

  const namespaces = ref([])
  const accounts = ref([])
  const isLoading = ref(false)

  return {
    namespaces,
    accounts,
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
    },

    async fetchAccounts () {
      try {
        isLoading.value = true
        const response = await api.post('/accounts', {
          filters: {}
        })

        accounts.value = response.pool
        return response
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },

    async createAccount (account) {
      try {
        const response = await api.accounts.create(account)

        this.fetchAccounts()
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    async updateAccount (account) {
      try {
        const response = await api.accounts.update(account.uuid, account)

        this.fetchAccounts()
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
