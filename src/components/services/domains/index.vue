<template>
  <div class="wrapper" style="margin: 0; padding: 0">
    <loading v-if="providersStore.isLoading" />
    <div v-else-if="!cartVisibility" class="order_wrapper">
      <div class="order">
        <div class="order__inputs order__field">
          <div class="order_option">
            <a-row class="order_option__steps" type="flex" justify="center">
              <a-col :xs="22" :sm="16">
                <!--TODO: add finish status if cart (watch to cart)-->
                <a-steps>
                  <a-step class="search" status="start" :title="t('search')">
                    <template #icon>
                      <!-- @click="search"-->
                      <search-icon />
                    </template>
                  </a-step>

                  <a-step
                    class="cart"
                    status="finish"
                    :title="t('cart')"
                    @click="cartVisibility = true"
                  >
                    <template #icon>
                      <shopping-cart-icon />
                    </template>
                  </a-step>
                </a-steps>
              </a-col>
              <a-col :span="2" class="badge-wrapper">
                <a-badge
                  show-zero
                  :count="itemsInCart"
                  :offset="[0, -5]"
                  :number-style="{
                    backgroundColor: 'var(--bright_font)',
                    color: '#999',
                    boxShadow: '0 0 0 1px #d9d9d9 inset',
                  }"
                />
              </a-col>
            </a-row>
            <a-row class="order_option__card" :gutter="[10, 10]">
              <a-col style="margin-bottom: 10px" :span="24">
                <a-card
                  :title="t('domain_product.how_to_choose_the_right_domain')"
                >
                  <div>
                    <check-icon />
                    <p>
                      {{ t("domain_product.keep_your_name_easy_to_remember") }}
                    </p>
                  </div>
                  <div>
                    <check-icon />
                    <p>
                      {{
                        t("domain_product.choose_a_name_that_fit_your_brand")
                      }}
                    </p>
                  </div>
                </a-card>
              </a-col>
            </a-row>
            <a-input-search
              v-model:value="domain"
              placeholder=""
              :enter-button="t('search')"
              :loading="isDomainsLoading"
              @search="searchDomain"
            />
            <div v-if="!cartVisibility && results.length" class="description">
              <a-descriptions
                v-for="(result, i) in currentPool"
                :key="i"
                bordered
                class="description-body"
                size="small"
                :column="8"
              >
                <a-descriptions-item
                  class="description-body__domain-name"
                  :span="3"
                >
                  {{ result.name }}
                </a-descriptions-item>

                <a-descriptions-item
                  class="description-body__domain-price"
                  :span="1"
                >
                  <a-skeleton-button
                    v-if="isDomainPricesLoading || isConvertPricesLoading"
                  />
                  <span v-else>
                    {{
                      formatPrice(
                        convertedPrices.get(domainPrices.get(result.name)) || 0
                      )
                    }}
                    {{ currency.title }}
                  </span>
                </a-descriptions-item>

                <a-descriptions-item
                  class="description-body__domain-status"
                  :span="2"
                >
                  <a-tag :color="getStatusColor(result.status)">{{
                    t(`domains_view.order.domains_status.${result.status}`)
                  }}</a-tag>
                </a-descriptions-item>

                <a-descriptions-item :span="2">
                  <a-button
                    :key="i"
                    :class="
                      [
                        onCart.find((v) => v.name === result.name)
                          ? 'description-body__btn-order'
                          : 'description-body__btn-add',
                        result.status !== 'available' && 'disabled',
                      ].join(' ')
                    "
                    @click="addToCart(result)"
                    :disabled="result.status !== 'available'"
                  >
                    {{
                      onCart.find((v) => v.name === result.name)
                        ? t("domains_view.order.actions.orderNow")
                        : t("domains_view.order.actions.addToCart")
                    }}
                  </a-button>
                </a-descriptions-item>
              </a-descriptions>

              <div class="more__btn">
                <a-button
                  v-if="Math.ceil(results.length / 10) > resultsOffset"
                  ghost
                  type="primary"
                  @click="resultsOffset++"
                >
                  {{ t("more") }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <order
      v-if="cartVisibility"
      :data="dataCart"
      :on-cart="onCart"
      :items-in-cart="itemsInCart"
      :remove-from-cart="removeFromCart"
      :provider="provider"
      :plans="plans"
      :plan="plan"
      :search="
        () => {
          cartVisibility = false;
        }
      "
      :sp="sp"
      @change="(data) => (dataCart = data)"
    />
  </div>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { notification } from "ant-design-vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import api from "@/api";
import { useSpStore } from "@/stores/sp.js";
import { useAuthStore } from "@/stores/auth.js";

import order from "@/components/services/domains/order.vue";
import loading from "@/components/ui/loading.vue";
import { useAppStore } from "@/stores/app";
import { storeToRefs } from "pinia";
import { useCurrency } from "@/hooks/utils";
import { useCurrenciesStore } from "@/stores/currencies";
import { usePlansStore } from "@/stores/plans.js";
import { useAddonsStore } from "@/stores/addons";
import { levenshtein } from "@/functions";

const i18n = useI18n();
const route = useRoute();

const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);
const shoppingCartIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ShoppingCartOutlined")
);
const checkIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CheckOutlined")
);

