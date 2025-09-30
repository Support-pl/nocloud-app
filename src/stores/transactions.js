import { computed, ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api.js";
import { useAuthStore } from "./auth.js";

export const useTransactionsStore = defineStore("transactions", () => {
  const authStore = useAuthStore();

  const allTransactions = ref({});
  const transactions = ref([]);

  const total = ref(10);
  const size = ref(10);
  const page = ref(1);
  const tab = ref("Invoice");

  const isLoading = ref(false);
  const filter = ref([]);

  const filteredTransactions = computed(() =>
    transactions.value
      .filter(({ exec }) => {
        if (filter.value.length < 1) return true;

        const startOf = filter.value[0].toDate().getTime() / 1000;
        const endOf = filter.value[1].toDate().getTime() / 1000;

        return exec > startOf && exec < endOf;
      })
      .map((r) => toTransaction(r))
  );

  function setAll({ records, page, size }) {
    for (let i = page; i <= (size / 5) * page; i++) {
      allTransactions.value[i] = records.slice(
        (i * 5) / page - 5,
        (i * 5) / page
      );
    }
  }

  function toTransaction(report) {
    return { ...report, payment: report.meta.payment_date };
  }

  return {
    allTransactions,
    filteredTransactions,

    total,
    size,
    page,
    tab,

    isLoading,
    filter,
    setAll,

    async fetch(params, force) {
      params.account = authStore.userdata.accountOwner
        ? [authStore.userdata.uuid, authStore.userdata.accountOwner].join(",")
        : authStore.userdata.uuid;
      try {
        isLoading.value = true;
        const response = await api.post("/billing/reports", params);

        response.page = params.page;
        response.size = params.limit;

        transactions.value = response.records;

        setAll(response);

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },

    async fetchCount(params) {
      try {
        const response = await api.post("/billing/count/reports", params);

        total.value = +response.total;
        page.value = 1;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  };
});
