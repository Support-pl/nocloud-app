<template>

  <div class="invoices">

	<!-- {{isTransactionsLoading}} -->
    <loading v-if="isTransactionsLoading" />
    <div class="container" v-else>
      <template>
        <empty  v-if="getTransactions.length === 0" />
        <div class="invoices__wrapper">
          <singleInvoice
            v-for="(invoice, index) in getTransactions"
            :key="index"
            :invoice="invoice"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import singleInvoice from "../components/appMain/invoice/singleInvoice.vue";
import loading from "../components/loading/loading.vue";
import empty from "../components/empty/empty.vue";
import { mapGetters } from "vuex";

export default {
  name: "invoices",
  components: {
    singleInvoice,
    loading,
    empty,
  },
  computed: {
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    ...mapGetters("nocloud/auth/", ["userdata"]),
    ...mapGetters("nocloud/transactions", ["isTransactionsLoading"]),
    ...mapGetters("nocloud/transactions", ["getTransactions"]),
  },
  mounted() {
    if (this.isLogged) {
      this.$store.dispatch("nocloud/transactions/fetch", this.userdata.uuid);
    }
  },
};
</script>

<style>
.invoices {
  padding: 20px 10px 0;
  overflow: auto;
  height: 100%;
}

.invoices__wrapper {
  padding: 0 10px 20px;
}
</style>
