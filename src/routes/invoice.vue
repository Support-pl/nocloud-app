<template>
  <div class="invoices">
    <!-- {{isTransactionsLoading}} -->
    <loading v-if="isTransactionsLoading" />
    <div class="container" v-else>
      <template>
      
        <div class="invoices__wrapper">
          <a-radio-group default-value="Invoice" v-model="value" size="large">
            <a-radio-button value="Invoice"> Invoice </a-radio-button>
            <a-radio-button value="Detail"> Detail </a-radio-button>
          </a-radio-group>
          <div v-if="value === 'Invoice'">
            <empty style="margin-top:50px" v-if="getTransactions" />
            <div v-else>dfgjhg</div>
          </div>
          <div v-if="value === 'Detail'">
              <empty style="margin-top:50px" v-if="getTransactions.length === 0" />
            <singleInvoice v-else
              v-for="(invoice, index) in transactions"
              :key="index"
              :invoice="invoice"
            />
          </div>
          <!-- <a-tabs type="card">
              <a-tab-pane key="1" tab="Invoice">
                <p>Content of Tab Pane 1</p>
                <p>Content of Tab Pane 1</p>
                <p>Content of Tab Pane 1</p>
              </a-tab-pane>
              <a-tab-pane key="2" tab="Detail">
                <singleInvoice
                  v-for="(invoice, index) in getTransactions"
                  :key="index"
                  :invoice="invoice"
                />
              </a-tab-pane>
            </a-tabs> -->
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
  data() {
    return {
      value: "Invoice",
    };
  },
  computed: {
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    transactions() {
      return this.getTransactions.reverse();
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
  padding: 0 10px 0;
  overflow: auto;
  height: 100%;
}

.invoices__wrapper {
  padding: 0 10px 20px;
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
