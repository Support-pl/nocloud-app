<template>
  <div class="order_wrapper">
    <div class="order">
      <div>
        <div v-if="sizes.length > 1" class="order__field order_filters">
          <h3>{{ capitalize($t("filters")) }}</h3>

          <a-input
            style="margin-bottom: 5px"
            v-model:value="searchParam"
            :placeholder="capitalize($t('search'))"
          >
            <template #suffix>
              <search-icon style="font-size: 20px" />
            </template>
          </a-input>

          <template v-if="typesOptions.length > 1">
            {{ capitalize($t("group")) }}:
            <a-select
              v-model:value="checkedGroups"
              allow-clear
              style="width: 100%"
              :placeholder="capitalize($t('select'))"
              :options="typesOptions.map((value) => ({ value, label: value }))"
            />
          </template>

          <filters-view
            v-if="Object.keys(filters).length > 0"
            :type="filtersType"
            :filters="filters"
            :resources="resources"
            @update:filter="(key, value) => (filters[key] = value)"
          />

          <a-button
            type="primary"
            style="margin-top: 10px"
            @click="resetFilters"
          >
            {{ $t("Reset") }}
          </a-button>
          <a-divider v-if="viewport < 1024" style="margin: 20px 0 0" />
        </div>
      </div>

      <div class="order__field order__main">
        <div class="order__option">
          <div class="sortings">
            <a-space v-if="!fetchLoading">
              <span>{{ t("sort_by") }}:</span>
              <a-button
                v-for="key in sortKeys"
                :key="key.value"
                :type="sortField === key.value ? 'default' : 'text'"
                @click="toggleSort(key.value)"
              >
                {{ key.label }}

                <component :is="getSortIcon(key.value)" />
              </a-button>
            </a-space>
          </div>

          <div
            v-if="sizesByPage.length > 0"
            :class="{
              order__grid: true,
              order__grid__solo: sizesByPage.length === 1,
            }"
          >
            <div
              v-for="size of sizesByPage"
              :key="size.keys[options.period]"
              class="order__grid-item"
              :class="{
                'order__grid-item--grid': size.image,
                'order__grid-item--active':
                  options.size === size.keys[options.period],
              }"
              :style="{
                padding: size.image ? '10px' : '',
                position: 'relative',
              }"
              @click="selectCollapsePanel(size.keys)"
            >
              <div class="product_price">
                <span>
                  {{ formatPrice(size.price[options.period], currency) }}
                  {{ currency.title }}
                </span>
              </div>

              <div
                v-if="options.size === size.keys[options.period]"
                class="product_selected"
              >
                <check-circle style="font-size: 1.5rem" />
              </div>

              <img
                v-if="size.image"
                style="margin-right: 5px"
                :src="size.image"
                :alt="size.label"
              />

              <h4 class="product_name">
                {{ size.label }}
              </h4>

              <div v-if="getResources(size)?.length" class="product_resources">
                <a-tag
                  color="blue"
                  v-for="resource of getResources(size)"
                  :key="resource.id"
                >
                  {{ resource.key }}: {{ resource.title }}
                </a-tag>
              </div>

              <div v-else v-html="size.description"></div>
            </div>
          </div>

          <a-card
            v-if="fetchLoading || filteredAddons?.length > 0"
            style="margin-top: 15px"
            :title="
              !fetchLoading
                ? `${$t('Addons')} (${$t('choose addons you want')})`
                : null
            "
            :loading="fetchLoading"
          >
            <div v-if="fetchLoading">Loading...</div>
            <template v-else>
              <a-card-grid
                v-for="addon of filteredAddons"
                :key="addon.uuid"
                class="card-item"
                @click="changeAddons(addon.uuid)"
              >
                <div
                  class="order__slider-name"
                  style="grid-template-columns: 1fr auto auto; gap: 5px"
                >
                  <span style="font-weight: 700; font-size: 16px">
                    {{ addon.title }}
                  </span>

                  <span style="font-weight: 700">
                    {{ getPeriod(currentProduct.period) }}
                  </span>

                  <a-checkbox :checked="options.addons.includes(addon.uuid)" />
                  <span
                    style="grid-column: 1 / 4"
                    v-html="addon.description ?? ''"
                  />
                </div>
              </a-card-grid>
            </template>
          </a-card>

          <custom-pagination
            style="margin-top: 10px"
            :visible="filteredSizes.length > 10"
            :options="paginationOptions"
            @update:options="(key, value) => (paginationOptions[key] = value)"
          />
        </div>
      </div>

      <div>
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
                  {{ (currentProduct.price ?? 0) + addonsPrice }}
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
              <a-button
                type="primary"
                block
                shape="round"
                @click="orderConfirm"
              >
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

      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import {
  capitalize,
  computed,
  defineAsyncComponent,
  inject,
  nextTick,
  watch,
} from "vue";
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
import selectsToCreate from "@/components/ui/selectsToCreate.vue";
import customPagination from "@/components/ui/pagination.vue";
import filtersView from "@/components/ui/filters.vue";
import promoBlock from "@/components/ui/promo.vue";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import promocodeMenu from "@/components/ui/promocode-menu.vue";
import { usePromocodesStore } from "@/stores/promocodes";
import { h } from "vue";
import { useDescriptionsStore } from "@/stores/descriptions";

