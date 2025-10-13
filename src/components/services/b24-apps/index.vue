<template>
  <div class="order_wrapper">
    <div class="order" v-if="!fetchLoading">
      <div>
        <div
          style="display: flex; justify-content: center; align-items: center"
        >
          <a-carousel
            ref="carousel"
            style="max-width: 60vw; max-height: 40vh"
            arrows
            dots-class="slick-dots slick-thumb"
            :before-change="onCarouselChange"
          >
            <template #customPaging="props">
              <a>
                <img :src="sizes[props.i].image" />
              </a>
            </template>
            <div v-for="size in sizes" :key="size.key">
              <img :src="size.image" />
            </div>
          </a-carousel>
        </div>

        <div class="order__grid-item">
          <h4 class="product_name">
            {{ sizes[currentSelectedIndex]?.label }}
          </h4>

          <div
            v-if="getResources(sizes[currentSelectedIndex])?.length"
            class="product_resources"
          >
            <a-tag
              color="blue"
              v-for="resource of getResources(sizes[currentSelectedIndex])"
              :key="resource.id"
            >
              {{ resource.key }}: {{ resource.title }}
            </a-tag>
          </div>

          <div
            class="product_description"
            v-else
            v-html="sizes[currentSelectedIndex]?.description"
          ></div>
        </div>

        <promo-block class="order__promo" />
      </div>

      <div class="order__calculate order__field">
        <a-row justify="space-around" style="margin-top: 5px">
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t("Pay period") }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12">
            <a-select
              v-if="!fetchLoading"
              v-model:value="options.period"
              style="width: 100%"
            >
              <a-select-option v-for="period in periods" :key="period">
                {{ getPeriod(period) }}
              </a-select-option>
            </a-select>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row
          v-for="addon of options.addons"
          :key="addon"
          justify="space-around"
          style="margin-top: 20px"
        >
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ capitalize(getAddon(addon).title) }}:
          </a-col>

          <a-col
            :xs="12"
            :sm="18"
            :lg="12"
            style="font-size: 1.1rem; text-align: right"
          >
            {{ getAddon(addon).price }} {{ currency.title }}
          </a-col>
        </a-row>

        <selects-to-create
          v-model:plan="plan"
          v-model:service="service"
          v-model:namespace="namespace"
          v-model:provider="provider"
          :plans-list="plans"
          :sp-list="sp"
          :is-plans-visible="false"
        />

        <a-row>
          <h2>{{ currentProduct.title }}</h2>
        </a-row>

        <a-row style="width: 100%">
          <a-col :span="24">
            <a-form-item
              :help="domainError ? $t('domain is wrong') : ''"
              :label="$t('ssl_product.domain')"
              :validate-status="domainError ? 'error' : ''"
            >
              <a-input
                v-model:value="options.domain"
                :placeholder="$t('ssl_product.domain')"
                @blur="validateDomain"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <div v-if="currentProduct?.meta?.resources?.length" class="resources">
          <p
            v-for="resource of currentProduct?.meta?.resources"
            :key="resource.id"
          >
            {{ resource.key }}: {{ resource.title }}
          </p>
        </div>

        <a-divider orientation="left" :style="{ 'margin-bottom': '0' }">
          {{ $t("Total") }}:
        </a-divider>

        <a-row justify="space-around">
          <a-col style="font-size: 1.5rem">
            <template v-if="!fetchLoading">
              <div class="price__sale" v-if="isSaleApply">
                <span class="without_sale">
                  {{ formatPrice(currentProduct.price, currency) }}
                  {{ currency.title }}
                </span>

                <span>
                  {{ formatPrice(currentProductWithSale.price, currency) }}
                  {{ currency.title }}
                </span>
              </div>
              <template v-else>
                {{ (currentProduct.price ?? 0) + (addonsPrice || 0) }}
                {{ currency.title }}
              </template>
            </template>
            <div v-else class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

        <promocode-menu
          :plan-id="plan"
          :applyed-promocode="planWithApplyedPromocode"
          :is-flavors-loading="fetchLoading"
          @update:promocode="promocode = $event"
        />

        <a-row justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button type="primary" block shape="round" @click="orderConfirm">
              {{ capitalize($t("order")) }}
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
                {{ currentProduct.title }}
              </p>
            </a-modal>
          </a-col>
        </a-row>
      </div>
    </div>

    <loading v-else />
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { computed, inject, watch } from "vue";
import useCreateInstance from "@/hooks/instances/create.js";
import { useCurrency, useNotification, usePeriod } from "@/hooks/utils";
import { checkPayg } from "@/functions.js";
import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useAddonsStore } from "@/stores/addons.js";
import { useSpStore } from "@/stores/sp.js";
import { usePlansStore } from "@/stores/plans.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";
import promoBlock from "@/components/ui/promo.vue";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { usePromocodesStore } from "@/stores/promocodes";
import { useDescriptionsStore } from "@/stores/descriptions";
import useServiceId from "@/hooks/services/serviceId";
import Loading from "@/components/ui/loading.vue";
import PromocodeMenu from "@/components/ui/promocode-menu.vue";

