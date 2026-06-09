<template>
  <div class="products__wrapper">
    <div v-if="authStore.isLogged" class="products__header">
      <div class="products__header-row">
        <div class="products__title">
          <transition name="header-transition" mode="out-in">
            <span v-if="!productsLoading" class="header__animated">
              {{ `${$t("comp_services.Your orders")}:` }}
              <span class="products__count">{{ productsCount }}</span>
            </span>
          </transition>
        </div>

        <a-input
          v-if="!min && authStore.billingUser && !productsLoading"
          v-model:value="searchQuery"
          :placeholder="$t('search') || 'Search'"
          allow-clear
          class="products__search"
          style="margin: 10px 25px;"
        >
          <template #prefix>
            <search-icon style="color: var(--main)" />
          </template>
        </a-input>

        <div v-if="min && authStore.billingUser" class="products__all">
          <router-link :to="{ name: 'products' }">
            {{ $t("comp_services.all") }}
          </router-link>
        </div>
        <div v-else-if="authStore.billingUser" class="products__control">
          <span class="instance_status">
            <span
              @click="showDeleted = false"
              :class="{ type: true, active: !showDeleted }"
              >{{ $t("comp_services.global_filter.active") }}</span
            >
            <span
              @click="showDeleted = true"
              :class="{ type: true, active: showDeleted }"
              >{{ $t("comp_services.global_filter.all") }}</span
            >
          </span>

          <a-popover placement="bottomRight" arrow-point-at-center>
            <template #content>
              <a-radio-group v-model:value="sortBy">
                <a-radio value="Name">
                  {{ capitalize($t("name")) }}
                </a-radio>
                <a-radio value="Cost">
                  {{ capitalize($t("cost")) }}
                </a-radio>
                <a-radio value="Date">
                  {{ capitalize($t("date")) }}
                </a-radio>
              </a-radio-group>
            </template>
            <template #title>
              <span style="margin-right: 5px">{{ capitalize($t("sort")) }}</span>
              <sort-ascending-icon
                v-if="sortType === 'sort-ascending'"
                @click="sortType = 'sort-descending'"
              />
              <sort-descending-icon v-else @click="sortType = 'sort-ascending'" />
            </template>
            <sort-icon class="products__control-item" />
          </a-popover>
        </div>
      </div>

      <div v-if="!min && authStore.billingUser && !productsLoading && categoriesWithProducts.length > 0" class="products__type-tags">
        <a-checkable-tag
          v-for="cat of categoriesWithProducts"
          :key="cat.uuid"
          :checked="isTypeChecked(cat.uuid)"
          @change="filterElementClickHandler(cat.uuid)"
        >
          {{ cat.promo?.[$i18n.locale] || cat.promo?.en || cat.title }}
        </a-checkable-tag>
      </div>
    </div>

    <div
      class="products__inner"
      :class="{ 'products__wrapper--loading': productsLoading }"
    >
      <loading v-if="productsLoading && authStore.isLogged" />
      <template v-else-if="productsPrepared.length > 0">
        <cloud-item
          v-for="product in productsPrepared"
          :key="`${product.orderid}/${product.id}`"
          :instance="product"
          :unpaid-invoice="getUnpaidInvoiceForProduct(product)"
        />
      </template>
      <a-empty v-else-if="authStore.isLogged" />
      <a-button
        v-if="queryTypes.length === 1 && !isQueryTypeCategory"
        ref="order-button"
        class="products__new"
        size="large"
        shape="round"
        type="primary"
        block
        @click="newProductHandle"
      >
        + {{ $t("Order") }}
      </a-button>
    </div>

    <a-pagination
      v-if="productsPrepared.length > 0 && authStore.isLogged"
      show-size-changer
      style="width: fit-content; margin: 10px 0 20px auto"
      :page-size-options="pageSizeOptions"
      :page-size="productsStore.size"
      :total="productsCount"
      :current="productsStore.page"
      @show-size-change="onShowSizeChange"
      @change="onShowSizeChange"
    />
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed, ref, watch, onMounted, capitalize } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { notification } from "ant-design-vue";
import { useSpStore } from "@/stores/sp.js";
import { useAuthStore } from "@/stores/auth.js";
import { useProductsStore } from "@/stores/products.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useInvoicesStore } from "@/stores/invoices.js";
import { transformInstances } from "@/functions";
import {
  GetInvoicesRequest,
  BillingStatus,
} from "nocloud-proto/proto/es/billing/billing_pb";