const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);

const checkCircle = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CheckCircleTwoTone")
);

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

const { getPeriod } = usePeriod();
const { currency, formatPrice } = useCurrency();
const { createInstance } = useCreateInstance();

const plan = ref(null);
const planWithApplyedPromocode = ref(null);
const service = ref(null);
const namespace = ref(null);
const searchParam = ref("");
const checkedGroups = ref();
const provider = ref(null);
const promocode = ref(null);
const fetchLoading = ref(false);
const options = ref({ size: "", period: "", addons: [] });
const modal = ref({ confirmCreate: false, confirmLoading: false });
const products = ref({});
const periods = ref([]);
const sizes = ref([]);
const filters = ref({});
const filtersType = ref("range-with-prefixes");
const paginationOptions = ref({ total: 0, size: 10, page: 1 });
const cachedPlans = ref({});
const activeCollapseKey = ref([]);

const sortField = ref("default");
const sortOrder = ref("asc");

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
}

onCreated();

function getProduct(products, options) {
  if (Object.keys(products).length === 0) return "NAN";
  const { title } = products[options.size];

  const product = Object.values(products).find(
    (product) =>
      product.title == title && +(product.period || 0) == (options.period || 0)
  );

  const price =
    product.price +
    options.addons.reduce((sum, id) => {
      const addon = product.addons?.find(({ key }) => key === id);
      const period = addon?.period / product.period;

      if (!addon) return sum;
      return sum + addon.price * (period >= 1 ? period : 1 / period);
    }, 0);
  const description =
    descriptionsStore.cachedADescriptions[product.descriptionId]?.text ||
    product.meta.description;

  return {
    ...product,
    price: formatPrice(price),
    meta: { ...product.meta },
    description,
  };
}

const currentProduct = computed(() => {
  return getProduct(products.value, options.value);
});

