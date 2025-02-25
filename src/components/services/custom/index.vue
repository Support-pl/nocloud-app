<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <h3>{{ capitalize($t("filters")) }}</h3>
        <filters-view
          v-if="Object.keys(filters).length > 0"
          :type="filtersType"
          :filters="filters"
          :resources="resources"
          @update:filter="(key, value) => (filters[key] = value)"
        />
        <template v-else>
          {{ capitalize($t("select group or product")) }}
        </template>

        <template v-if="isResourcesExist && Object.keys(filters).length > 0">
          {{ capitalize($t("group")) }}:
          <a-select
            v-model:value="checkedType"
            allow-clear
            style="width: 100%"
            placeholder="Select"
            :options="typesOptions.map((value) => ({ value, label: value }))"
          />
        </template>

        <a-button type="primary" style="margin-top: 10px" @click="resetFilters">
          {{ $t("Reset") }}
        </a-button>
        <a-divider v-if="viewport < 1024" style="margin: 20px 0 0" />
      </div>

      <div class="order__field order__main">
        <div class="order__option">
          <a-radio-group
            v-if="typesOptions.length > 1 && !isResourcesExist"
            class="order__radio-group"
            :style="radioGroupStyle"
            :value="checkedType"
          >
            <a-radio-button
              v-for="group of typesOptions"
              :key="group"
              :value="group"
              @click="
                checkedType === group
                  ? (checkedType = '')
                  : (checkedType = group)
              "
            >
              <img
                v-if="getGroupImage(group)"
                :src="getGroupImage(group)"
                :alt="group"
              />
              <h1 style="margin-bottom: 4px">
                {{ group }}
              </h1>
            </a-radio-button>
          </a-radio-group>

          <a-collapse
            v-model:activeKey="activeCollapseKey"
            v-if="sizesByPage.length > 0"
            :class="{
              order__grid: true,
              order__grid__solo: sizesByPage.length === 1,
            }"
            :bordered="false"
            expand-icon-position="end"
          >
            <a-collapse-panel
              v-for="size of sizesByPage"
              :key="size.keys[options.period]"
              class="order__grid-item"
              :class="{
                'order__grid-item--grid': size.image,
                'order__grid-item--active':
                  options.size === size.keys[options.period],
              }"
              :style="size.image ? 'padding: 10px' : null"
              :showArrow="!!currentProduct.meta?.description"
              @click="selectCollapsePanel(size.keys)"
            >
              <template #header>
                <div :style="{ display: size.image ? 'flex' : '' }">
                  <img
                    v-if="size.image"
                    style="margin-right: 5px"
                    :src="size.image"
                    :alt="size.label"
                  />

                  <h1 :style="getResources(size) ? null : 'margin-bottom: 0'">
                    {{ size.label }}
                  </h1>
                  <a-divider
                    v-if="getResources(size)"
                    style="margin: -2px 0 7px"
                  />

                  <p v-for="resource of getResources(size)" :key="resource.id">
                    {{ resource.key }}: {{ resource.title }}
                  </p>
                </div>
              </template>

              <template #expandIcon="{ isActive }">
                <caret-right-outlined
                  style="font-size: 204px"
                  :rotate="isActive ? 90 : 0"
                />
              </template>

              <div
                class="collapse_description"
                v-if="typeof currentProduct.meta?.description === 'string'"
                style="margin-top: 15px"
                v-html="currentProduct.meta?.description"
              />
              <table
                v-else-if="currentProduct.meta?.description"
                class="product__specs"
              >
                <tr
                  v-for="resource in currentProduct.meta?.description"
                  :key="resource.name"
                >
                  <td>{{ resource.name }}</td>
                  <td>{{ resource.value }}</td>
                </tr>
              </table>
            </a-collapse-panel>
          </a-collapse>

          <a-card
            v-if="fetchLoading || filteredAddons.length > 0"
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
                  style="grid-template-columns: 1fr auto auto; gap: 10px"
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
            v-if="isResourcesExist"
            style="margin-top: 20px"
            :visible="filteredSizes.length > 15"
            :options="paginationOptions"
            @update:options="(key, value) => (paginationOptions[key] = value)"
          />
        </div>
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

        <transition
          v-if="sizesByPage.length > 0 && isResourcesExist"
          name="specs"
          mode="out-in"
        >
          <div
            v-if="typeof currentProduct.meta?.description === 'string'"
            style="margin-top: 15px"
            v-html="currentProduct.meta?.description"
          />
          <table
            v-else-if="currentProduct.meta?.description"
            class="product__specs"
          >
            <tr
              v-for="resource in currentProduct.meta?.description"
              :key="resource.name"
            >
              <td>{{ resource.name }}</td>
              <td>{{ resource.value }}</td>
            </tr>
          </table>
        </transition>

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

      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { computed, inject, nextTick, onMounted, watch } from "vue";

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
import { CaretRightOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import promocodeMenu from "@/components/ui/promocode-menu.vue";
import { usePromocodesStore } from "@/stores/promocodes";

const namespacesStore = useNamespasesStore();
const spStore = useSpStore();
const plansStore = usePlansStore();
const instancesStore = useInstancesStore();
const promocodesStore = usePromocodesStore();
const addonsStore = useAddonsStore();
const authStore = useAuthStore();
const { onLogin } = storeToRefs(useAppStore());
const { isLogged, userdata } = storeToRefs(authStore);

const { addons } = storeToRefs(useAddonsStore());

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const notification = useNotification();

const checkBalance = inject("checkBalance", () => {});

const { getPeriod } = usePeriod();
const { currency, formatPrice } = useCurrency();
const { createInstance } = useCreateInstance();

const plan = ref(null);
const planWithApplyedPromocode = ref(null);
const service = ref(null);
const namespace = ref(null);
const provider = ref(null);
const promocode = ref(null);
const fetchLoading = ref(false);
const options = ref({ size: "", period: "", addons: [] });
const modal = ref({ confirmCreate: false, confirmLoading: false });
const products = ref({});
const periods = ref([]);
const sizes = ref([]);
const filters = ref({});
const checkedType = ref("");
const filtersType = ref("range-with-prefixes");
const paginationOptions = ref({ total: 0, size: 10, page: 1 });
const cachedPlans = ref({});
const activeCollapseKey = ref([]);

function onCreated() {
  fetchLoading.value = true;
  const promises = [
    authStore.fetchBillingData(),
    spStore.fetch(!isLogged.value),
    spStore.fetchShowcases(!isLogged.value),
  ];

  if (isLogged.value) {
    promises.push(namespacesStore.fetch(), instancesStore.fetch());
  }

  if (spStore.showcases.length < 1) {
    spStore.fetchShowcases(!isLogged.value);
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
  if ((options.size || true) === true) return "NAN";
  if ((options.period ?? true) === true) return "NAN";

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
  const description = isResourcesExist.value
    ? product.meta.description?.replace(
        /[\wА-ЯЁа-яё \-_+]{1,};/,
        '<span style="font-weight: 700">$&</span>'
      )
    : product.meta.description;

  return {
    ...product,
    price: formatPrice(price),
    meta: { ...product.meta, description },
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
      fullPlan.addons.includes(uuid) || product.addons.includes(uuid)
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

  return types;
});
const filteredSizes = computed(() => {
  return sizes.value.filter(({ group, keys }) => {
    const { meta, price } = products.value[keys[options.value.period]] ?? {};
    let isIncluded =
      typesOptions.value.length > 1 ? checkedType.value === group : true;

    if (!keys[options.value.period]) return false;
    if (!checkedType.value && isResourcesExist.value) {
      isIncluded = true;
    }
    if (!meta?.resources) return isIncluded;

    const groups = [];
    meta?.resources?.forEach(({ group }) => {
      if (!group || groups.includes(group)) return;

      groups.push(group);
    });

    const isPricesEqual = checkPricesEqual(price, filters.value.$price);

    return (
      isIncluded &&
      isPricesEqual &&
      meta?.resources?.every(({ key, value, group }) => {
        const a = filters.value[key]?.at(0) <= (group || value);
        const b = filters.value[key]?.at(-1) >= (group || value);
        const isNotNumber = filters.value[key]?.some((value) => isNaN(value));

        if (filters.value[key]?.length < 1) return true;
        if (isNotNumber) {
          return filters.value[key].includes(group || value);
        }
        return filters.value[key] ? a && b : true;
      })
    );
  });
});
const sizesByPage = computed(() => {
  if (!isResourcesExist.value) return filteredSizes.value;

  const start =
    paginationOptions.value.size * (paginationOptions.value.page - 1);
  const end = start + paginationOptions.value.size;

  return filteredSizes.value.slice(start, end);
});
const services = computed(() => {
  return instancesStore.services.filter((el) => el.status !== "DEL");
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

const isResourcesExist = computed(() => {
  return Object.values(products.value).every(
    ({ meta }) => meta.resources?.length > 0
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
const radioGroupStyle = computed(() => {
  if (viewport.value < 1024) return "margin-bottom: 15px";

  return filteredSizes.value.length > 0 ? "margin-bottom: 30px" : null;
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

        if (i === -1) {
          result.sizes.push({
            keys: { [product.period]: key },
            label: product.title,
            group: product.group ?? product.title,
            price: product.price,
            sorter: product.sorter,
            image: product.meta.image,
          });
        } else {
          result.sizes[i].keys[product.period] = key;
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

  productsAndSizes.sizes
    .sort((a, b) => a.price - b.price)
    .sort((a, b) => a.sorter - b.sorter);
  sizes.value = productsAndSizes.sizes;

  const data = JSON.parse(route.query.data ?? "{}");

  if (data.productSize) {
    const { group } = products.value[data.productSize] ?? {};

    checkedType.value = group;
    options.value.size = data.productSize;
  } else if (typesOptions.value.length < 2) {
    nextTick(() => {
      options.value.size = Object.values(sizes.value[0]?.keys ?? {})[0] ?? "";
    });
  }
};
const changePeriods = (key) => {
  const { title } = products.value[key];

  periods.value = [];
  Object.values(products.value).forEach((product) => {
    if (product.title !== title) return;
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

  if (isResourcesExist.value) {
    checkedType.value = "";
  }
};

const orderClickHandler = () => {
  const fullService = services.value.find(({ uuid }) => uuid === service.value);
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);
  const { resources = [] } = currentProduct.value.meta;

  const instance = {
    config: { auto_start: fullPlan.meta.auto_start },
    resources: resources.reduce((result, { key, title }) => {
      result[key] = title;
      return result;
    }, {}),
    title: currentProduct.value.title,
    billing_plan: { uuid: plan.value },
    product: options.value.size,
    addons: options.value.addons,
  };

  const newGroup = {
    title: userdata.value.title + Date.now(),
    type: "empty",
    sp: provider.value,
    instances: [],
  };

  const info = !service.value
    ? newGroup
    : JSON.parse(JSON.stringify(fullService));
  const group = info.instancesGroups?.find(({ sp }) => sp === provider.value);

  if (!group && service.value) info.instancesGroups.push(newGroup);

  if (!userdata.value.uuid) {
    onLogin.value.redirect = route.name;
    onLogin.value.redirectQuery = route.query;
    onLogin.value.info = {
      type: "custom",
      title: "Custom",
      cost: currentProduct.value.price,
      currency: currency.value.code,
      goToInvoice: modal.value.goToInvoice,
    };
    onLogin.value.action = () => {
      return { info, instance };
    };

    router.push({ name: "login" });
    return;
  }

  createVirtual(info, instance);
};
const createVirtual = async (info, instance) => {
  modal.value.confirmLoading = true;
  const action = service.value ? "update" : "create";
  const orderData = service.value
    ? info
    : {
        namespace: namespace.value,
        service: {
          title: userdata.value.title,
          context: {},
          version: "1",
          instancesGroups: [info],
        },
      };

  try {
    await createInstance(
      action,
      orderData,
      instance,
      provider.value,
      promocode.value?.uuid,
      null,
      t("Done")
    );
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

const getGroupImage = (group) => {
  const { image } = sizes.value.find((size) => size.group === group) ?? {};

  return image;
};
const fetchPlans = async (provider) => {
  const cacheKey = `${provider}_${currency.value.code}`;

  if (cachedPlans.value[cacheKey]) return;
  try {
    const { pool } = await plansStore.fetch({
      anonymously: !isLogged.value,
      sp_uuid: provider,
    });

    cachedPlans.value[cacheKey] = pool;
    plan.value = plans.value[0]?.uuid;
    changeProducts();
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.openNotification("error", { message });
  } finally {
    fetchLoading.value = false;

    setTimeout(async () => {
      const { action, info } = onLogin.value;
      if (typeof action !== "function") return;

      if (!fetchLoading.value && plans.value.length)
        modal.value.goToInvoice = info.goToInvoice;
      modal.value.confirmCreate = true;
      modal.value.confirmLoading = true;

      const { info: actionInfo, instance: actionInstance } = action();

      plan.value = actionInstance.billing_plan.uuid;
      options.value.size = actionInstance.product;
      options.value.addons = actionInstance.addons;

      await nextTick();

      orderClickHandler(actionInfo, actionInstance);

      onLogin.value = {};
    }, 100);
  }
};
const selectCollapsePanel = (keys) => {
  options.value.size = keys[options.value.period];
  if (activeCollapseKey.value.length > 0) {
    activeCollapseKey.value = [keys[options.value.period]];
  }
};

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
    const { group } = products.value[data.productSize] ?? {};

    checkedType.value = group;
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
watch(checkedType, (value) => {
  const { keys } = sizes.value.find(({ group }) => group === value) ?? {};

  if (keys && options.value.period) {
    options.value.size = keys[options.value.period];
  } else if (keys) {
    options.value.size = Object.values(keys)[0];
  }
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
    const { title } = products.value[options.value.size];
    const [key, product] = Object.entries(products.value).find(
      ([, product]) => product.title === title && +product.period === value
    );
    const data = JSON.parse(route.query.data ?? "{}");

    if (data.productSize) {
      const { group } = products.value[data.productSize] ?? {};

      checkedType.value = group;
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
    activeCollapseKey.value = [
      filteredSizes.value[0].keys[options.value.period],
    ];
    options.value.size = filteredSizes.value[0].keys[options.value.period];
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
  padding: 15px;
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
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate {
  padding: 10px 15px 10px;
  font-size: 1.1rem;
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
  margin-top: 10px;
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
  box-shadow: inset 0 0 0 1px var(--border_color);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
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
  max-width: 50px;
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
  background-color: var(--main);
  color: var(--gloomy_font);
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
  background-color: var(--main);
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

.collapse_description * {
  background-color: var(--main) !important;
  color: var(--bright_font) !important;
}
</style>

<style>
.anticon.anticon-right.ant-collapse-arrow {
  font-size: 25px !important;
}
.ant-collapse-item.order__grid-item {
  border-radius: 15px !important;
}

.price__sale {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.price__sale .without_sale {
  text-decoration: line-through;
  margin-right: 10px;
}
</style>
