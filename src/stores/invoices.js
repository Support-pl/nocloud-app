import { computed, ref, watch } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { createPromiseClient } from "@connectrpc/connect";
import { BillingService } from "nocloud-proto/proto/es/billing/billing_connect";
import {
  GetInvoicesRequest,
  CreateTopUpBalanceInvoiceRequest,
  PayRequest,
  PayWithBalanceRequest,
  CreateRenewalInvoiceRequest,
} from "nocloud-proto/proto/es/billing/billing_pb";
import { useAppStore } from "./app.js";
import { debounce, toInvoice } from "@/functions.js";
import api from "@/api.js";
import { useAuthStore } from "./auth.js";
import { useRouter } from "vue-router";
import {
  BillingEvent,
  StreamRequest,
} from "nocloud-proto/proto/es/billing/billing_pb.js";

export const useInvoicesStore = defineStore("invoices", () => {
  const app = useAppStore();
  const auth = useAuthStore();
  const { userBalance } = storeToRefs(auth);
  const router = useRouter();
  const invoicesApi = createPromiseClient(BillingService, app.transport);

  const isLoading = ref(false);
  const invoices = ref([]);
  const filter = ref(["all"]);

  const stream = ref();

  const getInvoices = computed(() => {
    let filtered;

    if (filter.value[0] === "all" || filter.value?.length === 0) {
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

  const isInvoicesNotificationEnabled = computed(() => {
    return getInvoices.value.find((i) => i.status === "Unpaid");
  });

  async function fetchNcInvoices(params) {
    try {
      const response = await invoicesApi.getInvoices(
        new GetInvoicesRequest(params)
      );

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function fetchWhmcsInvoices(params) {
    try {
      const response = await api.get(auth.baseURL, {
        params: { run: "get_invoices" },
      });

      return response.invoices.invoice;
    } catch (error) {
      return [];
    }
  }

  async function fetchInvoices(silent, page = 1, limit = 1000) {
    try {
      const result = [];

      if (!silent) isLoading.value = true;

      const [response, whmcsInvoices] = await Promise.all([
        fetchNcInvoices({
          field: "created",
          sort: "DESC",
          page,
          limit,
        }),
        fetchWhmcsInvoices(),
      ]);

      (response.toJson().pool || [])
        .filter(
          (invoice) =>
            !(
              invoice?.meta?.whmcs_sync_required &&
              !invoice?.meta?.whmcs_invoice_id
            )
        )
        .forEach((el) => {
          result.push(toInvoice(el));
        });

      whmcsInvoices.forEach((el) => {
        if (result.find((invoice) => invoice?.payment_invoice_id == el.id))
          return;

        result.push(toInvoice(el, "whmcs"));
      });

      result.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );
      invoices.value = result;

      startStream();

      if (!response[0]?.ERROR) return result;
      else return response[0].ERROR;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  const fetch = debounce(fetchInvoices, 1000);

  const startStream = async () => {
    try {
      stream.value = invoicesApi.stream(new StreamRequest());
      console.log("InvoicesStream started");

      for await (const event of stream.value) {
        switch (event.event) {
          case BillingEvent.EVENT_INVOICE_CREATED: {
            const invoice = event.body.invoice.toJson();
            invoices.value.unshift(toInvoice(invoice));

            break;
          }
          case BillingEvent.EVENT_INVOICE_UPDATED: {
            const invoice = event.body.invoice.toJson();
            invoices.value = invoices.value.map((i) =>
              i.uuid === invoice.uuid ? toInvoice(invoice) : i
            );

            break;
          }
          default: {
            break;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  function fetchInvoicesForUser() {
    if (userBalance.value) {
      fetchInvoices();
    }
  }

  watch(userBalance, () => {
    fetchInvoicesForUser();
  });
  fetchInvoicesForUser();

  return {
    invoices,
    invoicesApi,
    isLoading,
    filter,
    getInvoices,
    isInvoicesNotificationEnabled,
    fetch,

    async createTopUpBalanceInvoice(sum = 0) {
      try {
        const response = await invoicesApi.createTopUpBalanceInvoice(
          new CreateTopUpBalanceInvoiceRequest({
            sum,
          })
        );

        return response.toJson();
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

    async payWithBalance({ invoiceUuid, whmcsId }) {
      try {
        const response = await invoicesApi.payWithBalance(
          new PayWithBalanceRequest({
            invoiceUuid,
            whmcsId,
          })
        );

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async createRenewInvoice(instance) {
      try {
        const response = await invoicesApi.createRenewalInvoice(
          new CreateRenewalInvoiceRequest({
            instance: instance.uuid,
          })
        );

        router.push({ name: "billing" });

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  };
});