import loading from "@/components/ui/loading.vue";
import cloudItem from "@/components/cloud/item.vue";

const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);
const sortAscendingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SortAscendingOutlined")
);
const sortDescendingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SortDescendingOutlined")
);
const sortIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SlidersOutlined")
);

const pageSizeOptions = ["5", "10", "25", "50", "100"];
const props = defineProps({
  min: { type: Boolean, default: true },
  count: { type: Number, default: 5 },
});

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const spStore = useSpStore();
const authStore = useAuthStore();
const productsStore = useProductsStore();
const instancesStore = useInstancesStore();
const invoicesStore = useInvoicesStore();

const sortType = ref("sort-ascending");
const sortBy = ref("Date");
const showDeleted = ref(false);
const anchor = ref(null);
const unpaidInvoices = ref([]);
const searchQuery = ref("");

const services = computed(() => productsStore.services);

const checkedTypes = computed(
  () => route.query?.service?.split(",").filter((el) => el.length > 0) ?? []
);

const queryTypes = computed(() => {
  if (route.query.service) {
    return route.query.service.split(",").filter((el) => el.length > 0);
  }
  return [];
});

const categories = computed(() => {
  const map = new Map();
  spStore.showcases.forEach((showcase) => {
    (showcase.categories || []).forEach((cat) => {
      if (!map.has(cat.uuid)) map.set(cat.uuid, cat);
    });
  });
  return Array.from(map.values()).sort((a, b) => (a.sorter || 0) - (b.sorter || 0));
});

const categoriesWithProducts = computed(() =>
  categories.value.filter(
    (cat) => filterProducts(products.value, [cat.uuid]).length > 0
  )
);

const isQueryTypeCategory = computed(() =>
  queryTypes.value.length > 0 &&
  categories.value.some((c) => c.uuid === queryTypes.value[0])
);

function isExpired(instance) {
  const productDate = new Date(instance.date);
  const timestamp = productDate.getTime() - Date.now();
  const days = 7 * 24 * 3600 * 1000;

  if (instance.groupname === "SSL") return;
  if (instance.date === 0) return;
  return timestamp < days;
}

function sortProducts(products) {
  products.sort((a, b) => {
    if (sortType.value === "sort-ascending") [b, a] = [a, b];
    if (props.min) {
      if (isExpired(a) && !isExpired(b)) return 1;
      else if (!isExpired(a) && isExpired(b)) return -1;
      else return 0;
    }

    switch (sortBy.value) {
      case "Date":
        return (+a.created || 0) - (+b.created || 0);
      case "Name": {
        const A = (a?.productname ?? "").trim().normalize("NFC");
        const B = (b?.productname ?? "").trim().normalize("NFC");

        if (!A && !B) return 0;
        if (!A) return 1;
        if (!B) return -1;

        return A.localeCompare(B, locale.value, {
          numeric: true,
          sensitivity: "base",
          ignorePunctuation: true,
        });
      }
      case "Cost":
        return (parseFloat(a.estimate) || 0) - (parseFloat(b.estimate) || 0);
      default:
        return 0;
    }
  });

  return products;
}

function filterProducts(products, selectedValues) {
  return products.filter(({ sp, hostingid, billingPlan, productname }) => {
    let { title } = spStore.servicesProviders.find(({ uuid }) => uuid === sp) ?? {};
    if (hostingid) title = "Virtual";

    return selectedValues.some((value) => {
      const category = categories.value.find((c) => c.uuid === value);
      if (category) {
        const categoryShowcaseUuids = new Set(category.showcases || []);
        return spStore.getShowcases.some(
          (entry) =>
            categoryShowcaseUuids.has(entry.uuid) &&
            entry.plans.includes(billingPlan?.uuid) &&
            entry.servicesProvider.includes(sp)
        );
      }

      if (services.value[value]) {
        return services.value[value].find(({ name }) => name === productname);
      }

      const showcase = spStore.getShowcases.find(({ uuid }) => uuid === value);
      if (!showcase) return value === title;
      return showcase.plans.includes(billingPlan?.uuid) && showcase.servicesProvider.includes(sp);
    });
  });
}

