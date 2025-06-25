<template>
  <div class="products__wrapper">
    <div v-if="authStore.isLogged" class="products__header">
      <div class="products__title">
        <!-- Ваши услуги -->
        <transition name="header-transition" mode="out-in">
          <span
            v-if="!productsLoading || isNeedFilterStringInHeader"
            :key="$route.query.service || 'emptyQuery'"
            class="header__animated"
          >
            {{
              isNeedFilterStringInHeader
                ? ""
                : `${$t("comp_services.Your orders")}:`
            }}
            <span v-if="!isNeedFilterStringInHeader" class="products__count">
              {{ productsCount }}
            </span>

            <div style="display: flex; flex-wrap: wrap; gap: 10px">
              <transition-group name="fade-in">
                <a-badge
                  v-for="checkedType of checkedTypesString"
                  :key="checkedType.value"
                  class="products__filters"
                >
                  <template #count>
                    <close-circle-icon
                      style="color: var(--err)"
                      @click="filterElementClickHandler(checkedType.value)"
                    />
                  </template>
                  {{ checkedType.title }}:
                  {{ getProductsCountByType(checkedType.value) }}
                  <!-- всего -->
                </a-badge>
              </transition-group>
            </div>
          </span>
        </transition>
      </div>

      <div v-if="min && authStore.billingUser" class="products__all">
        <router-link :to="{ name: 'products' }">
          {{ $t("comp_services.all") }}
          <!-- все -->
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
            <p
              v-for="productType of types"
              :key="productType.value ?? productType"
            >
              <a-checkbox
                :checked="
                  !!~checkedTypes.indexOf(productType.value ?? productType)
                "
                @click="
                  filterElementClickHandler(productType.value ?? productType)
                "
              >
                {{ productType.title ?? productType }}
              </a-checkbox>
            </p>
          </template>
          <template #title>
            <span> {{ capitalize($t("filter")) }} {{ $t("by") }} </span>
            <span class="products__count" style="margin: 0 5px">
              {{ isFilterByLocation ? $t("location") : $t("provider") }}
            </span>
            <a-switch v-model:checked="isFilterByLocation" size="small" />
          </template>
          <filter-icon
            class="products__control-item"
            :style="{ color: checkedTypes.length > 0 ? 'var(--main)' : null }"
          />
        </a-popover>

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
    <div
      class="products__inner"
      :class="{ 'products__wrapper--loading': productsLoading }"
    >
      <loading v-if="productsLoading" />
      <template v-else-if="productsPrepared.length > 0">
        <cloud-item
          v-for="product in productsPrepared"
          :key="product.orderid"
          :instance="product"
        />
      </template>
      <a-empty v-else-if="authStore.isLogged" />
      <a-button
        v-if="queryTypes.length === 1 && !isFilterByLocation"
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

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import config from "@/appconfig.js";

import { useSpStore } from "@/stores/sp.js";
import { useAuthStore } from "@/stores/auth.js";
import { useProductsStore } from "@/stores/products.js";
import { useInstancesStore } from "@/stores/instances.js";
import { transformInstances } from "@/functions";

import loading from "@/components/ui/loading.vue";
import cloudItem from "@/components/cloud/item.vue";

const closeCircleIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseCircleFilled")
);
const filterIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FilterOutlined")
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

