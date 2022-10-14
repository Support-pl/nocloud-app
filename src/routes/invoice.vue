<template>
  <div class="invoices">
    <loading v-if="isLoading || isInvoicesLoading" />
    <div class="container" v-else>
      <div class="invoices__wrapper">
        <a-radio-group default-value="Invoice" v-model="value" size="large">
          <a-radio-button value="Invoice"> {{ $t('Invoice') }} </a-radio-button>
          <a-radio-button value="Detail"> {{ $t('Detail') }} </a-radio-button>
        </a-radio-group>
        <div v-if="value === 'Invoice'">
          <empty style="margin-top:50px" v-if="invoices.length === 0" />
          <single-invoice
            v-else
            v-for="(invoice, index) in invoices"
            :key="index"
            :invoice="invoice"
          />
        </div>
        <div v-if="value === 'Detail'">
          <empty style="margin-top:50px" v-if="transactions.length === 0" />
          <single-transaction
            v-else
            v-for="(invoice, index) in transactions"
            :key="index"
            :invoice="invoice"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import singleInvoice from "@/components/appMain/invoice/singleInvoice.vue";
import singleTransaction from '@/components/appMain/invoice/singleTransaction.vue';
import loading from "@/components/loading/loading.vue";
import empty from "@/components/empty/empty.vue";

export default {
  name: "invoices",
  components: {
    singleInvoice,
    singleTransaction,
    loading,
    empty,
  },
  data: () => ({ value: "Invoice" }),
  computed: {
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    user() {
      return this.$store.getters["nocloud/auth/userdata"];
    },
    transactions() {
      return this.$store.getters["nocloud/transactions/getTransactions"]
        .sort((a, b) => b.proc - a.proc);
    },
    isLoading() {
      return this.$store.getters["nocloud/transactions/isTransactionsLoading"];
    },
    invoices() {
      return this.$store.getters["invoices/getInvoices"];
    },
    isInvoicesLoading() {
      return this.$store.getters["invoices/isLoading"];
    }
  },
  mounted() {
    if (this.isLogged) {
      this.$store.dispatch("invoices/autoFetch");
    }
    if (localStorage.getItem('order')) {
      this.value = localStorage.getItem('order');
    } else {
      localStorage.setItem('order', this.value);
    }
  },
  watch: {
    value() {
      localStorage.setItem('order', this.value);
      if (this.value === 'Invoice') return;
      if (this.transactions.length > 0) return;

      this.$store.dispatch("nocloud/transactions/fetch", this.user.uuid);
    }
  }
};
</script>

<style>
.invoices {
  padding: 0 10px 0;
  overflow: auto;
  height: 100%;
}

.invoices__wrapper {
  padding: 20px 10px;
}
.invoices__wrapper .ant-radio-group {
  width: 100%;
  margin: 0 1px 20px;
}
.invoices__wrapper .ant-radio-button-wrapper {
  width: 50%;
  text-align: center;
}

/* .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled){
  border-top:none;
} */
/* 
.invoices__wrapper  .card-container {
  overflow: hidden;
 
}
.invoices__wrapper .card-container > .ant-tabs-card > .ant-tabs-content {
  margin-top: -16px;
  padding: 0 10px;
}

.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-content > .ant-tabs-tabpane {
  margin-bottom: 20px;
}

.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar {
  background-color: #fff;
  border-bottom: 0;
  margin: 0 10px 20px;
}
.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
  border-color: transparent;
  background: transparent;
  margin-right: 0;
  border: 0;
  width: 374px;
  text-align: center;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 0;
}
.invoices__wrapper .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-left: 0;
}
.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border-right:1px solid #40a9ff;
;
}

.invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab-active {
  background: #fff;
  border-left: 1px solid #40a9ff ;
  border-right: 1px solid #40a9ff ;
  border-bottom: 1px solid #40a9ff ;
}

@media screen and (max-width: 576px) {
  .invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
    width: 240px;
  }
}

@media screen and (max-width: 420px) {
 .invoices__wrapper  .card-container > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
    width: 180px;
  }
} */
</style>
