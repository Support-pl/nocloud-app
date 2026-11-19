<template>
  <div class="order_wrapper">
    <div v-if="!fetchLoading && !plansLoading" class="order">
      <a-empty v-if="products.length === 0" :description="$t('mondoo.unavailable')" />

      <template v-else>
        <div class="order__field">
          <div class="order__title">{{ $t("mondoo.choose plan") }}</div>
          <a-row :gutter="[12, 12]">
            <a-col v-for="item in products" :key="item.key" :xs="24" :sm="12">
              <div
                class="product"
                :class="{ 'product--active': item.key === product }"
                @click="product = item.key"
              >
                <div class="product__head">
                  <span class="product__title">{{ item.title }}</span>
                  <a-tag v-if="item.trialDays" color="green">
                    {{ $t("mondoo.trial days", { n: item.trialDays }) }}
                  </a-tag>
                </div>
                <div class="product__price">
                  {{ item.price }} {{ userCurrency?.code }}
                  <span class="product__period">/ {{ item.period }}</span>
                </div>
                <div v-if="item.limit" class="product__limit">
                  {{ $t("mondoo.up to domains", { n: item.limit }) }}
                </div>
              </div>
            </a-col>
          </a-row>

          <div
            v-if="selected?.meta?.description"
            class="order__description"
            v-html="selected.meta.description"
          />
        </div>

        <div class="order__field">
          <div class="order__title">{{ $t("mondoo.domains") }}</div>
          <a-select
            v-model:value="domains"
            mode="tags"
            style="width: 100%"
            :open="false"
            :token-separators="[',', ' ', ';']"
            :placeholder="$t('mondoo.domains placeholder')"
            :status="domainsError ? 'error' : ''"
            @change="normalize"
          />
          <div class="order__hint" :class="{ 'order__hint--error': domainsError }">
            {{ domainsError || $t("mondoo.domains hint") }}
          </div>
        </div>

        <div class="order__field order__summary">
          <div>
            <div v-if="selected?.trialDays" class="order__trial">
              {{ $t("mondoo.trial note", { n: selected.trialDays }) }}
            </div>
            <div class="order__total">
              {{ selected?.price }} {{ userCurrency?.code }}
              <span class="product__period">/ {{ selected?.period }}</span>
            </div>
          </div>
          <a-button
            type="primary"
            shape="round"
            size="large"
            :disabled="!canOrder"
            @click="modal.confirmCreate = true"
          >
            {{ selected?.trialDays ? $t("mondoo.start trial") : $t("mondoo.order") }}
          </a-button>
          <a-modal
            :title="$t('Confirm')"
            :open="modal.confirmCreate"
            :confirm-loading="modal.confirmLoading"
            :cancel-text="$t('Cancel')"
            @ok="orderClickHandler"
            @cancel="modal.confirmCreate = false"
          >
            <p>
              {{ $t("order_services.Do you want to order") }}:
              {{ selected?.title }} ({{ domains.join(", ") }})
            </p>
          </a-modal>
        </div>
      </template>
    </div>

    <loading v-else />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useNotification } from "@/hooks/utils";
import Loading from "@/components/ui/loading.vue";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useSpStore } from "@/stores/sp.js";
import { usePlansStore } from "@/stores/plans.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useCurrenciesStore } from "@/stores/currencies";
import useCreateInstance from "@/hooks/instances/create";
import useServiceId from "@/hooks/services/serviceId";
import { cleanDomains, isDomain, periodLabel } from "./shared.js";

const router = useRouter();
const route = useRoute();
const { locale, t } = useI18n();
const { openNotification } = useNotification();

const appStore = useAppStore();
const authStore = useAuthStore();
const spStore = useSpStore();
const plansStore = usePlansStore();
const namespacesStore = useNamespasesStore();
const instancesStore = useInstancesStore();
const { userCurrency } = storeToRefs(useCurrenciesStore());
const { getShowcases } = storeToRefs(spStore);
const { createInstance } = useCreateInstance(spStore);

const { serviceId } = useServiceId("mondoo");

const plan = ref(null);
const provider = ref(null);
const product = ref(null);
const domains = ref([]);

const cachedPlans = reactive({});
const fetchLoading = ref(false);
const plansLoading = ref(false);
const modal = ref({ confirmCreate: false, confirmLoading: false });

const showcase = computed(() =>
  getShowcases.value.find(({ uuid }) => uuid === serviceId.value)
);

// getShowcases reshapes showcases for display; the plan/provider pairs are
// on the raw ones.
const showcaseItems = computed(
  () =>
    spStore.showcases.find(({ uuid }) => uuid === serviceId.value)?.items ?? []
);

const plans = computed(
  () =>
    cachedPlans[`${provider.value}_${userCurrency.value?.code}`]?.filter(
      ({ type, uuid }) => {
        const items = showcaseItems.value;
        const allowed = items
          .filter(({ servicesProvider }) => servicesProvider === provider.value)
          .map(({ plan }) => plan);

        if (allowed.length < 1) return type === "mondoo";
        return type === "mondoo" && allowed.includes(uuid);
      }
    ) ?? []
);

