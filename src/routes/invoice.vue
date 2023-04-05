<template>
  <div class="invoices">
    <div class="container">
      <a-progress
        ref="loading"
        status="active"
        v-if="isLoading || isInvoicesLoading"
        :percent="percent"
        :show-info="false"
      />
      <div class="invoices__wrapper" ref="invoices">
        <a-radio-group default-value="Invoice" v-model="value" size="large">
          <a-radio-button value="Invoice"> {{ $t('Invoice') }} </a-radio-button>
          <a-radio-button value="Detail"> {{ $t('Detail') }} </a-radio-button>
        </a-radio-group>
        <template v-if="value === 'Invoice'">
          <empty style="margin: 50px 0" v-if="invoices.length === 0" />
          <single-invoice
            v-else
            v-for="(invoice, index) in invoices"
            :key="index"
            :invoice="invoice"
          />
        </template>
        <template v-if="value === 'Detail'">
          <empty style="margin: 50px 0" v-if="transactions.length === 0" />
          <single-transaction
            v-else
            v-for="(invoice, index) in transactions"
            :key="index"
            :invoice="invoice"
          />
        </template>

        <a-pagination
          show-size-changer
          style="width: fit-content; margin-left: auto"
          v-if="value === 'Detail'"
          :page-size-options="pageSizeOptions"
          :page-size="pageSize"
          :total="totalSize"
          :current="currentPage"
          @showSizeChange="onShowSizeChange"
          @change="onShowSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/api.js";
import singleInvoice from "@/components/appMain/invoice/singleInvoice.vue";
import singleTransaction from '@/components/appMain/invoice/singleTransaction.vue';
import empty from "@/components/empty/empty.vue";

export default {
  name: "invoices",
  components: {
    singleInvoice,
    singleTransaction,
    empty,
  },
  data: () => ({
    value: "Invoice",
    percent: 0,
    pageSizeOptions: ['5', '10', '25', '50', '100']
  }),
  computed: {
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    user() {
      return this.$store.getters["nocloud/auth/userdata"];
    },
    transactions() {
      return this.$store.getters["nocloud/transactions/all"]
        .sort((a, b) => b.proc - a.proc);
    },
    isLoading() {
      return this.$store.getters["nocloud/transactions/isLoading"];
    },
    invoices() {
      return this.$store.getters["invoices/getInvoices"];
    },
    isInvoicesLoading() {
      return this.$store.getters["invoices/isLoading"];
    },
    currentPage() {
      return this.$store.getters["nocloud/transactions/page"];
    },
    pageSize() {
      return this.$store.getters["nocloud/transactions/size"];
    },
    totalSize() {
      return this.$store.getters["nocloud/transactions/total"];
    }
  },
  methods: {
    setCoordY() {
      setTimeout(() => {
        const items = (this.value === 'Invoice') ? this.invoices : this.transactions;
        const id = sessionStorage.getItem('invoice');
        const i = items.findIndex(({ uuid }) => uuid === id);

        if (i === -1) return;
        this.$refs.invoices?.children[i + 1]?.scrollIntoView();
      }, 100);
    },
    setLoading() {
      if (this.percent > 99) {
        this.percent = 0;
        if (this.$refs.loading?.$el.style.transform ?? true) return;

        this.$refs.loading.$el.style.transform = 'rotate(180deg)';
        setTimeout(this.setLoading, 1000);
        return;
      }
      if (this.$refs.loading?.$el.style.transform) {
        this.$refs.loading.$el.style.transform = '';
      }
      this.percent += 1;

      setTimeout(this.setLoading, 10);
    },
    setPagination() {
      const pagination = localStorage.getItem("transactionsPagination");

      if (!pagination) return;
      const { page, limit } = JSON.parse(pagination);

      this.onShowSizeChange(page, limit);
    },
    onShowSizeChange(page, limit) {
      if (page !== this.currentPage) {
        this.$store.commit("nocloud/transactions/setPage", page);
      }
      if (limit !== this.pageSize) {
        this.$store.commit("nocloud/transactions/setSize", limit);
      }

      this.$store.dispatch("nocloud/transactions/fetch", {
        page, limit,
        account: this.user.uuid,
        field: "proc",
        sort: "desc"
      });
      localStorage.setItem("transactionsPagination", JSON.stringify({ page, limit }));
    }
  },
  mounted() {
    if (this.isLogged) {
      this.$store.dispatch("invoices/autoFetch");

      if (this.user.uuid) {
        api.transactions.count({ account: this.user.uuid })
          .then(({ total }) => {
            this.$store.commit("nocloud/transactions/setTotal", +total);
          });

        this.setPagination();
      }
    }
    if (localStorage.getItem('order')) {
      this.value = localStorage.getItem('order');
    } else {
      localStorage.setItem('order', this.value);
    }
    if (this.$store.getters['nocloud/auth/currencies'].length < 1) {
      this.$store.dispatch('nocloud/auth/fetchCurrencies');
    }

    this.setCoordY();
  },
  destroyed() {
    sessionStorage.removeItem('invoice');
  },
  watch: {
    value() {
      localStorage.setItem('order', this.value);
      this.$store.commit('nocloud/transactions/setActiveTab', this.value);
      if (this.value === 'Invoice') return;
      if (this.transactions.length > 0) return;
      if (!this.user.uuid) return;

      this.$store.dispatch("nocloud/transactions/fetch", {
        account: this.user.uuid,
        page: this.currentPage,
        limit: this.pageSize,
        field: "proc",
        sort: "desc"
      });
    },
    user() {
      if (this.isLoading) return;
      this.$store.dispatch("nocloud/transactions/fetch", {
        account: this.user.uuid,
        page: this.currentPage,
        limit: this.pageSize,
        field: "proc",
        sort: "desc"
      });

      api.transactions.count({ account: this.user.uuid })
        .then(({ total }) => {
          this.$store.commit("nocloud/transactions/setTotal", +total);
        });

      this.setPagination();
    },
    isLoading() {
      this.percent = 0;
      this.setCoordY();
      this.setLoading();
    },
    isInvoicesLoading() {
      this.setCoordY();
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
