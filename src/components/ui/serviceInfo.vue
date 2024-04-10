<template>
  <a-row :gutter="[10, 10]">
    <a-col
      v-for="elem in info"
      :key="elem.key"
      :md="(elem.key === 'autorenew') ? 24 : 12"
      :xs="(elem.key === 'autorenew') ? 24 : 12"
      :sm="(elem.key === 'autorenew') ? 24 : 12"
    >
      <div class="service-page__info">
        <div class="service-page__info-title">
          {{ capitalize($t('userService.' + elem.title)) }}:
        </div>

        <div class="service-page__info-value">
          <template v-if="elem.type === 'money'">
            <template v-if="service.groupname === 'OpenAI'">
              -
            </template>

            <template v-else>
              {{ service[elem.key] }} {{ currency.code }}
            </template>
          </template>

          <template v-else-if="elem.type === 'date'">
            <template v-if="service[elem.key] === '0000-00-00'">
              -
            </template>

            <template v-else>
              {{ dateFormat(new Date(service[elem.key])) }}
            </template>
          </template>

          <template v-else-if="elem.type === 'text'">
            {{ capitalize($t(service[elem.key]?.toLowerCase() ?? '-')) }}
          </template>

          <template v-else>
            {{ service[elem.key] }}
          </template>
        </div>
      </div>
    </a-col>
  </a-row>
</template>

<script setup>
import { useCurrency } from '@/hooks/utils'
import { useCurrenciesStore } from '@/stores/currencies.js'

defineProps({
  service: { type: Object, required: true },
  info: { type: Array, required: true }
})

const { currency } = useCurrency()
const currenciesStore = useCurrenciesStore()

if (currenciesStore.currencies.length < 1) {
  currenciesStore.fetchCurrencies()
}
</script>

<script>
export default { name: 'ServiceInfo' }
</script>

<style scoped>
.service-page__info:not(:last-of-type) {
  margin-bottom: 5px;
}

.service-page__info-title {
  font-weight: bold;
}

.service-page__info-value {
  font-size: 1.1rem;
}
</style>
