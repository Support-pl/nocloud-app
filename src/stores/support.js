import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth.js'
import api from '@/api.js'

export const useSupportStore = defineStore('support', () => {
  const store = useAuthStore()

  const tickets = ref([])
  const departments = ref([])

  const isOnlyClosedTickets = ref(false)
  const isAddingTicket = ref(false)
  const isLoading = ref(false)

  const filter = ref(['all'])

  const getTickets = computed(() => {
    // const order = ['open', 'closed', 'answered']
    const result = [...tickets.value].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const filters = filter.value.map((el) => {
      if (!el.includes(' ')) return el
      return el.split(' ').map((el) =>
        `${el[0].toUpperCase()}${el.slice(1)}`
      ).join('-')
    })

    if (filter.value[0] === 'all' || filter.value.length === 0) {
      result.sort()
      return result
    } else {
      return result.filter((ticket) => filters.includes(ticket.status))
    }
  })

  return {
    tickets,
    getTickets,
    departments,

    isOnlyClosedTickets,
    isAddingTicket,
    isLoading,
    filter,

    async fetch (silent) {
      try {
        if (!silent) isLoading.value = true
        const response = await api.get(
          store.baseURL, { params: { run: 'get_tickets' } })

        if (response?.ERROR) throw response.ERROR.toLowerCase()
        if (!response) throw new Error('tickets not found')

        tickets.value = response
        return response
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },

    async fetchDepartments () {
      if (departments.value.length > 0) {
        return departments.value
      }

      try {
        const response = await api.get(store.baseURL, { params: { run: 'get_dept' } })

        if (response?.ERROR) {
          departments.value = []
          throw response.ERROR.toLowerCase()
        }

        departments.value = response
        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
