<template>
  <div
    class="invoice"
    :style="{ cursor: (isClickable) ? 'pointer': 'default' }"
    @click="clickOnInvoice(invoice.uuid)"
  >
    <div class="invoice__middle">
      <div class="invoice__cost" :style="{ color: costColor }">
        {{ -(invoice.total * currency.rate).toFixed(2) }} {{ currency.code }}
      </div>
      <div class="invoice__date-item invoice__invDate">
        <div class="invoice__date-title">
          {{ $t("invoiceDate") }}
        </div>
        <div class="invoice__date">
          {{ date(invoice.exec)  }}
        </div>
      </div>
      <div class="invoice__date-item invoice__dueDate">
        <div class="invoice__date-title">
          {{ $t("dueDate") }}
        </div>
        <div class="invoice__date">
          {{ date(invoice.proc) }}
        </div>
      </div>
    </div>
    <div class="horisontal-line"></div>
    <div class="invoice__footer flex-between">
      <div class="invoice__id">#{{ invoice.uuid }}</div>
      <div class="invoice__btn" v-if="isClickable">
        <a-icon type="right" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "invoice",
  props: {
    invoice: Object,
  },
  computed: {
    costColor() {
      if (this.invoice?.total < 0) {
        return this.$config.colors.success;
      } else if (this.invoice?.total > 0) {
        return this.$config.colors.err;
      } else {
        return null;
      }
    },
    currencies() {
      return this.$store.getters['nocloud/auth/currencies'];
    },
    currency() {
      const code = this.$store.getters['nocloud/auth/billingData'].currency_code ?? 'USD';
      const { rate } = this.currencies.find((el) =>
        el.from === code && el.to === this.invoice.currency
      ) ?? {};

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.to === code && el.from === this.invoice.currency
      ) ?? { rate: 1 };

      return { code, rate: (rate) ? rate : 1 / reverseRate };
    },
    isClickable() {
      const isRecordsExist = this.invoice.records.length > 0;
      const isMessageExist = this.invoice.meta.message;
      const isInstancesExist = this.invoice.meta.instances?.length > 0;

      return isRecordsExist || isMessageExist || isInstancesExist;
    }
  },
  methods: {
    clickOnInvoice(uuid) {
      if (!this.isClickable) return;

      this.$router.push({ name: "transaction", params: { uuid } });
    },
    date(timestamp) {
      if (timestamp < 1) return '-';

      const date = new Date(timestamp * 1000);
      const time =  date.toTimeString().split(' ')[0];

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${day}.${month}.${year} ${time}`;
    }
  }
};
</script>

<style>
.invoice {
  position: relative;
  padding: 8px 15px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: #fff;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

.invoice__id{
  font-size: 12px;
  color: var(--gray);
}

.invoice:not(:last-child) {
  margin-bottom: 20px;
}

.invoice__dueDate {
  text-align: right;
}

.invoice__cost {
  font-size: 28px;
  color: var(--main);
}

.horisontal-line {
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.2);
}

.flex-between {
  display: flex;
  justify-content: space-between;
}
.invoice__middle {
  display: flex;
}
.invoice__cost {
  flex: 2 1 0;
}
.invoice__invDate {
  flex: 1 1 0;
}
.invoice__dueDate {
  flex: 1 1 0;
}

.invoice__middle,
.horisontal-line {
  margin-bottom: 2px;
}

@media (max-width: 400px) {
  .invoice__cost {
    flex: 1.5 1 0;
  }
}
</style>
