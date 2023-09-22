import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth.js'
import { useAppStore } from './app.js'
import api from '@/api.js'

export const useInvoicesStore = defineStore('invoices', () => {
  const auth = useAuthStore()
  const app = useAppStore()

  const isLoading = ref(false)
  const invoices = ref([])
  const filter = ref(['all'])

  function getInvoices (state) {
    let filtred

    if (state.filter[0] === 'all' || state.filter.length === 0) {
      filtred = state.invoices
    } else {
      filtred = state.invoices.filter(ticket => state.filter.includes(ticket.status))
    }

    return filtred.sort((a, b) => {
      const dictionary = {
        Cancelled: 1,
        Paid: 1,
        Unpaid: 2
      }
      const astatus = dictionary[a.status]
      const bstatus = dictionary[b.status]
      if (astatus !== bstatus) {
        return bstatus - astatus
      }
      const aid = parseInt(a.id, 10)
      const bid = parseInt(b.id, 10)
      return bid - aid
    })
  }

  return {
    invoices,
    isLoading,
    filter,
    getInvoices,

    async fetch (silent) {
      try {
        if (!silent) isLoading.value = true
        const account = auth.userdata.uuid
        const promises = [
          api.get(auth.baseURL, { params: { run: 'get_invoices' } }),
          api.transactions.list({ account, type: 'invoice' })
        ]
        const response = await Promise.all(promises)

        const result = response[0]?.invoices?.invoice ?? []

        response[1].pool.forEach((el) => {
          if (el.meta.invoiceCreate) return
          result.push({
            id: el.uuid,
            date: app.date(el.proc, '-', false, true),
            duedate: app.date(el.exec, '-', false, true),
            total: el.total,
            status: 'Unpaid',
            credit: 0,
            service: el.service,
            currencycode: el.currency,
            meta: el.meta
          })
        })

        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        if (!response[0]?.ERROR) invoices.value = result
        else return response[0].ERROR

        return result
      } catch (error) {
        return error
      } finally {
        isLoading.value = false
      }
    }
  }
})