const isSaleApply = computed(() => !!planWithApplyedPromocode.value);
const currentProductWithSale = computed(() => {
  if (!isSaleApply.value) {
    return {};
  }

  return getProduct(planWithApplyedPromocode.value.products, options.value);
});
const resources = computed(() => {
  if (sizes.value.length < 2) return {};
  const result = {};

  sizes.value.forEach((size) => {
    const key = size.keys[options.value.period];
    const value = products.value[key]?.meta.resources ?? [];

    value.forEach(({ key, value, group }) => {
      if (!key) return;
      if (!result[key]) result[key] = [];
      if (result[key].includes(group || value)) return;

      result[key].push(group || value);
      result[key].sort((a, b) => {
        if (isNaN(parseFloat(a)) && isNaN(parseFloat(b))) {
          return a.localeCompare(b);
        } else if (isNaN(parseFloat(a))) {
          return -1;
        } else if (isNaN(parseFloat(b))) {
          return 1;
        }
        return parseFloat(a) - parseFloat(b);
      });
    });

    if (!result.$price) result.$price = [];
    if (products.value[key]) {
      result.$price.push(products.value[key].price);
    }
  });

  Object.keys(result).forEach((key) => {
    result[key] = result[key]?.filter((r) => r !== "default");

    if (result[key].length < 2) {
      delete result[key];
    }
  });

  return result;
});
const filteredAddons = computed(() => {
  const product = products.value[options.value.size];
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);

  return addons.value.filter(
    ({ uuid }) =>
      fullPlan.addons.includes(uuid) || product?.addons.includes(uuid)
  );
});
const addonsPrice = computed(() => {
  return options.value.addons.reduce(
    (result, uuid) => result + (getAddon(uuid)?.price ?? 0),
    0
  );
});
const typesOptions = computed(() => {
  const types = [];

  sizes.value.forEach(({ group, label }) => {
    if (types.includes(group)) return;
    types.push(group ?? label);
  });

  types.sort((a, b) => {
    const nameA = (a || "").toString().trim();
    const nameB = (b || "").toString().trim();

    if (a.toLowerCase() === "распродажа") return -1;
    if (b.toLowerCase() === "распродажа") return 1;

    return nameA.localeCompare(nameB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return types.filter((t) => t != "default");
});
const filteredSizes = computed(() => {
  const filtred = sizes.value.filter(({ group, keys, label }) => {
    const { meta, price } = products.value[keys[options.value.period]] ?? {};
    let isIncluded = true;

    if (!keys[options.value.period]) return false;

    const isPricesEqual = checkPricesEqual(price, filters.value.$price || []);

    if (
      searchParam.value &&
      !label?.toLowerCase().startsWith(searchParam.value.toLowerCase())
    ) {
      isIncluded = false;
    }

    if (checkedGroups.value && checkedGroups.value !== group) {
      isIncluded = false;
    }

    return (
      isIncluded &&
      isPricesEqual &&
      (!meta?.resources ||
        meta?.resources?.every(({ key, value, group }) => {
          const a = filters.value[key]?.at(0) <= (group || value);
          const b = filters.value[key]?.at(-1) >= (group || value);
          const isNotNumber = filters.value[key]?.some((value) => isNaN(value));

          if (filters.value[key]?.length < 1) return true;
          if (isNotNumber) {
            return filters.value[key].includes(group || value);
          }
          return filters.value[key] ? a && b : true;
        }))
    );
  });

  filtred.sort((a, b) => {
    if (sortOrder.value === "desc" && sortField.value !== "default") {
      const temp = a;
      a = b;
      b = temp;
    }

    if (sortField.value === "price") {
      return a.price[options.value.period] - b.price[options.value.period];
    } else if (sortField.value === "default") {
      const sorterA = a.sorter ?? Number.MAX_SAFE_INTEGER;
      const sorterB = b.sorter ?? Number.MAX_SAFE_INTEGER;

      if (sorterA !== sorterB) {
        return sorterA - sorterB;
      }
      const nameA = (a.label || "").toString();
      const nameB = (b.label || "").toString();
      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    } else {
      const aRes = (
        getResources(a).find((r) => r.key === sortField.value).value || ""
      ).toString();
      const bRes = (
        getResources(b).find((r) => r.key === sortField.value).value || ""
      ).toString();

      return parseForSort(aRes) - parseForSort(bRes);
    }
  });

  return filtred;
});

const sizesByPage = computed(() => {
  const start =
    paginationOptions.value.size * (paginationOptions.value.page - 1);
  const end = start + paginationOptions.value.size;

  return filteredSizes.value.slice(start, end);
});

const plans = computed(() => {
  return (
    cachedPlans.value[`${provider.value}_${currency.value.code}`]?.filter(
      ({ type, uuid }) => {
        const { items } =
          spStore.showcases.find(({ uuid }) => uuid === route.query.service) ??
          {};
        const plans = [];

        if (!items) return type === "empty";
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === provider.value) {
            plans.push(plan);
          }
        });

        if (plans.length < 1) return type === "empty";
        return type === "empty" && plans.includes(uuid);
      }
    ) ?? []
  );
});

const sp = computed(() => {
  const { items } =
    spStore.showcases.find(({ uuid }) => uuid === route.query.service) ?? {};

  if (!items) return [];
  return spStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  );
});

const viewport = computed(() => {
  return document.documentElement.offsetWidth;
});
const groupWidthStyle = computed(() => {
  const count = typesOptions.value.length > 3 ? 3 : typesOptions.value.length;

  return viewport.value >= 1024 ? `calc(${100 / count}% - 10px)` : "100%";
});
const groupWrapStyle = computed(() => {
  if (typesOptions.value.length > 3) return "wrap";
  return null;
});