const planItem = computed(() =>
  plans.value.find(({ uuid }) => uuid === plan.value)
);

const products = computed(() =>
  Object.entries(planItem.value?.products ?? {})
    .filter(([, item]) => item.public !== false)
    .sort(([, a], [, b]) => (a.sorter ?? 0) - (b.sorter ?? 0))
    .map(([key, item]) => ({
      ...item,
      key,
      limit: +item.resources?.domains || 0,
      period: periodLabel(+item.period, t),
      trialDays: Math.round((+item.meta?.trial?.period || 0) / 86400),
    }))
);

const selected = computed(() =>
  products.value.find(({ key }) => key === product.value)
);

watch(products, (value) => {
  if (!value.find(({ key }) => key === product.value)) {
    product.value = value[0]?.key ?? null;
  }
});

const domainsError = computed(() => {
  const bad = domains.value.find((domain) => !isDomain(domain));
  if (bad) return t("mondoo.invalid domain", { domain: bad });

  const limit = selected.value?.limit;
  if (limit && domains.value.length > limit) {
    return t("mondoo.too many domains", { n: limit });
  }
  return "";
});

const canOrder = computed(
  () => !!selected.value && domains.value.length > 0 && !domainsError.value
);

function normalize(values) {
  domains.value = cleanDomains(values);
}

const sp = computed(() => {
  const items = showcaseItems.value;

  return spStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  );
});

watch(
  sp,
  (value) => {
    if (value.length > 0) provider.value = value[0].uuid;
  },
  { immediate: true }
);

async function fetchPlans(sp) {
  if (!sp) return;
  const cacheKey = `${sp}_${userCurrency.value?.code}`;

  if (cachedPlans[cacheKey]) {
    plan.value = plans.value[0]?.uuid;
    return;
  }
  plansLoading.value = true;
  try {
    const { pool } = await plansStore.fetch({
      anonymously: !authStore.isLogged,
      sp_uuid: sp,
    });

    cachedPlans[cacheKey] = pool;
    plan.value = plans.value[0]?.uuid;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message });
  } finally {
    plansLoading.value = false;
  }
}

watch(provider, (uuid) => fetchPlans(uuid), { immediate: true });
watch(userCurrency, () => fetchPlans(provider.value));

function orderClickHandler() {
  if (!canOrder.value) return;

  const instance = {
    config: { domains: [...domains.value], auto_renew: false },
    title: `${domains.value[0]} ${t("mondoo.title suffix")}`,
    billing_plan: planItem.value,
    product: product.value,
  };

  if (!authStore.userdata.uuid) {
    appStore.onLogin.redirect = route.name;
    appStore.onLogin.redirectQuery = route.query;
    appStore.onLogin.info = {
      type: "mondoo",
      title:
        showcase.value?.promo?.[locale.value]?.title ??
        showcase.value?.title ??
        "Mondoo",
      cost: selected.value.price,
      currency: userCurrency.value.code,
    };
    appStore.onLogin.action = () => {
      orderClickHandler();
    };

    router.push({ name: "login" });
    return;
  }

  create(instance);
}

async function create(instance) {
  modal.value.confirmLoading = true;

  try {
    await createInstance(instance, {
      provider: provider.value,
      instancesGroupType: "mondoo",
    });
    router.push({ path: "/services" });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message });
    console.error(error);
  } finally {
    modal.value.confirmLoading = false;
    modal.value.confirmCreate = false;
  }
}

async function fetch() {
  try {
    fetchLoading.value = true;
    const promises = [
      authStore.fetchBillingData(),
      spStore.fetch(!authStore.isLogged),
    ];

    if (authStore.isLogged) {
      promises.push(namespacesStore.fetch(), instancesStore.fetch());
    }

    await Promise.all(promises);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    if (error.response?.data?.code === 16) return;
    openNotification("error", { message: t(message) });
    console.error(error);
  } finally {
    fetchLoading.value = false;
  }
}

fetch();
</script>

<script>
export default { name: "MondooComponent" };
</script>

<style scoped>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.order__field {
  padding: 20px;
  border-radius: 20px;
  background: var(--bright_font);
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}

.order__title {
  margin-bottom: 12px;
  font-size: 1.1rem;
  font-weight: 700;
}

.order__description {
  margin-top: 16px;
  color: var(--gray);
}

.order__hint {
  margin-top: 6px;
  font-size: 0.9rem;
  color: var(--gray);
}

.order__hint--error {
  color: var(--err);
}

.order__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.order__trial {
  color: var(--success);
  font-weight: 600;
}

.order__total {
  font-size: 1.4rem;
  font-weight: 700;
}

.product {
  height: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border_color, #e5e5e5);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.product--active {
  border-color: var(--main);
}

.product__head {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

.product__title {
  font-weight: 600;
}

.product__price {
  margin-top: 8px;
  font-size: 1.3rem;
  font-weight: 700;
}

.product__period {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--gray);
}

.product__limit {
  margin-top: 4px;
  color: var(--gray);
}
</style>
