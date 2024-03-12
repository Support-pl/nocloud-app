<template>
  <div class="invoice" @click="isLoading = true; getPaytoken(invoice.id)">
    <div class="invoice__header flex-between">
      <div class="invoice__status" :style="{ color: statusColor }">
        {{ $t(`invoice_${invoice.status}`) }}
      </div>
    </div>
    <div class="invoice__middle">
      <div class="invoice__prefix">
        {{ capitalize($t('net total')) }}:
      </div>
      <div class="invoice__cost" :style="{ color: statusColor }">
        {{ total }} {{ currency.code }}
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

      <a-popconfirm
        v-if="invoice.paid_balance && invoice.status === 'Unpaid'"
        :title="$t('Are you sure you want pay invoice by balance?')"
        :description="$t('The current invoice will be deleted, the service will be paid from the balance.')"
        :ok-text="$t('Yes')"
        :cancel-text="$t('Cancel')"
        @confirm="createInvoiceByBalance(invoice.id)"
      >
        <div class="invoice__btn" style="margin-left: auto" @click.stop>
          <span class="invoice__pay invoice__balance-pay">
            {{ $t('pay by balance') }}
            <component :is="(isBalanceLoading) ? loadingIcon : rightIcon" color="success" />
          </span>
        </div>
      </a-popconfirm>

      <div
        v-if="invoice.status === 'Unpaid'"
        class="invoice__btn"
        @click.stop="createInvoice(invoice.id)"
      >
        <span class="invoice__pay">
          {{ $t('Pay').toLowerCase() }}
          <component :is="(isLoading) ? loadingIcon : rightIcon" color="success" />
        </span>
      </div>
      <component :is="(isLoading) ? loadingIcon : rightIcon" v-else style="margin-top: 5px" />
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useInvoicesStore } from '@/stores/invoices.js'
import { useNotification } from '@/hooks/utils'

import api from '@/api'
import config from '@/appconfig.js'

const props = defineProps({
  invoice: { type: Object, required: true }
})

const i18n = useI18n()
const authStore = useAuthStore()
const currenciesStore = useCurrenciesStore()
const invoicesStore = useInvoicesStore()
const { openNotification } = useNotification()

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)
const rightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RightOutlined')
)

const isLoading = ref(false)
const isBalanceLoading = ref(false)
const currencyCode = ref('')

const currency = computed(() => {
  const code = authStore.userdata.currency ?? 'USD'
  if (code === currencyCode.value) return { code, rate: 1 }

  const { rate } = currenciesStore.currencies.find((el) =>
    el.from === code && el.to === currencyCode.value
  ) ?? {}

  const { rate: reverseRate } = currenciesStore.currencies.find(
    (el) => el.to === code && el.from === currencyCode.value
  ) ?? { rate: 1 }

  return { code, rate: (rate) || 1 / reverseRate }
})

const statusColor = computed(() => {
  switch (props.invoice.status.toLowerCase()) {
    case 'paid':
      return config.colors.success
    case 'cancelled':
      return config.colors.gray
    default:
      return config.colors.err
  }
})

// const costColor = computed(() => {
//   if (props.invoice.subtotal > 0) {
//     return config.colors.success
//   } else if (props.invoice.subtotal < 0) {
//     return config.colors.err
//   } else {
//     return null
//   }
// })

const total = computed(() => {
  const total = props.invoice.subtotal ?? props.invoice.total
  const { rate } = currency.value

  return Math.abs(((+total + +props.invoice?.credit) * rate)).toFixed(2)
})

async function createInvoice (id) {
  isLoading.value = true
  if (props.invoice.status === 'Unpaid') {
    getPaytoken(id)
    return
  }

  if (!props.invoice.meta) {
    getPaytoken(id)
    return
  }

  try {
    const type = (props.invoice.total > 0) ? 'debit' : 'top-up'

    const { invoiceid } = api.get(authStore.baseURL, {
      params: {
        run: 'create_inv',
        invoice_id: id,
        product: props.invoice.meta.description ?? props.invoice.service,
        invoice_type: props.invoice.meta.invoiceType ?? type,
        sum: total.value
      }
    })

    openNotification('success', { message: i18n.t('Done') })
    getPaytoken(invoiceid)
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  }
}

async function createInvoiceByBalance (id) {
  isBalanceLoading.value = true
  try {
    await api.get(authStore.baseURL, {
      params: { run: 'balance_paid', invoice_id: id }
    })

    await invoicesStore.fetch(true)
    openNotification('success', { message: i18n.t('Done') })
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  } finally {
    isBalanceLoading.value = false
  }
}

async function getPaytoken (id) {
  try {
    const response = await api.get(authStore.baseURL, {
      params: { run: 'get_pay_token', invoice_id: id }
    })

    window.location.href = response
  } finally {
    isLoading.value = false
  }
}

if (props.invoice.currencycode === 'NCU') {
  currencyCode.value = currenciesStore.defaultCurrency
} else {
  currencyCode.value = props.invoice.currencycode
}
</script>

<script>
export default { name: 'InvoiceView' }
</script>

<style scoped>
.invoice {
  position: relative;
  padding: 8px 15px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  color: inherit;
  cursor: pointer;
}

.invoice__id,
.invoice__service {
  font-size: 12px;
  color: var(--gray);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.invoice__pay {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 12px;
  color: var(--gloomy_font);
  background: var(--success);
  white-space: nowrap;
}

.invoice__balance-pay {
  background: var(--main);
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
  background-color: var(--border_color);
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
  gap: 5px;
}

@media (max-width: 576px) {
  .invoice__middle {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .invoice__cost {
    text-align: right;
  }
}
</style>
