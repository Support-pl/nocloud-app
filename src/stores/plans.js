import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api.js'

export const usePlansStore = defineStore('plans', () => {
  const plans = ref([])
  const isLoading = ref(false)

  function setPlans (value) {
    plans.value = value.map((plan) => {
      plan.resources = plan.resources.map((resource) => ({
        ...resource, price: +resource.price.toFixed(2)
      }))

      Object.entries(plan.products).forEach(([key, product]) => {
        plan.products[key].price = +product.price.toFixed(2)
      })

      return plan
    })
  }

  return {
    plans,
    isLoading,
    setPlans,

    async fetch (params) {
      try {
        isLoading.value = true
        const response = await api.plans.list(params)

        setPlans(response.pool)
        return response
      } catch (error) {
        return error
      } finally {
        isLoading.value = false
      }
    }
  }
})
