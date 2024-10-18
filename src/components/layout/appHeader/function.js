import { useInvoicesStore } from "@/stores/invoices.js";
import { useAuthStore } from "@/stores/auth.js";
import { useTransactionsStore } from "@/stores/transactions.js";

function invoiceReload() {
  const useApp = useAuthStore();
  const invoicesStore = useInvoicesStore();
  const transactions = useTransactionsStore();
  const params = {
    account: useApp.userdata.uuid,
    page: transactions.currentPage,
    limit: transactions.pageSize,
    field: "exec",
    sort: "desc",
  };
  if (transactions.activeInvoiceTab === "Invoice") {
    invoicesStore.fetch();
  } else {
    transactions.fetch(params, true);
  }
  useApp.fetchUserData(true);
}
export { invoiceReload };