const sortKeys = computed(() => {
  const result = [];

  result.push({ label: t("Default"), value: "default" });
  result.push({ label: t("Cost"), value: "price" });

  Object.keys(resources.value).forEach((resource) => {
    if (
      resources.value[resource].length > 2 &&
      !resource.includes("$") &&
      parseForSort((resources.value[resource][1] || "").toString()) !== 0
    ) {
      result.push({ value: resource, label: resource });
    }
  });

  return result;
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

  const data = JSON.parse(route.query.data ?? "{}");

  if (route.query.product) {
    setTimeout(() => {
      options.value.size = route.query.product;
    }, 100);
  } else if (data.productSize) {
    options.value.size = data.productSize;
  } else if (typesOptions.value.length < 2) {
    nextTick(() => {
      options.value.size = Object.values(sizes.value[0]?.keys ?? {})[0] ?? "";
    });
  }
};
const changePeriods = (key) => {
  periods.value = [];
  Object.values(products.value).forEach((product) => {
    if (periods.value.includes(+product.period)) return;
    periods.value.push(+product.period);
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
const changeAddons = (uuid) => {
  if (options.value.addons.includes(uuid)) {
    options.value.addons = options.value.addons.filter(
      (addon) => addon !== uuid
    );
  } else {
    options.value.addons.push(uuid);
  }
};
const getAddon = (addon) => {
  const item = filteredAddons.value.find(({ uuid }) => uuid === addon);
  const price = item.periods[currentProduct.value.period];

  return {
    ...item,
    price: formatPrice(price),
  };
};
const getResources = (size) => {
  const key = size.keys[options.value.period];

  return products.value[key]?.meta?.resources;
};

const checkPricesEqual = (price, [minPrice, maxPrice]) => {
  const a = minPrice ? price >= minPrice : true;
  const b = maxPrice ? price <= maxPrice : true;

  return a && b;
};
const resetFilters = () => {
  Object.keys(filters.value).forEach((key) => {
    filters.value[key] = [];
  });

  searchParam.value = "";
  checkedGroups.value = null;
};

const orderClickHandler = () => {
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);
  const { resources = [] } = currentProduct.value.meta;

  const instance = {
    config: { auto_start: fullPlan.meta.auto_start },
    resources: resources.reduce((result, { key, title }) => {
      result[key] = title;
      return result;
    }, {}),
    title: currentProduct.value.title,
    billing_plan: fullPlan,
    product: options.value.size,
    addons: options.value.addons,
  };

  if (!userdata.value.uuid) {
    const showcase =
      spStore.showcases.find(({ uuid }) => uuid === route.query.service) ?? {};

    onLogin.value.redirect = route.name;
    onLogin.value.redirectQuery = route.query;
    onLogin.value.info = {
      type: "custom",
      title: [
        showcase.promo?.[locale.value]?.title ?? showcase.title ?? "custom",
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
      activeCollapseKey.value = [];

      onLogin.value = {};
    }, 1000);
  }
};

const selectCollapsePanel = (keys) => {
  options.value.size = keys[options.value.period];
};

const toggleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
};

const getSortIcon = (field) => {
  if (sortField.value !== field) return null;
  return sortOrder.value === "asc" ? h(CaretUpOutlined) : h(CaretDownOutlined);
};

function parseForSort(raw) {
  const value = raw.trim().toLowerCase();

  const freq = value.match(/([\d.]+)(?:\/([\d.]+))?\s*ghz/);
  if (freq) {
    const base = parseFloat(freq[1]);
    const boost = freq[2] ? parseFloat(freq[2]) : base;
    return boost;
  }

  const ram = value.match(/([\d.]+)\s*gb/);
  if (ram) {
    return parseFloat(ram[1]);
  }

  if (/^\d+$/.test(value)) {
    return parseInt(value);
  }

  return 0;
}

watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid;
});
watch([provider, currency], () => {
  fetchPlans(provider.value);
});
watch(resources, (value) => {
  Object.entries(value).forEach(([key, resource]) => {
    if (filtersType.value.includes("slider")) {
      filters.value[key] = [resource.at(0), resource.at(-1)];
    } else {
      filters.value[key] = [];
    }
  });
});
watch(sizes, (value) => {
  const { keys } = value?.at(0) ?? {};
  const data = JSON.parse(route.query.data ?? "{}");

  if (data.productSize) {
    options.value.size = data.productSize;
    return;
  }

  if (keys && options.value.period) {
    options.value.size = keys[options.value.period];
  } else if (keys) {
    options.value.size = Object.values(keys)[0];
  }
});
watch(filteredSizes, (value) => {
  paginationOptions.value.total = value.length;
});
watch(
  () => options.value.size,
  (value, prev) => {
    const size = sizes.value.find(({ keys }) =>
      Object.values(keys).includes(prev)
    );
    const keys = Object.values(size?.keys ?? {});

    if (!keys.includes(value)) changePeriods(value);
    options.value.addons = [];

    filteredAddons.value.forEach(({ meta, uuid }) => {
      if (meta.autoEnable) options.value.addons.push(uuid);
    });

    plan.value = currentProduct.value.planId;
  }
);

