import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createPromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'

import { AddonsService } from 'nocloud-proto/proto/es/billing/billing_connect'
import { ListAddonsRequest } from 'nocloud-proto/proto/es/billing/addons/addons_pb'
import { useAuthStore } from './auth.js'

export const useAddonsStore = defineStore('addons', () => {
  const authStore = useAuthStore()

  const transport = createConnectTransport({
    baseUrl: (VUE_APP_BASE_URL.endsWith('/') ? VUE_APP_BASE_URL : `${VUE_APP_BASE_URL}/`),
    useBinaryFormat: import.meta.env.PROD,
    interceptors: [
      (next) => (req) => {
        req.header.set('Authorization', `Bearer ${authStore.token}`)
        return next(req)
      }
    ]
  })
  const addonsApi = createPromiseClient(AddonsService, transport)

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
