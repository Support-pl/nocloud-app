<template>
  <a-row :gutter="[10, 10]" style="margin-top: 20px">
    <a-col span="24">
      <div class="service-page__info">
        <div class="service-page__info-title">
          {{ capitalize($t('Addons')) }}:
        </div>

        <a-table :columns="columns" :data-source="addons">
          <template #expandColumnTitle>
            {{ $t('description') }}
          </template>
          <template #expandedRowRender="{ record }">
            <template v-if="!record.meta.description">
              -
            </template>
            <span v-else v-html="record.meta.description" />
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'period'">
              {{ getPeriod(record.period) }}
            </template>

            <template v-else-if="column.key === 'price'">
              {{ record.price }} {{ currency.code }}
            </template>

            <template v-else>
              {{ record[column.key] }}
            </template>
          </template>
        </a-table>
      </div>
    </a-col>
  </a-row>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrency, usePeriod } from '@/hooks/utils'

const props = defineProps({
  service: { type: Object, required: true }
})

const i18n = useI18n()
const app = getCurrentInstance().appContext.config.globalProperties
const { currency } = useCurrency()
const { getPeriod } = usePeriod()

const addons = computed(() =>
  props.service.billingPlan.resources.filter(({ key }) =>
    props.service.config.addons.includes(key)
  )
)

const columns = computed(() => [
  { key: 'title', title: app.capitalize(i18n.t('name')) },
  { key: 'period', title: i18n.t('Payment period') },
  { key: 'price', title: i18n.t('invoice_Price') }
])
</script>

<script>
export default { name: 'CustomDraw' }
</script>