watch(
  () => options.value.period,
  (value) => {
    const { title } = products.value[options.value.size] || {};
    const [key, product] =
      Object.entries(products.value || []).find(
        ([, product]) => product.title === title && +product.period === value
      ) || [];
    const data = JSON.parse(route.query.data ?? "{}");

    if (data.productSize) {
      options.value.size = data.productSize;
    } else {
      options.value.size = key;
    }

    plan.value = cachedPlans.value[
      `${provider.value}_${currency.value.code}`
    ].find(({ uuid }) => uuid === product.planId)?.uuid;
  }
);

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

watch(filteredSizes, () => {
  if (filteredSizes.value[0]) {
    options.value.size = filteredSizes.value[0].keys[options.value.period];
  }
});

watch(
  [filters, searchParam, checkedGroups],
  () => {
    if (!filteredSizes.value.length || fetchLoading.value) {
      return;
    }

    if (
      paginationOptions.value.size * paginationOptions.value.page >
      paginationOptions.value.total
    ) {
      console.log(343);

      paginationOptions.value.page = 1;
    }
  },
  { deep: true }
);

watch(typesOptions, () => {
  console.log(typesOptions.value, typesOptions.value.includes("распродажа"));

  const saleOption = typesOptions.value.find((v) =>
    (v || "").toLowerCase().trim().includes("распродажа")
  );
  if (saleOption) {
    checkedGroups.value = saleOption;
  }
});
</script>

<script>
export default {
  name: "CustomComponent",
};
</script>

<style scoped>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: 10px;
}

.order {
  display: grid;
  grid-template-columns: 15% calc(65% - 30px) 20%;
  gap: 15px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
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
  position: fixed;
}

.order_filters {
  position: fixed;
  width: 12%;
}

.order__promo {
  grid-column: 2;
}

.order__promo img {
  height: auto;
  max-width: 100%;
  object-fit: contain;
}

.order :deep(.ant-slider-mark-text) {
  white-space: nowrap;
}

.order :deep(.ant-slider-mark-text:first-of-type) {
  transform: translateX(-10px) !important;
}

.order :deep(.ant-slider-mark-text:last-of-type) {
  transform: translateX(calc(-100% + 10px)) !important;
}

.order__radio-group {
  display: flex;
  flex-wrap: v-bind(groupWrapStyle);
  gap: 15px;
}