const namespacesStore = useNamespasesStore();
const spStore = useSpStore();
const plansStore = usePlansStore();
const instancesStore = useInstancesStore();
const promocodesStore = usePromocodesStore();
const addonsStore = useAddonsStore();
const authStore = useAuthStore();
const descriptionsStore = useDescriptionsStore();
const { onLogin } = storeToRefs(useAppStore());
const { isLogged, userdata } = storeToRefs(authStore);

const { addons } = storeToRefs(useAddonsStore());

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const notification = useNotification();

const checkBalance = inject("checkBalance", () => {});

const { currency, formatPrice } = useCurrency();
const { createInstance } = useCreateInstance();
const { getPeriod } = usePeriod();

const { serviceId } = useServiceId("bitrix24");

const carousel = ref(null);

const plan = ref(null);
const planWithApplyedPromocode = ref(null);
const provider = ref(null);
const promocode = ref(null);
const fetchLoading = ref(false);
const options = ref({ size: "", period: "", addons: [], domain: "" });
const modal = ref({ confirmCreate: false, confirmLoading: false });
const products = ref({});
const sizes = ref([]);
const cachedPlans = ref({});
const currentSelectedIndex = ref(0);
const periods = ref([]);
const domainError = ref(false);

function onCreated() {
  fetchLoading.value = true;
  const promises = [
    authStore.fetchBillingData(),
    spStore.fetch(!isLogged.value),
  ];

  if (isLogged.value) {
    promises.push(namespacesStore.fetch(), instancesStore.fetch());
  }

  if (addons.value.length < 1) {
    addonsStore.fetch();
  }

  Promise.all(promises).catch((err) => {
    const message = err.response?.data?.message ?? err.message ?? err;
    if (err.response?.data?.code === 16) return;
    notification.openNotification("error", { message: t(message) });
    console.error(err);
  });

  if (route.query.domain) {
    options.value.domain = route.query.domain;
    validateDomain();
  }

  if (route.query.product) {
    options.value.size = route.query.product;
  }
}

onCreated();

const changePeriods = (key) => {
  periods.value = [];
  Object.values(sizes.value).forEach((product) => {
    Object.keys(product.keys).forEach((period) => {
      if (periods.value.includes(+period)) return;
      periods.value.push(+period);
    });
  });

  periods.value.sort((a, b) => a - b);
  if (periods.value.includes(options.value.period)) return;
  const data = JSON.parse(route.query.data ?? "{}");

  if (data.period && periods.value.includes(+data.period)) {
    options.value.period = +data.period;
  } else {
    options.value.period = periods.value[0];
  }
};

function validateDomain() {
  const domain = options.value.domain?.trim();

  if (!domain) {
    domainError.value = true;
    return;
  }

  const cleanDomain = domain.replace(/^https?:\/\//, "");

  const domainOnly = cleanDomain.split("/")[0];

  const domainPattern =
    /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.(?:[a-zA-Z0-9-]{1,63}(?<!-)\.)*[a-zA-Z]{2,}$/;

  domainError.value = !domainPattern.test(domainOnly);
  options.value.domain = domainOnly;
}

function getProduct(products, options) {
  if (Object.keys(products).length === 0) return "NAN";

  const product =
    sizes.value.find(
      (size) => size.keys[options.period.toString()] === options.size
    ) || {};

  const price =
    product.price?.[options.period] +
    options.addons.reduce((sum, id) => {
      const addon = product.addons?.find(({ key }) => key === id);
      const period = addon?.period / product.period;

      if (!addon) return sum;
      return sum + addon.price * (period >= 1 ? period : 1 / period);
    }, 0);

  const description = product.description;

  const planId = plans.value.find(
    (p) => p.products[options.size]?.period == options.period
  )?.uuid;

  return {
    ...product,
    title: product.label,
    price: formatPrice(price),
    meta: { ...product.meta },
    description,
    planId,
  };
}

const currentProduct = computed(() => {
  return getProduct(products.value, options.value);
});

const showcase = computed(
  () => spStore.showcases.find(({ uuid }) => uuid === serviceId.value) ?? {}
);

const plans = computed(() => {
  return (
    cachedPlans.value[`${provider.value}_${currency.value.code}`]?.filter(
      ({ type, uuid }) => {
        const { items } = showcase.value;
        const plans = [];

        if (!items) return type === "bitrix24";
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === provider.value) {
            plans.push(plan);
          }
        });

        if (plans.length < 1) return type === "bitrix24";
        return type === "bitrix24" && plans.includes(uuid);
      }
    ) ?? []
  );
});