function matchesSearch(product, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const candidates = [
    product.productname,
    product.title,
    product.domain,
    product.id,
    product.uuid,
    product.orderid,
  ].filter(Boolean);

  return candidates.some((v) => String(v).toLowerCase().includes(q));
}

function isTypeChecked(value) {
  return checkedTypes.value.includes(value);
}

const products = computed(() => {
  const mappedProducts = productsStore.products.map((el) => ({
    ...el.ORDER_INFO,
    groupname: el.groupname,
    productname: el.vm_info?.NAME ?? el.name,
    server_on: el.server_on,
    id: el.id,
  }));

  const instances = transformInstances(instancesStore.getInstances)
    .filter((instance) => instance.billingPlan?.type !== "ione-vpn")
    .filter((p) => p.state?.state !== "DELETED" || showDeleted.value);

  return sortProducts([...mappedProducts, ...instances]);
});

const filtredProducts = computed(() => {
  if (props.min) return products.value.slice(0, 5);

  let result = products.value;

  if (route.query.service) {
    result = filterProducts(result, checkedTypes.value);
  }

  if (searchQuery.value) {
    result = result.filter((p) => matchesSearch(p, searchQuery.value));
  }

  return result;
});

const productsCount = computed(() => filtredProducts.value.length);

const productsLoading = computed(
  () => productsStore.isLoading || instancesStore.isLoading
);

const productsPrepared = computed(() => {
  const size = productsStore.size;
  const page = productsStore.page;
  const start = size * (page - 1);
  const end = start + size;

  return filtredProducts.value.slice(start, end);
});

function getUnpaidInvoiceForProduct(product) {
  const productUuid = String(product?.uuid || "");

  return unpaidInvoices.value.find((invoice) => {
    const status = String(invoice?.status || "").toUpperCase();
    if (status !== "UNPAID") return false;

    const instances = invoice?.instances || [];
    return productUuid ? instances.includes(productUuid) : false;
  });
}

async function fetchUnpaidInvoices() {
  try {
    const res = await invoicesStore.invoicesApi.getInvoices(
      GetInvoicesRequest.fromJson({
        filters: {
          status: [BillingStatus.UNPAID],
        },
        page: 1,
        limit: 1000,
        sort: "DESC",
        field: "created",
      })
    );

    unpaidInvoices.value = res.toJson().pool || [];
  } catch (e) {
    console.log(e);
    unpaidInvoices.value = [];
  }
}

function onShowSizeChange(page, limit) {
  page = page || 1;
  limit = limit || 10;

  if (page !== productsStore.page) {
    productsStore.page =
      productsCount.value > 0 && Math.ceil(productsCount.value / limit) >= page
        ? page
        : 1;
  }

  if (limit !== productsStore.size) {
    productsStore.size = limit;
  }

  localStorage.setItem("servicesPagination", JSON.stringify({ page, limit }));
}

function filterElementClickHandler(key) {
  const selected = new Set(checkedTypes.value);

  if (selected.has(key)) selected.delete(key);
  else selected.add(key);

  const newTypes = Array.from(selected).join(",");
  router.replace({ query: { service: newTypes } });
}

function newProductHandle() {
  let foundShowcase = null;
  const { type } =
    spStore.servicesProviders.find(({ uuid }) => {
      foundShowcase =
        spStore.getShowcases.find(({ uuid }) => uuid === queryTypes.value[0]) ?? {};

      return foundShowcase?.servicesProvider?.includes(uuid);
    }) ?? {};

  let name = "service-virtual";
  const query = { service: queryTypes.value[0] };

  switch (type) {
    case "opensrs":
      name = "service-domains";
      break;
    case "goget":
      name = "service-ssl";
      break;
    case "acronis":
      name = "service-acronis";
      break;
    case "empty":
    case "virtual": {
      if (foundShowcase?.meta?.type === "vpn") {
        name = "service-vpn";
      } else {
        name = "service-custom";
        query.headerTitle =
          foundShowcase.promo?.[locale.value]?.title ?? foundShowcase.title;
      }
      break;
    }
    case "openai":
      name = "service-openai";
      query.headerTitle =
        foundShowcase.promo?.[locale.value]?.title ||
        foundShowcase.title ||
        "ChatGPT";
      break;
    case "vdc":
      name = "newVDC";
      break;
    case "keyweb":
    case "ione":
    case "ovh":
      name = "newPaaS";
      break;
  }

  if (!type && productsStore.services[queryTypes.value[0]]) {
    name = "service-iaas";
  }

  router.push({ name, query });
}

