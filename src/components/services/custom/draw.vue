<template>
  <div v-if="aiPackage" class="ai-package">
    <ai-chat-button />

    <div class="ai-package__stats">
      <div class="ai-package__stat">
        <div class="ai-package__label">{{ t("ai_packages.credit_title") }}</div>
        <div class="ai-package__value">
          {{ formatPrice(aiPackage.credit) }} {{ currency.title }}
        </div>
        <div class="ai-package__hint">/ {{ getPeriod(aiPackage.period) }}</div>
      </div>
      <div class="ai-package__stat">
        <div class="ai-package__label">{{ t("ai_packages.seats_title") }}</div>
        <div class="ai-package__value">
          {{ aiPackage.seats || "∞" }}
        </div>
        <div class="ai-package__hint">
          {{
            aiPackage.seats
              ? t("ai_packages.seats", aiPackage.seats)
              : t("ai_packages.seats_all")
          }}
        </div>
      </div>
      <div class="ai-package__stat">
        <div class="ai-package__label">{{ t("ai_packages.models") }}</div>
        <div class="ai-package__value">
          {{ aiPackage.models.length || "∞" }}
        </div>
        <div class="ai-package__hint">
          {{ aiPackage.models.length ? "" : t("ai_packages.all_models") }}
        </div>
      </div>
    </div>

    <div v-if="aiPackage.models.length" class="ai-package__tags">
      <span
        v-for="model of aiPackage.models"
        :key="model.key"
        class="ai-package__tag"
      >
        {{ model.name }}
      </span>
    </div>
  </div>

  <a-row v-if="addons.length" :gutter="[10, 10]" style="margin-top: 20px">
    <a-col span="24">
      <div class="service-page__info">
        <div class="service-page__info-title">
          {{ capitalize($t("Addons")) }}:
        </div>

        <a-table :columns="columns" :data-source="addons">
          <template #expandColumnTitle>
            {{ $t("description") }}
          </template>
          <template #expandedRowRender="{ record }">
            <template v-if="!record.meta.description"> - </template>
            <span v-else v-html="record.meta.description" />
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'period'">
              {{ getPeriod(record.period) }}
            </template>

            <template v-else-if="column.key === 'price'">
              {{ record.price }} {{ currency.title }}
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
import { computed, getCurrentInstance, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useCurrency, usePeriod } from "@/hooks/utils";
import { useChatsStore } from "@/stores/chats.js";
import aiChatButton from "@/components/ui/aiChatButton.vue";

const props = defineProps({
  service: { type: Object, required: true },
});

const i18n = useI18n();
const { t } = i18n;
const app = getCurrentInstance().appContext.config.globalProperties;
const { currency, formatPrice } = useCurrency();
const { getPeriod } = usePeriod();

const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);

/** The instance's product when it is an AI package (meta.ai_credit), as the storefront shows it. */
const aiPackage = computed(() => {
  const key = props.service.product ?? props.service.config?.product;
  const product = props.service.billingPlan?.products?.[key];
  const credit = +product?.meta?.ai_credit || 0;
  if (!credit) return null;

  const names = new Map(globalModelsList.value.map((m) => [m.key, m.name]));
  const models = Array.isArray(product.meta.ai_models) ? product.meta.ai_models : [];

  return {
    credit: credit * (currency.value.rate || 1),
    period: product.period,
    seats: +product.meta.ai_seats || 0,
    models: models.map((key) => ({ key, name: names.get(key) || key })),
  };
});

onMounted(() => {
  if (aiPackage.value) chatsStore.fetch_models_list();
});

const addons = computed(() =>
  (props.service.billingPlan?.resources ?? []).filter(({ key }) =>
    props.service.config?.addons?.includes(key)
  )
);

const columns = computed(() => [
  { key: "title", title: app.capitalize(i18n.t("name")) },
  { key: "period", title: i18n.t("Payment period") },
  { key: "price", title: i18n.t("invoice_Price") },
]);
</script>

<script>
export default { name: "CustomDraw" };
</script>

<style scoped>
.ai-package {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border_color);
}

.ai-package__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.ai-package__stat {
  padding: 16px;
  border: 1px solid var(--border_color);
  border-radius: 12px;
}

.ai-package__label {
  color: var(--gray);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ai-package__value {
  margin-top: 4px;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
}

.ai-package__hint {
  min-height: 1.2em;
  color: var(--gray);
  font-size: 0.85rem;
}

.ai-package__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ai-package__tag {
  padding: 2px 10px;
  border: 1px solid var(--border_color);
  border-radius: 12px;
  font-size: 0.85rem;
}

@media (max-width: 576px) {
  .ai-package__stats {
    grid-template-columns: 1fr;
  }
}
</style>
