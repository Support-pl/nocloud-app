import { capitalize, computed, ref } from "vue";
import { defineStore } from "pinia";

import { createPromiseClient } from "@connectrpc/connect";
import { BillingService } from "nocloud-proto/proto/es/billing/billing_connect";
import {
  GetInvoicesRequest,
  CreateTopUpBalanceInvoiceRequest,
  PayRequest,
  PayWithBalanceRequest
} from "nocloud-proto/proto/es/billing/billing_pb";

import { useAppStore } from "./app.js";

import { toDate } from "@/functions.js";

export const useInvoicesStore = defineStore("invoices", () => {
  const app = useAppStore();
  const invoicesApi = createPromiseClient(BillingService, app.transport);

  const isLoading = ref(false);
  const invoices = ref([]);
  const filter = ref(["all"]);

  const getInvoices = computed(() => {
    let filtered;

    if (filter.value[0] === "all" || filter.value.length === 0) {
      filtered = invoices.value;
    } else {
      filtered = invoices.value.filter((ticket) =>
        filter.value.includes(ticket.status)
      );
    }

    return filtered.toSorted((a, b) => {
      const dictionary = {
        Cancelled: 1,
        Paid: 1,
        Unpaid: 2,
      };
      const astatus = dictionary[a.status];
      const bstatus = dictionary[b.status];

      if (astatus !== bstatus) {
        return bstatus - astatus;
      }

      return parseInt(b.id, 10) - parseInt(a.id, 10);
    });
  });

  function toInvoice(transaction) {
    const status = capitalize(transaction.status.toLowerCase());

    return {
      id: transaction.number,
      uuid: transaction.uuid,
      date: toDate(Number(transaction.created), "-", false, true),
      duedate: toDate(Number(transaction.deadline), "-", false, true),
      total: transaction.total,
      status,
      credit: 0,
      service: transaction.service,
      currencycode: transaction.currency,
      meta: transaction.meta,
      type: transaction.type,
    };
  }

  return {
    invoices,
    isLoading,
    filter,
    getInvoices,

    async fetch(silent, page = 1, limit = 10) {
      try {
        const result = [];

        if (!silent) isLoading.value = true;

        const response = await this.fetchNcInvoices({
          field: "created",
          sort: "DESC",
          page,
          limit,
        });

        response.toJson().pool.forEach((el) => {
          result.push(toInvoice(el));
        });

        result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        invoices.value = result;

        if (!response[0]?.ERROR) return result;
        else return response[0].ERROR;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },

    async fetchNcInvoices(params) {
      try {
        const response = await invoicesApi.getInvoices(
          new GetInvoicesRequest(params)
        );

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async createTopUpBalanceInvoice(sum = 0) {
      try {
        const response = await invoicesApi.createTopUpBalanceInvoice(
          new CreateTopUpBalanceInvoiceRequest({
            sum,
          })
        );

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async getPaymentLink(invoiceId) {
      try {
        const response = await invoicesApi.pay(
          new PayRequest({
            invoiceId,
          })
        );

        return response.paymentLink;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async payWithBalance(invoiceUuid) {
      try {
        const response = await invoicesApi.payWithBalance(
          new PayWithBalanceRequest({
            invoiceUuid,
          })
        );

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  };
});
