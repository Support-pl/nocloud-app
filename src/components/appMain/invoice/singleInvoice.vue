<template>
  <div class="invoice" @click="clickOnInvoice(invoice.id)">
    <div class="invoice__header flex-between">
      <div class="invoice__status" :style="{ color: statusColor }">
        {{ $t(`invoice_${invoice.status}`) }}
      </div>
    </div>
    <div class="invoice__middle">
      <div class="invoice__prefix">
        {{ $t('net total') | capitalize }}:
      </div>
      <div class="invoice__cost" :style="{ color: statusColor }">
        {{ total }} {{ user.currency_code }}
      </div>
      <div class="invoice__date-item invoice__invDate">
        <div class="invoice__date-title">
          {{ $t("invoiceDate") }}
        </div>
        <div class="invoice__date">
          {{ invoice.date }}
        </div>
      </div>
      <div class="invoice__date-item invoice__dueDate">
        <div class="invoice__date-title">
          {{ $t("dueDate") }}
        </div>
        <div class="invoice__date">
          {{ (invoice.status === 'Unpaid') ? '-' : (invoice.datepaid ?? invoice.duedate) }}
        </div>
      </div>
    </div>
    <div class="horisontal-line" />
    <div class="invoice__footer flex-between">
      <div class="invoice__id">
        #{{ invoice.id }}
      </div>
      <div class="invoice__btn">
        <span v-if="invoice.status === 'Unpaid'" class="invoice__pay">
          {{ $t('Pay').toLowerCase() }}
          <a-icon
            color="success"
            :type="(isLoading) ? 'loading' : 'right'"
          />
        </span>
        <a-icon v-else :type="(isLoading) ? 'loading' : 'right'" />
      </div>
    </div>
  </div>
</template>

<script>
import config from '@/appconfig.js'

export default {
  name: 'InvoiceView',
  props: { invoice: Object },
  data: () => ({ isLoading: false }),
  computed: {
    baseURL () {
      return this.$store.getters['invoices/getURL']
    },
    user () {
      return this.$store.getters['nocloud/auth/billingData']
    },
    currencies () {
      return this.$store.getters['nocloud/auth/currencies']
    },
    currency () {
      const code = this.user.currency_code ?? 'USD'
      if (code === this.invoice.currencycode) return { code, rate: 1 }

      const { rate } = this.currencies.find((el) =>
        el.from === code && el.to === this.invoice.currencycode
      ) ?? {}

      const { rate: reverseRate } = this.currencies.find((el) =>
        el.to === code && el.from === this.invoice.currencycode
      ) ?? { rate: 1 }

      return { code, rate: (rate) || 1 / reverseRate }
    },
    statusColor () {
      switch (this.invoice.status.toLowerCase()) {
        case 'paid':
          return config.colors.success
        case 'cancelled':
          return config.colors.gray
        default:
          return config.colors.err
      }
    },
    costColor () {
      if (this.invoice?.subtotal > 0) {
        return config.colors.success
      } else if (this.invoice?.subtotal < 0) {
        return config.colors.err
      } else {
        return null
      }
    },
    total () {
      const total = this.invoice?.subtotal ?? this.invoice.total
      const rate = this.currency.rate

      return ((+total + +this.invoice?.credit) * rate).toFixed(2)
    }
  },
  created () {
    if (this.invoice.currencycode === 'NCU') {
      this.invoice.currencycode = this.$store.getters['nocloud/auth/defaultCurrency']
    }
  },
  methods: {
    clickOnInvoice (uuid) {
      if (this.invoice.status === 'Unpaid') {
        this.isLoading = true
        if (this.invoice.meta) {
          this.$api.get(this.baseURL, {
            params: {
              run: 'create_inv',
              invoice_id: uuid,
              product: this.invoice.meta.description ?? this.invoice.service,
              sum: this.total
            }
          })
            .then(({ invoiceid }) => {
              this.$notification.success({ message: this.$t('Done') })
              this.getPaytoken(invoiceid)
            })
        } else this.getPaytoken(uuid)
      } else {
        this.getPaytoken(uuid)
      }
    },
    getPaytoken (invoice_id) {
      this.$api.get(this.baseURL, {
        params: {
          run: 'get_pay_token', invoice_id
        }
      })
        .then((res) => {
          window.location.href = res
        })
        .finally(() => {
          this.isLoading = false
        })
    }
  }
}
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

.invoice__pay {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 12px;
  color: #fff;
  background: var(--success);
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
  align-items: center;
}
.invoice__prefix {
  margin-right: 5px;
  color: var(--gray);
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

.invoice__footer {
  align-items: center;
}
</style>