const DOMAINS_CART_KEY = "domains_cart";

const providersStore = useSpStore();
const appStore = useAppStore();
const { onLogin } = storeToRefs(appStore);
const currenciesStore = useCurrenciesStore();
const authStore = useAuthStore();
const { isLogged } = storeToRefs(authStore);
const plansStore = usePlansStore();
const addonsStore = useAddonsStore();

const { currency, formatPrice } = useCurrency();
const { t } = useI18n();

const itemsInCart = ref(0);
const domain = ref("");
const results = ref([]);
const isDomainsLoading = ref(false);
const resultsOffset = ref(1);
const cartVisibility = ref(false);
const onCart = ref([]);
const dataCart = ref({});
const domainPrices = ref(new Map());
const isDomainPricesLoading = ref(false);
const isConvertPricesLoading = ref(false);
const convertedPrices = ref(new Map());
const cachedPlans = ref({});
const plan = ref(null);
const provider = ref(null);

onMounted(() => {
  loadCart();

  if (onLogin.value.redirect && onLogin.value.info) {
    cartVisibility.value = true;
  }
});

onUnmounted(() => {
  saveCart();
});

const currentPool = computed(() => {
  return results.value.slice(0, resultsOffset.value * 10);
});

const plans = computed(() => {
  return (
    cachedPlans.value[provider.value]?.filter(({ type, uuid }) => {
      const { items } =
        providersStore.showcases.find(
          ({ uuid }) => uuid === route.query.service
        ) ?? {};
      const plans = [];

      if (!items) return type === "opensrs";
      items.forEach(({ servicesProvider, plan }) => {
        if (servicesProvider === provider.value) {
          plans.push(plan);
        }
      });

      if (plans.length < 1) return type === "opensrs";
      return type === "opensrs" && plans.includes(uuid);
    }) ?? []
  );
});

const sp = computed(() => {
  const { items } =
    providersStore.showcases.find(({ uuid }) => uuid === route.query.service) ??
    {};

  if (!items) return [];
  return providersStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  );
});

async function searchDomain() {
  const regexWithZone = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i;
  const regexWithoutZone = /^[a-z0-9][a-z0-9-]*$/i;
  const isValid =
    regexWithZone.test(domain.value) || regexWithoutZone.test(domain.value);

  if (!isValid) {
    results.value = [];
    return;
  }

  try {
    isDomainsLoading.value = true;
    const { meta } = await api.servicesProviders.action({
      uuid: sp.value[0].uuid,
      action: "get_domains",
      params: {
        searchString: domain.value,
        gTLD: true,
        p_ccTLD: true,
        m_ccTLD: true,
      },
    });

    results.value = [];
    resultsOffset.value = 1;
    meta.domains.sort(function (a, b) {
      return (
        levenshtein(a.domain, domain.value) -
        levenshtein(b.domain, domain.value)
      );
    });
    meta.domains.forEach((el) => {
      const options = {
        name: el.domain,
        status: el.status,
      };

      if (el.domain === domain.value) {
        results.value.unshift(options);
        return;
      }
      if (el.status === "available") results.value.push(options);
    });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
    console.error(error);
  } finally {
    isDomainsLoading.value = false;
  }
}

