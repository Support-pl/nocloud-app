<template>
  <div class="invoices">
    <div class="container">
      <a-progress
        v-if="transactionsStore.isLoading || invoicesStore.isLoading"
        ref="loading"
        status="active"
        :percent="percent"
        :show-info="false"
      />

      <div ref="wrapper" class="invoices__wrapper">
        <a-radio-group
          v-if="!authStore.billingUser.paid_stop"
          v-model:value="currentTab"
          size="large"
          default-value="Invoice"
        >
          <a-radio-button value="Invoice">
            {{ $t('Invoices') }}
          </a-radio-button>
          <a-radio-button value="Detail">
            {{ $t('Transactions') }}
          </a-radio-button>
          <a-radio-button v-if="config.whmcsActs" value="Acts">
            {{ $t('Acts') }}
          </a-radio-button>
        </a-radio-group>

        <template v-if="currentTab === 'Invoice'">
          <empty v-if="invoicesStore.getInvoices.length === 0" style="margin: 50px 0" />
          <template v-else>
            <invoice-item
              v-for="(invoice, index) in invoicesStore.getInvoices"
              :key="index"
              :invoice="invoice"
            />
          </template>
        </template>

        <template v-if="currentTab === 'Detail'">
          <empty v-if="transactions.length === 0" style="margin: 50px 0" />
          <template v-else>
            <transaction-item
              v-for="(invoice, index) in transactions"
              :key="index"
              :invoice="invoice"
            />
          </template>
        </template>

        <template v-if="currentTab === 'Acts'">
          <acts-list />
        </template>

        <a-pagination
          v-if="currentTab === 'Detail'"
          show-size-changer
          style="width: fit-content; margin-left: auto"
          :page-size-options="pageSizeOptions"
          :page-size="pageSize"
          :total="totalSize"
          :current="currentPage"
          @show-size-change="onShowSizeChange"
          @change="onShowSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useNotification } from '@/hooks/utils'
import config from '@/appconfig.js'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useInvoicesStore } from '@/stores/invoices.js'
import { useTransactionsStore } from '@/stores/transactions.js'
import { useInstancesStore } from '@/stores/instances.js'

import empty from '@/components/ui/empty.vue'
import invoiceItem from '@/components/invoice/invoiceItem.vue'
import transactionItem from '@/components/invoice/transactionItem.vue'
import actsList from '@/components/invoice/actsList.vue'

const authStore = useAuthStore()
const currenciesStore = useCurrenciesStore()
const invoicesStore = useInvoicesStore()
const transactionsStore = useTransactionsStore()
const instancesStore = useInstancesStore()
const { openNotification } = useNotification()

const currentTab = ref('Invoice')
const percent = ref(0)
const pageSizeOptions = ref(['5', '10', '25', '50', '100'])

const wrapper = ref(null)
const loading = ref(null)

const transactions = computed(() => {
  const result = transactionsStore.filteredTransactions

  result.sort((a, b) => b.exec - a.exec)
  return result
})

const currentPage = computed(() =>
  transactionsStore.page
)
const pageSize = computed(() =>
  transactionsStore.size
)
const totalSize = computed(() =>
  transactionsStore.total
)

watch(currentTab, () => {
  localStorage.setItem('order', currentTab.value)
  transactionsStore.tab = currentTab.value

  if (currentTab.value === 'Invoice') return
  if (transactions.value.length > 0) return
  if (!authStore.userdata.uuid) return

  transactionsStore.fetch({
    account: authStore.userdata.uuid,
    page: currentPage.value,
    limit: pageSize.value,
    field: 'exec',
    sort: 'desc',
    type: 'transaction'
  })
})

watch(() => authStore.userdata, () => {
  if (transactionsStore.isLoading) return
  invoicesStore.fetch(invoicesStore.getInvoices.length)

  transactionsStore.fetch({
    account: authStore.userdata.uuid,
    page: currentPage.value,
    limit: pageSize.value,
    field: 'exec',
    sort: 'desc',
    type: 'transaction'
  })

  transactionsStore.fetchCount({
    account: authStore.userdata.uuid, type: 'transaction'
  })
  setPagination()
})

watch(() => transactionsStore.isLoading, () => {
  percent.value = 0
  setCoordY()
  setLoading()
})

watch(() => invoicesStore.isLoading, setCoordY)

onMounted(() => {
  if (authStore.isLogged && authStore.userdata.uuid) {
    invoicesStore.fetch(invoicesStore.getInvoices.length)

    transactionsStore.fetchCount({
      account: authStore.userdata.uuid, type: 'transaction'
    })
    setPagination()
  }

  if (localStorage.getItem('order')) {
    currentTab.value = localStorage.getItem('order')
  } else {
    localStorage.setItem('order', currentTab.value)
  }

  if (currenciesStore.currencies.length < 1) {
    currenciesStore.fetchCurrencies()
  }

  setCoordY()
})

onUnmounted(() => {
  sessionStorage.removeItem('invoice')
})

function setCoordY () {
  setTimeout(() => {
    const items = (currentTab.value === 'Invoice') ? invoicesStore.getInvoices : transactions.value
    const id = sessionStorage.getItem('invoice')
    const i = items.findIndex(({ uuid }) => uuid === id)

    if (i === -1) return
    wrapper.value?.children[i + 1]?.scrollIntoView()
  }, 100)
}

function setLoading () {
  if (percent.value > 99) {
    percent.value = 0
    if (loading.value?.$el.style.transform ?? true) return

    loading.value.$el.style.transform = 'rotate(180deg)'
    setTimeout(setLoading, 1000)

    return
  }

  if (loading.value?.$el.style.transform) {
    loading.value.$el.style.transform = ''
  }
  percent.value += 1

  setTimeout(setLoading, 10)
}

function setPagination () {
  const pagination = localStorage.getItem('transactionsPagination')

  if (!pagination) return
  const { page, limit } = JSON.parse(pagination)

  onShowSizeChange(page, limit)
}

function onShowSizeChange (page, limit) {
  if (page !== currentPage.value) {
    transactionsStore.page = page
  }
  if (limit !== pageSize.value) {
    transactionsStore.size = limit
  }

  transactionsStore.fetch({
    page,
    limit,
    account: authStore.userdata.uuid,
    field: 'exec',
    sort: 'desc',
    type: 'transaction'
  })

  localStorage.setItem('transactionsPagination', JSON.stringify({ page, limit }))
}

async function fetchInstances () {
  if (instancesStore.allInstances.length > 0) return
  try {
    await instancesStore.fetchAll()
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message })
    console.error(error)
  }
}

fetchInstances()
</script>

<script>
export default { name: 'InvoicesView' }
</script>

<style scoped>
.invoices {
  padding: 0 10px 0;
  overflow: auto;
  height: 100%;
}

.invoices__wrapper {
  padding: 20px 0;
}

.invoices__wrapper :deep(.ant-radio-group ){
  width: 100%;
  margin: 0 1px 20px;
}

.invoices__wrapper :deep(.ant-radio-button-wrapper) {
  width: calc(100% / 3);
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
  background-color: var(--bright_font);
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
  background: var(--bright_font);
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
