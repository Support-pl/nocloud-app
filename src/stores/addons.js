import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createPromiseClient } from '@connectrpc/connect'

import { AddonsService } from 'nocloud-proto/proto/es/billing/billing_connect'
import { ListAddonsRequest } from 'nocloud-proto/proto/es/billing/addons/addons_pb'
import { useAppStore } from './app.js'

export const useAddonsStore = defineStore('addons', () => {
  const app = useAppStore()
  const addonsApi = createPromiseClient(AddonsService, app.transport)
  const addons = ref([])

  return {
    addons,

    async fetch (options) {
      try {
        const response = await addonsApi.list(new ListAddonsRequest(options))

        addons.value = response.addons
        return response
      } catch (error) {
        console.debug(error)
        throw error
      }
    }
  }
})
