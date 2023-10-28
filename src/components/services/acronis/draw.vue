<template>
  <a-row class="module" :gutter="[10, 10]">
    <a-col span="12">
      <div style="font-weight: 700">
        {{ $t('token') | capitalize }}:
      </div>
      <div style="font-size: 1.1rem">
        {{ service.data?.token ?? '-' }}
      </div>
    </a-col>
    <a-col span="12">
      <div style="font-weight: 700">
        {{ $t('Token expiration date') }}:
      </div>
      <div style="font-size: 1.1rem">
        {{ service.data?.expires_at ?? '-' }}
      </div>
    </a-col>

    <a-col>
      <a-table
        :columns="columns"
        :data-source="acronisData"
        :pagination="false"
      />
    </a-col>

    <a-col style="display: flex; gap: 10px">
      <a-button type="primary" :loading="isLoading" @click="openLink">
        {{ $t('open') }}
      </a-button>
      <a-button type="primary" :loading="isRefreshLoading" @click="refreshToken">
        {{ $t('Refresh token') }}
      </a-button>
    </a-col>
  </a-row>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import i18n from '@/i18n'
import api from '@/api.js'

const props = defineProps({
  service: { type: Object, required: true }
})
const app = getCurrentInstance()

const authStore = useAuthStore()
const currenciesStore = useCurrenciesStore()

const isLoading = ref(false)
const isRefreshLoading = ref(false)
const columns = [
  {
    title: app.proxy.$options.filters.capitalize(i18n.t('name')),
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: app.proxy.$options.filters.capitalize(i18n.t('count')),
    dataIndex: 'count',
    key: 'count'
  },
  {
    title: i18n.t('invoice_Price'),
    dataIndex: 'price',
    key: 'price'
  }
]

async function openLink () {
  try {
    isLoading.value = true
    const { meta } = await api.instances.action({
      action: 'get_link',
      uuid: props.service.uuid
    })

    location.assign(meta.link)
  } catch (error) {
    console.error(error)
  }
}

async function refreshToken () {
  try {
    isRefreshLoading.value = true
    await api.instances.action({
      action: 'refresh_token',
      uuid: props.service.uuid
    })

    message.success(i18n.t('Done'))
  } catch (error) {
    console.error(error)
  } finally {
    isRefreshLoading.value = false
  }
}

const currency = computed(() => {
  const { currency_code: code } = authStore.billingUser

  return { code: code ?? currenciesStore.defaultCurrency }
})

const acronisData = computed(() =>
  Object.entries(props.service.config.items)
    .reduce((result, [key, count]) => {
      const { price: rowPrice, meta } = props.service.billingPlan.products[key]
      const price = `${rowPrice} ${currency.value.code}`
      const title = meta.edition

      if (key === 'local_storage') return result
      return [...result, { key, count, title, price }]
    }, [])
)
</script>

<script>
export default { name: 'AcronisDraw' }
</script>
