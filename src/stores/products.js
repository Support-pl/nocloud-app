import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import api from '@/api.js'
import config from '@/appconfig.js'

export const useProductsStore = defineStore('products', () => {
  const store = useAuthStore()

  const products = ref([])
  const services = ref({})

  const total = ref(10)
  const size = ref(10)
  const page = ref(1)

  const isLoading = ref(false)
  const baseURL = `${config.WHMCSsiteurl}${config.sharedFolder}`

  function setProducts (data) {
    products.value = data.map((product) => ({
      ...product, nextduedate: product.ORDER_INFO?.date
    }))
  }

  return {
    products,
    services,
    setProducts,

    total,
    size,
    page,

    isLoading,
    baseURL,

    async fetch (userid, silent) {
      try {
        if (!silent) isLoading.value = true
        const response = await api.get(
          store.baseURL,
          { params: { userid, run: 'get_active_products' } }
        )

        const result = Object.values((response?.ERROR) ? {} : (response ?? {}))

        products.value = result
        return result
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },

    async fetchServices () {
      try {
        const response = await api.get(
          store.baseURL,
          { params: { run: 'get_product_list' } }
        )

        const result = {}

        Object.values(response).forEach((service) => {
          const { group_name: name, prod } = service

          result[name] = prod
        })

        services.value = result
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