const sp = computed(() => {
  const { items } = showcase.value;

  if (!items) return [];
  return spStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  );
});

const changeProducts = () => {
  const productsAndSizes = plans.value.reduce(
    (result, plan) => {
      for (const [key, product] of Object.entries(plan.products)) {
        const i = result.sizes.findIndex(
          ({ label }) => label === product.title
        );

        if (!product.public) continue;
        result.products.push([key, product, plan.uuid]);

        const description =
          descriptionsStore.cachedADescriptions[product.descriptionId]?.text ||
          product.meta.description;

        if (i === -1) {
          result.sizes.push({
            keys: { [product.period]: key },
            label: product.title,
            group: product.group ?? product.title,
            price: { [product.period]: product.price },
            sorter: product.sorter,
            image: product.meta.image,
            description,
          });
        } else {
          result.sizes[i].keys[product.period] = key;
          result.sizes[i].price[product.period] = product.price;
        }
      }

      return result;
    },
    { products: [], sizes: [] }
  );

  const plan = plans.value.at(0);

  productsAndSizes.products.forEach(([productKey, value, planId]) => {
    products.value[productKey] = {
      ...value,
      planId,
      addons: plan.resources.filter(({ key }) =>
        value.meta.addons?.includes(key)
      ),
    };
  });

  sizes.value = productsAndSizes.sizes;
};

function onCarouselChange(prev, currentIndex) {
  currentSelectedIndex.value = currentIndex;
}

const getResources = (size) => {
  if (!size) {
    return [];
  }
  const key = size.keys[options.value.period];

  return products.value[key]?.meta?.resources;
};

const orderClickHandler = () => {
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);
  const { resources = [] } = currentProduct.value.meta;

  const instance = {
    config: { auto_start: fullPlan.meta.auto_start },
    resources: resources.reduce(
      (result, { key, title }) => {
        result[key] = title;
        return result;
      },
      { bitrix_domain: options.value.domain }
    ),
    title: currentProduct.value.title,
    billing_plan: fullPlan,
    product: options.value.size,
    addons: options.value.addons,
  };

  if (!userdata.value.uuid) {
    onLogin.value.redirect = route.name;
    onLogin.value.redirectQuery = route.query;
    onLogin.value.info = {
      type: "custom",
      title: [
        showcase.value.promo?.[locale.value]?.title ??
          showcase.value.title ??
          "custom",
        currentProduct.value.title,
      ].join(" - "),
      cost: currentProduct.value.price,
      currency: currency.value.code,
      goToInvoice: modal.value.goToInvoice,
    };
    onLogin.value.action = () => {
      return { ...options.value, plan: plan.value };
    };

    router.push({ name: "login" });
    return;
  }

  createVirtual(instance);
};
const createVirtual = async (instance) => {
  modal.value.confirmLoading = true;
  onLogin.value = {};

  try {
    await createInstance(instance, {
      promocode: promocode.value?.uuid,
      provider: provider.value,
    });
    router.push({ path: "/billing" });
  } catch {
    console.error(error);
  }
};
const orderConfirm = () => {
  validateDomain();
  if (domainError.value) return;

  const instance = {
    config: {},
    billingPlan: plans.value.find(({ uuid }) => uuid === plan.value),
  };
  const isPayg = checkPayg(instance);
  const { price } = currentProduct;

  if (isPayg && !checkBalance(price)) return;
  modal.value.confirmCreate = true;
};

const fetchPlans = async (provider) => {
  if (!currency.value.code) {
    return;
  }
  const cacheKey = `${provider}_${currency.value.code}`;

  if (cachedPlans.value[cacheKey]) return;
  try {
    const { pool } = await plansStore.fetch({
      anonymously: !isLogged.value,
      sp_uuid: provider,
    });

    const descriptions = [];
    pool.forEach((p) =>
      Object.keys(p.products || {}).forEach((key) =>
        descriptions.push(p.products[key]?.descriptionId)
      )
    );
    await Promise.allSettled(
      descriptions.filter((d) => !!d).map((d) => descriptionsStore.fetchById(d))
    );

    cachedPlans.value[cacheKey] = pool;
    plan.value = plans.value[0]?.uuid;
    changeProducts();
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.openNotification("error", { message });
  } finally {
    fetchLoading.value = false;

    setTimeout(async () => {
      const { action } = onLogin.value;
      if (typeof action !== "function") return;

      const oldOptions = action();

      plan.value = oldOptions.plan;

      options.value.size = oldOptions.size;
      options.value.addons = oldOptions.addons;
      options.value.period = oldOptions.period;
      options.value.domain = oldOptions.domain;
      const indexOfProduct = sizes.value.findIndex(
        (size) => size.keys[options.value.period] === options.value.size
      );
      if (indexOfProduct !== -1) {
        carousel.value.goTo(indexOfProduct, false);
      }
      onLogin.value = {};
    }, 1000);
  }
};

watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid;
});
watch([provider, currency], () => {
  fetchPlans(provider.value);
});

watch([sizes, currentSelectedIndex], (newVal, prevVal) => {
  if (prevVal[0].length === 0 && options.value.size) {
    changePeriods();
    const indexOfProduct = sizes.value.findIndex(
      (size) => size.keys[options.value.period] === options.value.size
    );
    if (indexOfProduct !== -1) {
      setTimeout(() => {
        carousel.value.goTo(indexOfProduct, false);
      }, 100);

      return;
    }
  }
  const { keys } = sizes.value?.at(currentSelectedIndex.value) ?? {};

  if (keys && options.value.period) {
    options.value.size = keys[options.value.period];
  } else if (keys) {
    options.value.size = Object.values(keys)[0];
  }
});

watch(currentProduct, () => {
  changePeriods()

  plan.value = currentProduct.value.planId || plan.value;
});

watch([promocode, currency], async () => {
  if (!promocode.value || !currency.value || !plan.value) {
    planWithApplyedPromocode.value = null;
    return;
  }

  const response = await promocodesStore.applyToPlan({
    promocodes: [promocode.value.uuid],
    billingPlan: plan.value,
    addons: [],
  });

  planWithApplyedPromocode.value = response.toJson().billingPlans[0];
});
</script>

<script>
export default {
  name: "B24Apps",
};
</script>

<style scoped lang="scss">
:deep(.slick-dots) {
  position: relative;
  height: auto;
  margin-top: 10px;
}

:deep(.slick-slide img) {
  border: 5px solid #fff;
  display: block;
  margin: auto;
  height: 30vh;
  width: 60vw;
  max-width: 750px;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

:deep(.slick-slide img:hover) {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

:deep(.slick-thumb) {
  bottom: 0px;
}

:deep(.slick-thumb li) {
  width: 80px;
  height: 60px;

  &.slick-active {
    width: 80px;
    height: 60px;
  }

  img {
    width: 100%;
    height: 100%;
    filter: grayscale(100%);
    display: block;
    border: 2px solid transparent;
    border-radius: 5px;
    transition: border-color 0.3s, transform 0.3s;
    object-fit: cover;

    &:hover {
      filter: grayscale(0%);
    }
  }

  &.slick-active img {
    filter: grayscale(0%);
    border-color: #1890ff;
    transform: scale(1.1);
  }
}

.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: 10px;
}

.order {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;

  &__grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    h1 {
      margin-bottom: 5px;
      color: inherit;
      font-size: 18px;
      font-weight: 700;
    }

    p {
      margin-bottom: 6px;
      line-height: 1.2;
    }
  }
}

.product_name {
  font-size: 1.3rem;
}

.product_resources {
  display: flex;
  flex-wrap: wrap;
  row-gap: 5px;

  span {
    margin-inline-start: 2px;
    margin-inline-end: 2px;
    font-size: 0.9rem;
  }
}

.product_description {
  max-width: 800px;
  p {
    margin: 0px !important;
  }
}

.price__sale {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  .without_sale {
    text-decoration: line-through;
    margin-right: 10px;
  }
}

.order__field {
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  padding: 5px 10px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate {
  padding: 10px 15px 10px;
  font-size: 1.1rem;
  position: absolute;
  right: 200px;

  min-width: 350px;
}

@media (max-width: 576px) {
  .order__calculate {
    position: unset;
    padding: 20px;
  }
}

@media (max-width: 1000px) {
  .order__calculate {
    right: 10px;
  }
}

@media (max-width: 1600px) {
  .order__calculate {
    right: 50px;
  }
}

@media (max-width: 1400px) {
  .order__calculate {
    right: 25px;
  }
}
</style>

<style>
.price__sale {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.price__sale .without_sale {
  text-decoration: line-through;
  margin-right: 10px;
}

.product_description p {
  margin: 0px !important;
}
</style>
