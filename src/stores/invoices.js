import { capitalize, computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createPromiseClient } from '@connectrpc/connect'
import { BillingService } from 'nocloud-proto/proto/es/billing/billing_connect'
import { BillingStatus, GetInvoicesRequest, UpdateInvoiceStatusRequest } from 'nocloud-proto/proto/es/billing/billing_pb'

import { useAppStore } from './app.js'
import { useAuthStore } from './auth.js'

import { toDate } from '@/functions.js'
import config from '@/appconfig.js'
import api from '@/api.js'

export const useInvoicesStore = defineStore('invoices', () => {
  const app = useAppStore()
  const auth = useAuthStore()
  const invoicesApi = createPromiseClient(BillingService, app.transport)

  const isLoading = ref(false)
  const invoices = ref([])
  const filter = ref(['all'])

  const getInvoices = computed(() => {
    let filtered

    if (filter.value[0] === 'all' || filter.value.length === 0) {
      filtered = invoices.value
    } else {
      filtered = invoices.value.filter(ticket => filter.value.includes(ticket.status))
    }

    return filtered.toSorted((a, b) => {
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

      return parseInt(b.id, 10) - parseInt(a.id, 10)
    })
  })

  function toInvoice (transaction) {
    const status = capitalize(BillingStatus[transaction.status].toLowerCase())

    return {
      id: transaction.number,
      date: toDate(Number(transaction.created), '-', false, true),
      duedate: toDate(Number(transaction.deadline), '-', false, true),
      total: transaction.total,
      status,
      credit: 0,
      service: transaction.service,
      currencycode: transaction.currency,
      meta: transaction.meta,
      type: transaction.type
    }
  }

  return {
    invoices,
    isLoading,
    filter,
    getInvoices,

    async fetch (silent, page = 1, limit = 10) {
      try {
        if (!config.whmcsSiteUrl) return
        if (!silent) isLoading.value = true

        const promises = [
          api.get(auth.baseURL, { params: { run: 'get_invoices' } }),
          this.fetchNcInvoices({ field: 'created', sort: 'DESC', page, limit })
        ]

        const response = await Promise.allSettled(promises)
        const result = response[0].value?.invoices?.invoice ?? []

        response[1].value.pool.forEach((el) => {
          if (el.meta.invoiceCreate) return
          result.push(toInvoice(el))
        })

        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        invoices.value = result

        if (!response[0]?.ERROR) return result
        else return response[0].ERROR
      } catch (error) {
        console.error(error)
        throw error
      } finally {
        isLoading.value = false
      }
    },

    async fetchNcInvoices (params) {
      try {
        const response = await invoicesApi.getInvoices(
          new GetInvoicesRequest(params)
        )

        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    async updateStatus (uuid, status) {
      try {
        const response = await invoicesApi.updateInvoiceStatus(
          new UpdateInvoiceStatusRequest({ uuid, status: BillingStatus[status] })
        )

        return response
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
})