export default {
  name: "ProductsBlock",
  components: {
    cloudItem,
    loading,

    closeCircleIcon,
    filterIcon,
    sortIcon,
    sortAscendingIcon,
    sortDescendingIcon,
  },
  props: {
    min: { type: Boolean, default: true },
    count: { type: Number, default: 5 },
  },
  data: () => ({
    isFilterByLocation: false,
    sortType: "sort-ascending",
    sortBy: "Date",
    showDeleted: false,
    anchor: null,
  }),
  computed: {
    ...mapStores(useProductsStore, useSpStore, useAuthStore, useInstancesStore),
    productsPrepared() {
      const state = {
        size: this.productsStore.size,
        page: this.productsStore.page,
      };
      const start = state.size * (state.page - 1);
      const end = start + state.size;
      const products = this.products.slice(start, end);

      if (this.min) return this.products.slice(0, 5);
      else if (this.$route.query.service) {
        return this.filterProducts(this.products, this.checkedTypes);
      }
      return products;
    },
    products() {
      const products = this.productsStore.products.map((el) => ({
        ...el.ORDER_INFO,
        groupname: el.groupname,
        productname: el.vm_info?.NAME ?? el.name,
        server_on: el.server_on,
        id: el.id,
      }));
      const instances = transformInstances(this.instancesStore.getInstances)
        .filter((instance) => instance.billingPlan?.type !== "ione-vpn")
        .filter((p) => p.state?.state !== "DELETED" || this.showDeleted);

      return this.sortProducts([...products, ...instances]);
    },
    productsCount() {
      return this.products.length;
    },
    productsLoading() {
      const productsLoading = this.productsStore.isLoading;
      const instancesLoading = this.instancesStore.isLoading;

      return productsLoading || instancesLoading;
    },

    services() {
      return this.productsStore.services;
    },
    showcase() {
      return this.spStore.getShowcases.find(
        ({ uuid }) => uuid === this.$route.query.service
      );
    },
    types() {
      const result = this.spStore.showcases.map(({ title, uuid: value }) => ({
        title,
        value,
      }));

      if (this.isFilterByLocation) {
        return [
          ...new Set(
            this.spStore.servicesProviders.reduce(
              (prev, curr) => [
                ...prev,
                ...curr.locations.map(({ title }) => title),
              ],
              []
            )
          ).values(),
        ];
      }

      Object.keys(this.services).forEach((key) => {
        result.push(key);
      });

      if (config.sharedEnabled) result.push("Virtual");
      return result;
    },
    checkedTypes() {
      return (
        this.$route.query?.service?.split(",").filter((el) => el.length > 0) ??
        []
      );
    },
    checkedTypesString() {
      return this.checkedTypes.map((type) => {
        const foundType = this.types.find(({ value }) => value === type);

        if (foundType) return foundType;
        else return { title: type, value: type };
      });
    },
    isNeedFilterStringInHeader() {
      return (
        ["services", "root", "products"].includes(this.$route.name) &&
        this.$route.query.service
      );
    },
    queryTypes() {
      if (this.$route.query.service) {
        return this.$route.query.service
          .split(",")
          .filter((el) => el.length > 0);
      } else return [];
    },
  },
  watch: {
    queryTypes() {
      setTimeout(this.createObserver);
    },
    checkedTypes() {
      if (this.isNeedFilterStringInHeader) {
        localStorage.setItem("types", this.$route.query.service);
      } else {
        localStorage.removeItem("types");
      }
    },
    sortBy(value) {
      const sorting = { sortBy: value, sortType: this.sortType };

      localStorage.setItem("serviceSorting", JSON.stringify(sorting));
    },
    sortType(value) {
      const sorting = { sortBy: this.sortBy, sortType: value };

      localStorage.setItem("serviceSorting", JSON.stringify(sorting));
    },
    isFilterByLocation(value) {
      if (this.$route.name === "products") {
        localStorage.setItem("isFilterByLocation", false);
      } else {
        localStorage.setItem("isFilterByLocation", value);

        if (this.$route.query.service) {
          this.$router.replace({ query: {} });
        }
      }
    },
  },
  created() {
    const service = localStorage.getItem("types");
    const sorting = JSON.parse(
      localStorage.getItem("serviceSorting") ?? "false"
    );
    const isProductsRoute = service && this.$route.name !== "products";
    const isServicesSame = service === this.$route.query.service;

    if (isProductsRoute && !isServicesSame) {
      this.$router.replace({ query: { service } });
    }
    if (localStorage.getItem("isFilterByLocation")) {
      this.isFilterByLocation = JSON.parse(
        localStorage.getItem("isFilterByLocation")
      );
    }
    if (sorting) {
      this.sortBy = sorting.sortBy;
      this.sortType = sorting.sortType;
    }

    const promises = [];

    if (this.spStore.servicesProviders.length < 1) {
      promises.push(this.spStore.fetch(!this.authStore.isLogged));
    }
    if (Object.keys(this.services).length < 1) {
      promises.push(this.productsStore.fetchServices());
    }

    Promise.all(promises).catch((err) => {
      if (err.response?.data?.code === 12) return;
      const message = err.response?.data?.message ?? err.message ?? err;

      this.$notification.error({ message: this.$t(message) });
    });

    if (!this.authStore.isLogged) return;
    this.productsStore.isLoading = true;
    this.authStore
      .fetchBillingData()
      .then(async (user) => {
        await this.instancesStore.fetch();
        await this.productsStore.fetch(user.client_id);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.productsStore.isLoading = false;
      });
  },
  mounted() {
    const pagination = localStorage.getItem("servicesPagination");

    if (!pagination) return;
    const { page, limit } = JSON.parse(pagination);

    this.onShowSizeChange(page, limit);

    this.createObserver();
  },
  methods: {
    onShowSizeChange(page, limit) {
      page = page || 1;
      limit = limit || 10;

      if (page !== this.productsStore.page) {
        this.productsStore.page = page;
      }
      if (limit !== this.productsStore.size) {
        this.productsStore.size = limit;
      }

      localStorage.setItem(
        "servicesPagination",
        JSON.stringify({ page, limit })
      );
    },
    sortProducts(products) {
      products.sort((a, b) => {
        if (this.sortType === "sort-ascending") [b, a] = [a, b];
        if (this.min) {
          if (this.isExpired(a) && !this.isExpired(b)) return 1;
          else if (!this.isExpired(a) && this.isExpired(b)) return -1;
          else return 0;
        }

        switch (this.sortBy) {
          case "Date":
            return a.created - +b.created;
          case "Name":
            return a.productname?.toLowerCase() < b.productname?.toLowerCase();
          case "Cost":
            return parseFloat(a.estimate) - parseFloat(b.estimate);
          default:
            return 0;
        }
      });

      return products;
    },
    productClickHandler({ groupname, orderid, hostingid, config }) {
      if (config.is_vdc) {
        this.$router.push({ name: "openVDC", params: { uuid: orderid } });
      } else if (["Domains", "SSL"].includes(groupname)) {
        this.$router.push({ name: "service", params: { id: orderid } });
      } else if (groupname === "Self-Service VDS SSD HC") {
        this.$router.push({ name: "openCloud", params: { uuid: orderid } });
      } else {
        this.$router.push({ name: "service", params: { id: hostingid } });
      }
    },
    filterElementClickHandler(key) {
      const types = new Set(this.checkedTypes);
      if (types.has(key)) {
        types.delete(key);
      } else {
        types.add(key);
      }
      const newTypes = Array.from(types).join(",");
      this.$router.replace({ query: { service: newTypes } });
    },
    newProductHandle() {
      let showcase = null;
      const { type } =
        this.spStore.servicesProviders.find(({ uuid }) => {
          showcase =
            this.spStore.getShowcases.find(
              ({ uuid }) => uuid === this.queryTypes[0]
            ) ?? {};

          return showcase?.servicesProvider?.includes(uuid);
        }) ?? {};

      let name = "service-virtual";
      const query = { service: this.queryTypes[0] };

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
          if (showcase?.meta?.type === "vpn") {
            name = "service-vpn";
          } else {
            name = "service-custom";
            query.headerTitle =
              showcase.promo?.[this.$i18n.locale]?.title ?? showcase.title;
          }
          break;
        }

        case "openai":
          name = "service-openai";
          query.headerTitle =
            showcase.promo?.[this.$i18n.locale]?.title ||
            showcase.title ||
            "ChatGPT";
          break;

        case "openai":
          name = "service-bots";
          query.headerTitle =
            showcase.promo?.[this.$i18n.locale]?.title ||
            showcase.title ||
            "AIBot";
          break;
        case "vdc":
          name = "newVDC";
          break;
        case "keyweb":
        case "ione":
        case "ovh":
          name = "newPaaS";
      }

      if (!type && this.productsStore.services[this.queryTypes[0]]) {
        name = "service-iaas";
      }

      this.$router.push({ name, query });
    },
    filterProducts(products, types) {
      return products.filter(
        ({ sp, hostingid, config, billingPlan, productname }) => {
          // фильтруем по значениям из гет запроса
          let { title, locations = [] } =
            this.spStore.servicesProviders.find(({ uuid }) => uuid === sp) ??
            {};

          if (hostingid) title = "Virtual";
          if (this.isFilterByLocation) {
            const key = Object.keys(config?.configuration ?? {}).find((key) =>
              key.includes("datacenter")
            );
            const region = locations?.find(
              ({ extra }) => extra.region === (config?.configuration ?? {})[key]
            );

            title = region?.title ?? locations[0];
          }

          return types.some((value) => {
            if (this.services[value]) {
              return this.services[value].find(
                ({ name }) => name === productname
              );
            }

            const service = this.spStore.getShowcases.find(
              ({ uuid }) => uuid === value
            );

            if (!service) return value === title;
            else {
              const isPlanIncluded = service.plans.includes(billingPlan?.uuid);
              const isSpIncluded = service.servicesProvider.includes(sp);

              return isPlanIncluded && isSpIncluded;
            }
          });
        }
      );
    },
    getProductsCountByType(type) {
      if (this.checkedTypes.length > 0) {
        return this.filterProducts(this.productsPrepared, [type]).length;
      }

      if (this.min) {
        return this.products.length;
      } else {
        return this.productsPrepared.length;
      }
    },
    isExpired(instance) {
      const productDate = new Date(instance.date);
      const timestamp = productDate.getTime() - Date.now();
      const days = 7 * 24 * 3600 * 1000;

      if (instance.groupname === "SSL") return;
      if (instance.date === 0) return;
      return timestamp < days;
    },
    createObserver() {
      // const button = this.$refs['order-button']?.$el
      // if (!button && !this.anchor) return
      // else if (this.anchor) {
      //   this.anchor.remove()
      //   return
      // }
      // const anchor = button.cloneNode(true)
      // const observer = new IntersectionObserver((entries) => {
      //   if (entries[0].intersectionRatio < 0.2) {
      //     button.style.visibility = 'hidden'
      //     anchor.style.cssText = `
      //       position: fixed;
      //       right: 5vw;
      //       bottom: 7vh;
      //       display: block;
      //       width: 50px;
      //       height: 50px;
      //       font-size: 25px;
      //       overflow: hidden;
      //     `
      //     anchor.firstElementChild.style.margin = '7px 20px 0 -7px'
      //   } else if (entries[0].intersectionRatio === 1) {
      //     button.style.visibility = ''
      //     anchor.style.cssText = 'display: none'
      //     anchor.firstElementChild.style.margin = ''
      //   }
      // }, { root: null, threshold: [0.2, 1] })
      // observer.observe(button)
      // anchor.onclick = this.newProductHandle
      // document.querySelector('#app').append(anchor)
      // this.anchor = anchor
    },
  },
};
</script>

<style scoped>
.products__wrapper {
  border-radius: 10px;
  padding: 10px 10px 15px 10px;
}

.products__header {
  display: flex;
  justify-content: space-between;
  padding: 7px 15px;
  margin-bottom: 15px;
  background: var(--bright_font);
  border-radius: 10px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
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

.products__filters {
  padding: 5px 7px;
  border-radius: 7px;
  background: var(--main);
  color: var(--gloomy_font);
  font-weight: 700;
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

.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.5s ease;
}
.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
}

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