.product__specs {
  --color: rgb(126, 126, 126);
  color: var(--color);
  margin: 0 auto;
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td {
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1) {
  font-weight: 500;
}

.product__specs td:nth-child(2) {
  text-align: right;
  color: rgba(0, 0, 0, 0.7);
}

.product__specs tr {
  border-bottom: var(--border-line-weight) var(--border-line-type)
    var(--border-color);
}

.product__specs td:last-child::before {
  content: "";
  width: 2px;
  height: 50%;
  background: #f5f5f5;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.order__prop:not(:first-child) {
  margin-top: 15px;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 5px;
}

.order__grid__solo {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 10px;
}

.order__grid-item {
  border-radius: 15px;
  cursor: pointer;
  padding: 10px;
  box-shadow: inset 0 0 0 1px var(--border_color);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  min-height: 15vh;
}

.order__grid-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.order__grid-item h1 {
  margin-bottom: 5px;
  color: inherit;
  font-size: 18px;
  font-weight: 700;
}

.order__grid-item p {
  margin-bottom: 6px;
  line-height: 1.2;
}

.order__radio-group img,
.order__grid-item img {
  max-width: 25%;
  padding: 2px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
  background: #fff;
}

.order__radio-group > * {
  display: flex;
  align-items: center;
  flex-basis: v-bind(groupWidthStyle);
  height: auto;
  padding: 5px 15px;
  border-radius: 10px;
  border-inline-start-width: 1px;
  border-color: var(--border-color);
}

.order__radio-group > *::before {
  content: none;
}

.order__radio-group > :deep(* > span) {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.order__grid-item--active {
  border: 2px solid var(--main);
}

.order__grid-item--grid {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  flex-direction: column;
}

.order__option :deep(.ant-card-head) {
  background: var(--bright_bg);
}

.order__option :deep(.ant-card-body) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.order__option :deep(.ant-card-loading-content) {
  width: 100%;
}

.order__option .card-item {
  width: 100%;
  cursor: pointer;
  border: 0 solid transparent;
  background: var(--bright_bg);
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name :deep(.ant-checkbox) {
  box-shadow: 0 0 5px var(--main);
}

.order__option .order__slider-name img {
  max-height: 65px;
}

.card-item .order__slider-name {
  justify-items: start;
}

.card-item--active {
  padding: 19px;
  border: 5px solid var(--main);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr;
  }
}

.removeMarginSkeleton :deep(.ant-skeleton-title) {
  margin: 0;
  margin-top: 4px;
}

.removeMarginSkeleton {
  min-width: 75px;
}

.total.removeMarginSkeleton {
  width: 100%;
}

.order__slider {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 10px;
  overflow-x: auto;
}

.order__slider-item:not(:last-child) {
  margin-right: 10px;
}

.order__slider-item {
  flex-shrink: 0;
  /* border: 1px solid var(--border_color); */
  box-shadow: inset 0 0 0 1px var(--border_color);
  height: 100%;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.order__slider-item--active {
  color: var(--bright_font);
}

.order__slider-item--loading {
  /* background-color: #f2f2f2; */
  box-shadow: none;
  /* animation: glowing .5s ease infinite; */
  animation-name: glowing;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.loadingLine {
  min-width: 100px;
  width: 100%;
  height: 2rem;
  border-radius: 4px;
  animation-name: glowing;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.loadingLine--total {
  margin-top: 10px;
  height: 26px;
}

.loadingLine--image {
  min-width: 60px;
  width: 60px;
  height: 60px;
  margin: auto;
  margin-bottom: 15px;
}

@keyframes glowing {
  from {
    background-color: #f2f2f2;
  }
  to {
    background-color: #e9e9e9;
    /* background-color: red; */
  }
}

@media screen and (max-width: 1024px) {
  .order_wrapper {
    padding: 0;
  }
  .order_filters {
    position: unset;
    width: 100%;
  }
  .order__calculate {
    position: unset;
  }
  .order {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .order__field {
    padding: 10px;
    box-shadow: none;
    border-radius: 20px 20px 0 0;
  }
  .order__main {
    border-radius: 0;
  }
  .order__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }
  .order__promo {
    grid-column: 1;
    margin-top: 20px;
  }
}

@media screen and (max-width: 576px) {
  .order__template {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
  .order__template-item {
    grid-template-columns: max-content auto;
    grid-template-rows: 1fr;
    width: auto;
    height: 50px;
  }
  .order__template-item:not(:last-child) {
    margin-right: 0px;
  }
  .order__template-image {
    width: 50px;
    height: 50px;
    padding: 4px;
  }
  .order__template-image__rate {
    line-height: 42px;
    font-size: 1.4rem;
  }
  .order__template-image img {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  .order__template-name {
    text-align: left;
    line-height: 30px;
    display: flex;
  }
  .order__template-type {
    width: 56px;
  }
  .order__template-name ul {
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1;
  }
  .order__template-name ul li {
    margin-left: 20px;
  }
  .order__radio-group {
    flex-wrap: wrap;
    gap: 10px;
  }
  .product__specs {
    width: 100%;
  }
  .product__specs td {
    padding: 3px 7px;
  }
  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
  }
}

.specs-enter-active,
.specs-leave-active {
  transition: all 0.15s ease;
}

.specs-enter-from {
  transform: translateX(-1em);
  opacity: 0;
}

.specs-leave-to {
  transform: translateX(1em);
  opacity: 0;
}

.textchange-enter-active,
.textchange-leave-active {
  transition: all 0.15s ease;
}

.textchange-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}

.resources p {
  margin: 0px;
}

.product_name {
  font-size: 1.3rem;
}

.product_resources {
  display: flex;
  flex-wrap: wrap;
  row-gap: 5px;
}

.product_resources span {
  margin-inline-start: 2px;
  margin-inline-end: 2px;
  font-size: 0.9rem;
}

.product_price {
  position: absolute;
  bottom: 5px;
  right: 10px;
}

.product_selected {
  position: absolute;
  top: 5px;
  right: 10px;
}

.product_price span {
  font-size: 1rem;
  font-weight: 600;
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
