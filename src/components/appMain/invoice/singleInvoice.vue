<template>
  <div
    class="invoice"
    :style="{ cursor: (invoice.records.length > 0) ? 'pointer': 'default' }"
    @click="clickOnInvoice(invoice.uuid)"
  >
    <div class="invoice__header flex-between">
      <div class="invoice__service">Service: {{ invoice.service || 'none' }}</div>
      <div class="invoice__status" :style="{ color: statusColor }">
        {{ $t(`invoice_${(invoice.processed) ? 'paid' : 'cancelled'}`) }}
      </div>
    </div>
    <div class="invoice__middle">
      <div class="invoice__cost" :style="{ color: costColor }">
        {{ invoice.total }} {{ invoice.currency_code || 'BYN' }}
      </div>
      <div class="invoice__date-item invoice__invDate">
        <div class="invoice__date-title">
          {{ $t("invoiceDate") }}
        </div>
        <div class="invoice__date">
          {{ date(invoice.proc)  }}
        </div>
      </div>
      <div class="invoice__date-item invoice__dueDate">
        <div class="invoice__date-title">
          {{ $t("dueDate") }}
        </div>
        <div class="invoice__date">
          {{ date(invoice.exec) }}
        </div>
      </div>
    </div>
    <div class="horisontal-line"></div>
    <div class="invoice__footer flex-between">
      <div class="invoice__id">#{{ invoice.uuid }}</div>
      <div class="invoice__btn" v-if="invoice.records.length > 0">
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
    statusColor() {
      switch (this.invoice.processed) {
        case true:
          return this.$config.colors.success;
        case false:
          return this.$config.colors.gray;
        default:
          return this.$config.colors.err;
      }
    },
    costColor() {
      if (this.invoice?.total > 0) {
        return this.$config.colors.success;
      } else if (this.invoice?.total < 0) {
        return this.$config.colors.err;
      } else {
        return null;
      }
    },
  },
  methods: {
    clickOnInvoice(uuid) {
      if (this.invoice.records.length < 1) return;

      this.$router.push({
        name: "invoiceFS",
        params: { uuid },
      });
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
  },
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

.invoice__id,
.invoice__service {
  font-size: 12px;
  color: var(--gray);
}

.invoice__status {
  font-weight: 600;
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

.invoice__header,
.invoice__middle,
.horisontal-line {
  margin-bottom: 2px;
}
</style>
