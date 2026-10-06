<template>
  <div class="ai-packages">
    <div class="ai-packages__header">
      <h1 class="ai-packages__title">{{ promo?.title || showcase.title }}</h1>
      <div
        v-if="promo?.previewEnable && promo.preview"
        class="ai-packages__promo"
        v-html="promo.preview"
      />
      <a
        v-if="showcase.meta?.landing"
        class="ai-packages__details"
        :href="showcase.meta.landing"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t("ai_packages.details") }} →
      </a>
    </div>

    <div v-if="!loading && hasBoth" class="ai-packages__switch" role="tablist">
      <button
        v-for="option of audiences"
        :key="option.value"
        type="button"
        role="tab"
        class="ai-packages__switch-item"
        :class="{ 'ai-packages__switch-item--active': audience === option.value }"
        :aria-selected="audience === option.value"
        @click="audience = option.value"
      >
        <component :is="option.icon" />
        {{ t(`ai_packages.${option.value}`) }}
      </button>
    </div>

    <div v-if="loading" class="ai-packages__grid">
      <div v-for="i in 3" :key="i" class="ai-packages__card">
        <a-skeleton active />
      </div>
    </div>

    <div v-else class="ai-packages__grid">
      <div
        v-for="offer of shownOffers"
        :key="offer.key"
        class="ai-packages__card"
        :class="{ 'ai-packages__card--active': offer.key === selected }"
      >
        <h2 class="ai-packages__name">{{ offer.title }}</h2>
        <div v-if="offer.tagline" class="ai-packages__tagline">
          {{ offer.tagline }}
        </div>

        <div class="ai-packages__price">
          <template v-if="deals[offer.key]">
            <span class="ai-packages__old-price">
              {{ formatPrice(offer.price) }} {{ currency.title }}
            </span>
            {{ formatPrice(deals[offer.key].price) }} {{ currency.title }}
          </template>
          <template v-else>
            {{ formatPrice(offer.price) }} {{ currency.title }}
          </template>
          <span class="ai-packages__period">/ {{ getPeriod(offer.period) }}</span>
        </div>
        <div class="ai-packages__muted">
          {{
            t("ai_packages.credit", {
              amount: `${formatPrice(offer.credit)} ${currency.title}`,
            })
          }}
          <span v-if="offer.bonus > 0" class="ai-packages__bonus">
            +{{ offer.bonus }}%
          </span>
        </div>
        <div v-if="offer.seats" class="ai-packages__muted">
          {{ t("ai_packages.seats", offer.seats) }}
        </div>
        <div v-if="deals[offer.key]" class="ai-packages__deal">
          <GiftOutlined />
          {{
            deals[offer.key].price > 0
              ? t("ai_packages.deal_discount", {
                  n: Math.round((1 - deals[offer.key].price / offer.price) * 100),
                })
              : t("ai_packages.deal_free")
          }}
        </div>

        <a-button
          class="ai-packages__buy"
          type="primary"
          size="large"
          block
          @click="emit('order', { ...offer, promocode: deals[offer.key]?.uuid })"
        >
          {{ t("ai_packages.choose") }}
        </a-button>

        <div class="ai-packages__divider" />

        <div
          v-if="offer.features"
          class="ai-packages__features"
          v-html="offer.features"
        />

        <div class="ai-packages__models">
          <div class="ai-packages__models-title">
            {{ t("ai_packages.models") }}
          </div>
          <div v-if="offer.models.length" class="ai-packages__tags">
            <span
              v-for="model of shownModels(offer)"
              :key="model.key"
              class="ai-packages__tag"
            >
              {{ model.name }}
            </span>
            <a
              v-if="offer.models.length > MODELS_SHOWN"
              class="ai-packages__more"
              @click="toggleModels(offer.key)"
            >
              {{
                expanded[offer.key]
                  ? t("ai_packages.less_models")
                  : t("ai_packages.all_models_count", {
                      n: offer.models.length,
                    })
              }}
            </a>
          </div>
          <div v-else class="ai-packages__muted">
            {{ t("ai_packages.all_models") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { GiftOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons-vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import markdown from "markdown-it";
import { useCurrency, usePeriod } from "@/hooks/utils";
import { useChatsStore } from "@/stores/chats.js";
import { usePromocodesStore } from "@/stores/promocodes";
import { GetPromocodeByCodeRequest } from "nocloud-proto/proto/es/billing/promocodes/promocodes_pb";

/**
 * The storefront of an ai_packages showcase: one card per package, described in the showcase
 * promo under products["<plan>/<key>"]. Choosing one hands it to the order page's usual flow.
 */
const props = defineProps({
  showcase: { type: Object, required: true },
  sizes: { type: Array, required: true },
  products: { type: Object, required: true },
  selected: { type: String, default: "" },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(["order"]);

/** A package lists this many of its models until it is expanded. */
const MODELS_SHOWN = 8;

const { t, locale } = useI18n();
const { getPeriod } = usePeriod();
const { currency, formatPrice } = useCurrency();
const md = markdown({ breaks: true });
const expanded = ref({});

const promocodesStore = usePromocodesStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);
onMounted(() => chatsStore.fetch_models_list());

/** The AI driver's models by key, for their titles. */
const modelsByKey = computed(
  () => new Map(globalModelsList.value.map((model) => [model.key, model])),
);

const promo = computed(
  () => props.showcase.promo?.[locale.value] ?? props.showcase.promo?.en,
);

/**
 * The editor's HTML as the markdown it was typed in: bold and list items kept, other markup
 * dropped. markdown-it then renders it with raw HTML off.
 */
const toMarkdown = (html = "") =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** A line's bold markers, dropped when one is left unpaired. */
const pairBold = (line) =>
  (line.match(/\*\*/g)?.length ?? 0) % 2 ? line.replace(/\*\*/g, "") : line;

/** The first line, when it is not a list item, reads as the card's tagline under its name. */
const describe = (html) => {
  const [first = "", ...rest] = toMarkdown(html).split("\n").map(pairBold);
  const tagline = /^\s*[-*]\s/.test(first) ? "" : first;
  const features = (tagline ? rest : [first, ...rest]).join("\n").trim();

  return {
    tagline: tagline.replace(/\*\*/g, "").trim(),
    features: features ? md.render(features) : "",
  };
};

const bySorter = (a, b) =>
  (a.sorter ?? Number.MAX_SAFE_INTEGER) - (b.sorter ?? Number.MAX_SAFE_INTEGER) ||
  (a.label || "").localeCompare(b.label || "", undefined, { numeric: true });

const offers = computed(() =>
  [...props.sizes].sort(bySorter).flatMap((size) => {
    const [period, key] = Object.entries(size.keys)[0] ?? [];
    const product = props.products[key];
    if (!product) return [];

    const id = `${product.planId}/${key}`;
    const price = +size.price[period] || 0;
    const credit = (+product.meta?.ai_credit || 0) * (currency.value.rate || 1);
    const description =
      promo.value?.products?.[id]?.description ||
      props.showcase.promo?.en?.products?.[id]?.description ||
      size.description;

    return [
      {
        key,
        period: +period,
        title: size.label,
        price,
        credit,
        bonus: price > 0 ? Math.round((credit / price - 1) * 100) : 0,
        seats: +product.meta?.ai_seats || 0,
        models: (Array.isArray(product.meta?.ai_models)
          ? product.meta.ai_models
          : []
        ).map((modelKey) => {
          const model = modelsByKey.value.get(modelKey);
          return { key: modelKey, name: model?.name || modelKey };
        }),
        ...describe(description),
      },
    ];
  }),
);

/** A package for one person is individual; one for several people, or for everyone, is a team's. */
const audienceOf = (offer) => (offer.seats === 1 ? "solo" : "team");
const audiences = [
  { value: "solo", icon: UserOutlined },
  { value: "team", icon: TeamOutlined },
];
const audience = ref("solo");
const hasBoth = computed(
  () =>
    offers.value.some((o) => audienceOf(o) === "solo") &&
    offers.value.some((o) => audienceOf(o) === "team"),
);
const shownOffers = computed(() =>
  hasBoth.value
    ? offers.value.filter((o) => audienceOf(o) === audience.value)
    : offers.value,
);

/** A package linked from the chat opens on its own side of the switch. */
watch(
  () => offers.value.find((o) => o.key === props.selected),
  (offer) => {
    if (offer) audience.value = audienceOf(offer);
  },
  { immediate: true },
);

/**
 * A package with a promocode on it (meta.ai_promocode) shows its price with that code applied.
 * A code this user cannot use (spent, expired) just leaves the package at its price.
 */
const deals = ref({});
const loadDeals = async () => {
  const next = {};

  await Promise.all(
    offers.value.map(async (offer) => {
      const { key } = offer;
      const product = props.products[key];
      const code = product?.meta?.ai_promocode;
      if (!code) return;

      try {
        const promocode = await promocodesStore.promocodesApi.getByCode(
          GetPromocodeByCodeRequest.fromJson({
            code: code.toUpperCase(),
            billingPlan: product.planId,
          }),
        );
        const sale = await promocodesStore.applyToPlan({
          promocodes: [promocode.uuid],
          billingPlan: product.planId,
          addons: [],
        });
        // a free product comes back without its price at all: proto3 leaves out the zero
        const sold = sale.toJson().billingPlans[0]?.products?.[key];
        const price = +(sold?.price ?? 0);
        if (sold && price < offer.price) {
          next[key] = { uuid: promocode.uuid, price };
        }
      } catch {
        // not applicable to this user: the package is sold at its price
      }
    }),
  );
  deals.value = next;
};
watch(() => [offers.value, currency.value.code], loadDeals, { immediate: true });

const shownModels = (offer) =>
  expanded.value[offer.key] ? offer.models : offer.models.slice(0, MODELS_SHOWN);

const toggleModels = (key) => {
  expanded.value[key] = !expanded.value[key];
};
</script>

<script>
export default { name: "AiPackages" };
</script>

<style scoped>
.ai-packages {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 0;
}

.ai-packages__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  text-align: center;
}

.ai-packages__title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 600;
}

.ai-packages__promo {
  max-width: 640px;
  color: var(--gray);
  font-size: 1.05rem;
  line-height: 1.5;
}

.ai-packages__promo :deep(p) {
  margin: 0;
}

.ai-packages__details {
  color: var(--main);
  font-weight: 500;
}

.ai-packages__switch {
  display: flex;
  gap: 6px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto 32px;
  padding: 6px;
  border: 1px solid var(--border_color);
  border-radius: 18px;
  background-color: var(--bright_font);
}

.ai-packages__switch-item {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 0;
  border-radius: 13px;
  color: var(--gray);
  background: transparent;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.ai-packages__switch-item:hover {
  color: inherit;
}

.ai-packages__switch-item:focus-visible {
  outline: 2px solid var(--main);
  outline-offset: 2px;
}

.ai-packages__switch-item--active {
  color: #fff;
  background-color: var(--main);
}

@media (prefers-reduced-motion: reduce) {
  .ai-packages__switch-item {
    transition: none;
  }
}

.ai-packages__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  align-items: stretch;
}

.ai-packages__card {
  display: flex;
  flex-direction: column;
  padding: 32px;
  border: 1px solid var(--border_color);
  border-radius: 24px;
  background-color: var(--bright_font);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.ai-packages__card--active {
  border-color: var(--main);
  box-shadow: 0 0 0 1px var(--main);
}

.ai-packages__name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.ai-packages__tagline {
  margin-top: 6px;
  font-size: 1rem;
}

.ai-packages__price {
  margin-top: 28px;
  font-size: 1.5rem;
  font-weight: 600;
}

.ai-packages__period {
  color: var(--gray);
  font-size: 0.95rem;
  font-weight: 400;
}

.ai-packages__muted {
  margin-top: 2px;
  color: var(--gray);
}

.ai-packages__bonus {
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 10px;
  color: #fff;
  background-color: var(--success);
  font-size: 0.8rem;
}

.ai-packages__old-price {
  margin-right: 6px;
  color: var(--gray);
  font-size: 1.1rem;
  font-weight: 400;
  text-decoration: line-through;
}

.ai-packages__deal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 3px 10px;
  border-radius: 10px;
  color: var(--success);
  background-color: color-mix(in srgb, var(--success) 12%, transparent);
  font-size: 0.85rem;
  font-weight: 500;
}

.ai-packages__buy {
  margin-top: 28px;
  border-radius: 10px;
}

.ai-packages__divider {
  margin: 28px 0 24px;
  border-top: 1px solid var(--border_color);
}

.ai-packages__features {
  margin-bottom: 24px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.ai-packages__features :deep(p) {
  margin: 0 0 12px;
  font-weight: 600;
}

.ai-packages__features :deep(ul),
.ai-packages__features :deep(ol) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ai-packages__features :deep(li) {
  display: flex;
  gap: 10px;
}

.ai-packages__features :deep(li)::before {
  flex-shrink: 0;
  color: var(--main);
  content: "✓";
}

.ai-packages__features :deep(li p) {
  margin: 0;
  font-weight: 400;
}

.ai-packages__models {
  margin-top: auto;
}

.ai-packages__models-title {
  margin-bottom: 8px;
  color: var(--gray);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ai-packages__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.ai-packages__tag {
  padding: 2px 10px;
  border: 1px solid var(--border_color);
  border-radius: 999px;
  font-size: 0.8rem;
}

.ai-packages__more {
  color: var(--main);
  font-size: 0.85rem;
}

@media (max-width: 576px) {
  .ai-packages {
    padding: 12px 0;
  }

  .ai-packages__title {
    font-size: 1.75rem;
  }

  .ai-packages__card {
    padding: 24px;
  }
}
</style>