function createObserver() {
  void anchor.value;
}

watch(productsLoading, (value) => {
  if (value === false) {
    onShowSizeChange(productsStore.page, productsStore.size);
  }
});

watch(queryTypes, () => {
  setTimeout(createObserver);
});

watch(checkedTypes, () => {
  const isNeedFilter =
    ["services", "root", "products"].includes(route.name) && route.query.service;
  if (isNeedFilter) {
    localStorage.setItem("types", route.query.service);
  } else {
    localStorage.removeItem("types");
  }
});

watch(sortBy, (value) => {
  localStorage.setItem(
    "serviceSorting",
    JSON.stringify({ sortBy: value, sortType: sortType.value })
  );
});

watch(sortType, (value) => {
  localStorage.setItem(
    "serviceSorting",
    JSON.stringify({ sortBy: sortBy.value, sortType: value })
  );
});

onMounted(async () => {
  const service = localStorage.getItem("types");
  const sorting = JSON.parse(localStorage.getItem("serviceSorting") ?? "false");
  const isProductsRoute = service && route.name !== "products";
  const isServicesSame = service === route.query.service;

  if (isProductsRoute && !isServicesSame) {
    router.replace({ query: { service } });
  }

  if (sorting) {
    sortBy.value = sorting.sortBy;
    sortType.value = sorting.sortType;
  }

  const promises = [];
  if (spStore.servicesProviders.length < 1) {
    promises.push(spStore.fetch(!authStore.isLogged));
  }
  if (Object.keys(services.value).length < 1) {
    promises.push(productsStore.fetchServices());
  }

  Promise.all(promises).catch((err) => {
    if (err.response?.data?.code === 12) return;
    const message = err.response?.data?.message ?? err.message ?? err;

    notification.error({ message: t(message) });
  });

  if (authStore.isLogged) {
    authStore
      .fetchBillingData()
      .then(async (user) => {
        await Promise.allSettled([
          instancesStore.fetch(),
          productsStore.fetch(user.client_id),
          fetchUnpaidInvoices(),
        ]);
      })
      .catch(() => {});
  }

  const pagination = localStorage.getItem("servicesPagination");
  if (pagination) {
    const { page, limit } = JSON.parse(pagination);
    onShowSizeChange(page, limit);
    createObserver();
  }
});
</script>

<style scoped>
.products__wrapper {
  border-radius: 10px;
  padding: 10px 10px 15px 10px;
}

.products__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 15px;
  margin-bottom: 15px;
  background: var(--bright_font);
  border-radius: 10px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
}

.products__header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.products__search {
  width: 100%;
}

.products__type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.products__inner {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.products__inner .ant-empty {
  margin: 0;
  padding: 15px;
  border-radius: 10px;
  background: var(--bright_font);
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
}

.products__inner > div > img {
  width: 100%;
}

.products__wrapper--loading {
  min-height: 170px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.products__unregistred {
  padding: 7px 10px;
  font-size: 1.5rem;
  text-align: center;
  border-radius: 10px;
  background: var(--bright_font);
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
}

.products__title {
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 18px;
}

.products__control {
  flex-shrink: 0;
}

.products__count {
  color: #aeaeae;
}

.products__all {
  text-transform: uppercase;
  color: var(--main);
  cursor: pointer;
}

.products__all:hover {
  text-decoration: underline;
}

.products__new {
  margin: 5px 10px 0 0;
  transform: translateY(-2px);
}

/* animations */

.products__control-item {
  font-size: 1.4rem;
  transition: color 0.2s ease;
}

.products__control-item:not(:last-child) {
  margin-right: 10px;
}

.products__control-item:hover {
  color: var(--main);
}

.header-transition-enter-active,
.header-transition-leave-active {
  transition: all 0.15s ease;
}

.header-transition-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.header-transition-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}

.instance_status {
  font-size: 1.1rem;
  margin-right: 25px;
}

.instance_status .type {
  cursor: pointer;
  margin-left: 10px;
}

.instance_status .type.active {
  color: var(--main);
}
</style>
