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

  const getInvoiceKey = (invoice) =>
    String(invoice?.payment_invoice_id ?? invoice?.id ?? "");

  const matchesInvoice = (a, b) => {
    const aPayment = a?.payment_invoice_id;
    const bPayment = b?.payment_invoice_id;
    const aId = String(a?.id ?? "");
    const bId = String(b?.id ?? "");

    if (aPayment != null && bPayment != null) {
      if (String(aPayment) === String(bPayment)) return true;
    }

    if (aId && bId && aId === bId) return true;

    return false;
  };

  const dedupeInvoices = (items) => {
    const deduped = [];

    items.forEach((invoice) => {
      const existingIndex = deduped.findIndex((d) =>
        matchesInvoice(d, invoice),
      );

      if (existingIndex === -1) {
        deduped.push(invoice);
        return;
      }

      const existing = deduped[existingIndex];
      const shouldReplaceWithCurrent =
        existing?.payment_invoice_id == null &&
        invoice?.payment_invoice_id != null;

      if (shouldReplaceWithCurrent) {
        deduped[existingIndex] = invoice;
      }
    });

    return deduped;
  };

  const shouldHideInvoiceInMixedMode = (rawInvoice) => {
    const isNoCloudOnlyMode = auth.userdata?.paymentsGateway === "nocloud";

    if (isNoCloudOnlyMode) return false;

    return Boolean(
      rawInvoice?.meta?.whmcs_sync_required &&
      !rawInvoice?.meta?.whmcs_invoice_id,
    );
  };

  const upsertInvoiceFromStream = ({ invoice, sessionId, eventTypeLabel }) => {
    const invoiceKey = getInvoiceKey(invoice);

    const index = invoices.value.findIndex((i) => matchesInvoice(i, invoice));

    if (index !== -1) {
      invoices.value[index] = invoice;
    } else {
      invoices.value.unshift(invoice);
    }

    invoices.value = dedupeInvoices(invoices.value);
  };

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
        filter.value.includes(ticket.status),
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
        new GetInvoicesRequest(params),
      );

      return response;
    } catch (error) {
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

  async function fetchInvoices(page = 1, limit = 1000) {
    try {
      const result = [];

      const [response, whmcsInvoices] = await Promise.all([
        fetchNcInvoices({
          field: "created",
          sort: "DESC",
          page,
          limit,
        }),
        fetchWhmcsInvoices(),
      ]);

      if (auth.userdata?.paymentsGateway === "nocloud") {
        (response.toJson().pool || []).forEach((el) => {
          result.push(toInvoice(el));
        });
      } else {
        const ncPool = response.toJson().pool || [];
        const filteredNcPool = ncPool.filter(
          (invoice) => !shouldHideInvoiceInMixedMode(invoice),
        );

        filteredNcPool.forEach((el) => {
          result.push(toInvoice(el));
        });

        whmcsInvoices.forEach((el) => {
          if (result.find((invoice) => invoice?.payment_invoice_id == el.id)) {
            return;
          }

          result.push(toInvoice(el, "whmcs"));
        });
      }

      result.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
      );

      invoices.value = result;
      invoices.value = dedupeInvoices(invoices.value);

      startStream();

      if (!response[0]?.ERROR) return result;
      else return response[0].ERROR;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  const fetchInvoicesDebounced = debounce(fetchInvoices, 1000);
  const fetch = (silent, page = 1, limit = 1000) => {
    if (!silent) {
      isLoading.value = true;
    }

    fetchInvoicesDebounced(page, limit);
  };

  const startStream = async () => {
    if (stream.value) {
      return;
    }

    const sessionId = Date.now();

    try {
      stream.value = invoicesApi.stream(new StreamRequest());

      for await (const event of stream.value) {
        switch (event.event) {
          case BillingEvent.EVENT_INVOICE_CREATED:
          case BillingEvent.EVENT_INVOICE_UPDATED: {
            const rawInvoice = event.body.invoice.toJson();
            if (shouldHideInvoiceInMixedMode(rawInvoice)) {
              break;
            }

            const invoice = toInvoice(rawInvoice);
            const eventTypeLabel =
              event.event === BillingEvent.EVENT_INVOICE_CREATED
                ? "EVENT_INVOICE_CREATED"
                : "EVENT_INVOICE_UPDATED";

            upsertInvoiceFromStream({
              invoice,
              sessionId,
              eventTypeLabel,
            });

            break;
          }
          default:
            break;
        }
      }
    } catch (error) {
      // Stream errors are expected on reconnect/disconnect boundaries.
    } finally {
      stream.value = null;
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
          }),
        );

        return response.toJson();
      } catch (error) {
        throw error;
      }
    },

    async getPaymentLink(invoiceId) {
      try {
        const response = await invoicesApi.pay(
          new PayRequest({
            invoiceId,
          }),
        );

        return response.paymentLink;
      } catch (error) {
        throw error;
      }
    },

    async payWithBalance({ invoiceUuid, whmcsId }) {
      try {
        const response = await invoicesApi.payWithBalance(
          new PayWithBalanceRequest({
            invoiceUuid,
            whmcsId,
          }),
        );

        return response;
      } catch (error) {
        throw error;
      }
    },

    async createRenewInvoice(instance) {
      try {
        const response = await invoicesApi.createRenewalInvoice(
          new CreateRenewalInvoiceRequest({
            instance: instance.uuid,
          }),
        );

        router.push({ name: "billing" });

        return response;
      } catch (error) {
        throw error;
      }
    },
  };
});