function addToCart(result) {
  if (!onCart.value.some((item) => item.name === result.name)) {
    onCart.value.push(result);
    itemsInCart.value += 1;
  } else {
    cartVisibility.value = true;
  }
}

function removeFromCart(domain, index) {
  onCart.value.splice(index, 1);
  results.value.splice(
    results.value.findIndex((result) => result.name === domain.name),
    1
  );
  itemsInCart.value -= 1;
}

function loadCart() {
  try {
    onCart.value = JSON.parse(localStorage.getItem(DOMAINS_CART_KEY));
    itemsInCart.value = onCart.value.length;
  } catch {
    onCart.value = [];
    itemsInCart.value = 0;
  }
}

function saveCart() {
  localStorage.setItem(DOMAINS_CART_KEY, JSON.stringify(onCart.value));
}

function getStatusColor(status) {
  return status === "available" ? "green" : "red";
}

async function fetch() {
  try {
    await Promise.all([
      authStore.fetchBillingData(),
      providersStore.fetch(!authStore.isLogged),
    ]);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
    console.error(error);
  }
}

fetch();

watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid;
});

watch(sp, async (value) => {
  const uuid = value[0].uuid;
  if (!uuid) {
    return;
  }

  if (cachedPlans.value[uuid]) return;
  try {
    const { pool } = await plansStore.fetch({
      anonymously: !isLogged.value,
      sp_uuid: uuid,
    });

    cachedPlans.value[uuid] = pool;
    plan.value = plans.value[0]?.uuid;

    await addonsStore.fetch({
      filters: { plan_uuid: [plan.value] },
    });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message });
  }
});

watch(currentPool, () => {
  currentPool.value.forEach(async ({ name }) => {
    async function getDomainPriceForYear(name) {
      const data = await api.servicesProviders.action({
        uuid: sp.value[0]?.uuid,
        action: "get_domain_price",
        params: { domain: name },
      });
      const price = data.meta.price;
      const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);

      return (
        +price +
        (fullPlan.fee.default ? price * (fullPlan.fee.default / 100) : 0)
      );
    }

    isDomainPricesLoading.value = true;

    if (domainPrices.value.get(name)) {
      return;
    }

    try {
      const promise = getDomainPriceForYear(name);

      domainPrices.value.set(name, promise);

      const price = await promise;

      domainPrices.value.set(name, price);
    } catch {
      domainPrices.value.delete(name);
    } finally {
      isDomainPricesLoading.value = [...domainPrices.value.values()].some(
        (v) => v instanceof Promise
      );
    }
  });
});

watch([isDomainPricesLoading, currency], async (curr, last) => {
  if (curr[1].code !== last[1].code) {
    convertedPrices.value.clear();
  }

  if (!isDomainPricesLoading.value) {
    const uniqueAmounts = new Set(
      [...domainPrices.value.values()].filter(
        (price) => !convertedPrices.value.has(price)
      )
    );

    isConvertPricesLoading.value = true;
    try {
      const amounts = [...uniqueAmounts.values()];

      const response = await currenciesStore.convert({
        from: "USD",
        to: currency.value.code,
        amounts,
      });

      amounts.forEach((price, index) => {
        convertedPrices.value.set(price, response.amounts[index]);
      });
    } finally {
      isConvertPricesLoading.value = false;
    }
  }
});
</script>

<script>
export default { name: "DomainsComponent" };
</script>

<style>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  margin-top: 20px;
  width: 100%;
  max-width: 768px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.order__inputs {
  width: 100%;
}

.order__field {
  margin-bottom: 20px;
  border-radius: 10px;
  padding: 23px 78px;
  background-color: var(--bright_font);
  height: max-content;
}

/*--steps--*/
.search {
  font-weight: 600;
  font-size: 18px;
  margin-right: 12px;
}

.search div.ant-steps-item-icon,
.search div.ant-steps-item-content {
  cursor: pointer !important;
}

.cart {
  font-weight: 600;
  font-size: 18px;
  margin-right: 0;
  padding-right: 28px;
  cursor: pointer;
}

.anticon-shopping-cart {
  font-size: 28px;
}

/*--card--*/
.order_option__card {
  padding-bottom: 15px;
}

.ant-card-head {
  border-bottom: none;
}

.ant-card-head-title {
  padding-bottom: 0;
  font-size: 11px;
  font-family: sans-serif;
  font-weight: bold;
  padding-left: 7px;
}

.ant-card-body {
  padding: 0 35px 13px;
  margin-top: -8px;
}

.anticon-check {
  margin: 0 5px;
}

.ant-card-body p {
  display: inline;
  font-size: 13px;
  color: black;
}

/*--input--*/
.ant-input-group .ant-input {
  width: 100%;
}

input.ant-input:focus {
  box-shadow: none;
}

.ant-input-group-addon {
  width: 22%;
}

.ant-input-search-button {
  width: 100%;
  background-color: var(--main) !important;
}

/*--description--*/
.description {
  padding: 12px;
  margin-top: 18px;
  background-color: var(--bright_bg);
}

.description-header {
  display: flex;
  margin-bottom: 2px;
}

.anticon-like {
  font-size: 27px;
  color: grey;
  display: inline-block;
}

.description-header p {
  margin-top: 4px;
  margin-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: var(--success);
  background-color: var(--bright_bg);
  display: inline;
}

.description-body {
  background-color: var(--bright_bg);
}

.description-body__domain-name {
  color: black;
}

.description-body__btn-add {
  background-color: var(--main);
  color: var(--bright_font);
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: var(--main);
}
.ant-btn.description-body__btn-add:hover {
  color: var(--main);
  background-color: var(--bright_font);
  border-color: var(--main);
}

.description-body__btn-order {
  background-color: var(--success);
  color: var(--bright_font);
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: var(--success);
}
.ant-btn.description-body__btn-order:hover {
  color: var(--success);
  background-color: var(--bright_font);
  border-color: var(--success);
}

.ant-btn.description-body__btn-add.disabled:hover {
  color: rgba(0, 0, 0, 0.25);
  background-color: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.25);
}

div.ant-descriptions-view {
  border-color: var(--bright_bg) !important;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

th.ant-descriptions-item-label.ant-descriptions-item-colon.ant-descriptions-item-no-label {
  border: none;
  margin: 0;
  padding: 0;
}

td.ant-descriptions-item-content {
  padding: 7px 0 2px !important;
  font-weight: 400; /*!important*/
  font-size: 12px;
  text-align: center;
}
td.ant-descriptions-item-content:nth-child(2) {
  width: 184px;
  text-align: start;
  border: none;
}

.description-btn-more {
  display: flex;
  width: 150px;
  color: var(--bright_font);
  padding: 7px;
  font-size: 12px;
  margin: 30px 2px 5px 0;
  border-color: var(--main);
  align-items: center;
  justify-content: center;
}

.description-btn-more:hover {
  color: var(--bright_font);
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
}

.more__btn {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ant-descriptions-item-content.description-body__domain-price {
  width: 110px !important;
}

.ant-descriptions-item-content.description-body__domain-status span {
  width: 90px !important;
  text-align: center;
}
/*media*/
/*@media screen and (max-width: 1024px) {
  .order{
    flex-direction: column;
    padding: 10px;
    margin-top: 0;
    overflow: auto;
  }
  .order__inputs{
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
  }
  .order__field{
    box-shadow: none;
    flex-grow: 0;
  }
}*/

/*@media screen and (max-width: 576px) {
  .order__template{
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
  .order__template-item{
    grid-template-columns: max-content auto;
    grid-template-rows: 1fr;
    width: auto;
    height: 50px;
  }
  .order__template-item:not(:last-child){
    margin-right: 0px;
  }
  .order__template-image{
    width: 50px;
    height: 50px;
    padding: 4px;
  }
  .order__template-image__rate{
    line-height: 42px;
    font-size: 1.4rem;
  }
  .order__template-image img{
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  .order__template-name{
    text-align: left;
    line-height: 30px;
    display: flex;
  }
  .order__template-type{
    width: 56px;
  }
  .order__template-name ul{
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1
  }
  .order__template-name ul li{
    margin-left: 20px;
  }
}

.networkApear-enter-active, .networkApear-leave-active {
  transition: opacity .5s, height .5s;
  height: 26px;
}
.networkApear-enter-from, .networkApear-leave-to {
  opacity: 0;
  height: 0;
}*/
</style>
