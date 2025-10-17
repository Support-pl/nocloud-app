<template>
  <div class="services__wrapper">
    <div v-if="useNewLayout" class="services__grid--new">
      <template v-if="categories.length > 0">
        <a-menu
          v-model:selectedKeys="selectedCategories"
          mode="inline"
          :multiple="false"
          class="category-menu"
        >
          <a-menu-item key="all" class="menu-item">
            <template #icon>
              <AppstoreOutlined />
            </template>
            <span class="menu-text">All Services</span>
          </a-menu-item>
          <a-menu-item
            v-for="category in categories"
            :key="category.uuid"
            class="menu-item"
          >
            <template #icon>
              <FolderOutlined />
            </template>
            <span class="menu-text">
              {{
                category.promo?.[$i18n.locale] ||
                category.promo?.en ||
                category.title
              }}
            </span>
          </a-menu-item>
        </a-menu>

        <div v-if="selectedCategories.includes('all')" class="categories__grid">
          <div
            v-for="(column, columnIndex) in getCategoryColumns(
              filteredCategories
            )"
            :key="columnIndex"
            class="category-column"
          >
            <div
              v-for="category in column"
              :key="category.uuid"
              class="category__container"
            >
              <div v-if="isAllSelected" class="category__header">
                <h3 class="category__title">
                  {{
                    category.promo?.[$i18n.locale] ||
                    category.promo?.en ||
                    category.title
                  }}
                </h3>
              </div>
              <div class="category__services">
                <a-badge
                  v-for="service in category.services"
                  :key="service.title"
                  count="+"
                  :offset="[-5, 10]"
                  :number-style="getBadgeStyle(service.title)"
                  @click="newProductHandler(service)"
                  @mouseover="hovered = service.title"
                  @mouseleave="hovered = null"
                  class="service-badge"
                >
                  <service-item
                    v-if="!service.needLogin || isLogged"
                    :service="service"
                    :products-count="productsCount"
                    @mouseover="hovered = service.title"
                    @mouseleave="hovered = null"
                  />
                </a-badge>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="services__grid--old"
          :style="{ gridTemplateColumns: `repeat(${4}, 1fr)` }"
        >
          <a-badge
            v-for="service in filteredCategories[0].services"
            :key="service.title"
            count="+"
            :number-style="oldLayoutBadgeStyle(service.title)"
            @click="newProductHandler(service)"
            @mouseover="hovered = service.title"
            @mouseleave="hovered = null"
            class="service-badge--old"
          >
            <service-item
              old-layout
              v-if="!service.needLogin || isLogged"
              :service="service"
              :products-count="productsCount"
              @mouseover="hovered = service.title"
              @mouseleave="hovered = null"
            />
          </a-badge>
        </div>
      </template>
    </div>

    <div
      v-else
      class="services__grid--old"
      :style="{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }"
    >
      <a-badge
        v-for="service in avaliableServices"
        :key="service.title"
        count="+"
        :number-style="oldLayoutBadgeStyle(service.title)"
        @click="newProductHandler(service)"
        @mouseover="hovered = service.title"
        @mouseleave="hovered = null"
        class="service-badge--old"
      >
        <service-item
          v-if="!service.needLogin || isLogged"
          :service="service"
          :products-count="productsCount"
          @mouseover="hovered = service.title"
          @mouseleave="hovered = null"
        />
      </a-badge>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  defineAsyncComponent,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import * as icons from "@ant-design/icons-vue";
import config from "@/appconfig.js";

import { useSpStore } from "@/stores/sp.js";
import { useAuthStore } from "@/stores/auth.js";
import { useProductsStore } from "@/stores/products.js";
import serviceItem from "@/components/services/serviceItem.vue";

const BREAKPOINT = 1050;
const MOBILE_BREAKPOINT = 575;
const DEFAULT_COLUMNS = 5;
const MOBILE_COLUMNS = 3;

const iconComponents = {
  solution: defineAsyncComponent(() =>
    import("@ant-design/icons-vue/SolutionOutlined")
  ),
  cluster: defineAsyncComponent(() =>
    import("@ant-design/icons-vue/ClusterOutlined")
  ),
  shopping: defineAsyncComponent(() =>
    import("@ant-design/icons-vue/ShoppingOutlined")
  ),
  form: defineAsyncComponent(() =>
    import("@ant-design/icons-vue/FormOutlined")
  ),
  dns: defineAsyncComponent(() =>
    import("@ant-design/icons-vue/UnorderedListOutlined")
  ),
};

// Props
const props = defineProps({
  productsCount: { type: Function, required: true },
});

// Composables
const { locale: i18nLocale } = useI18n();
const router = useRouter();

// Stores
const authStore = useAuthStore();
const productsStore = useProductsStore();
const spStore = useSpStore();

// Reactive data
const hovered = ref(null);
const windowWidth = ref(window.innerWidth);
const selectedCategories = ref(["all"]);

// Computed properties
const isLogged = computed(() => authStore.isLogged);
const baseURL = computed(() => authStore.baseURL);
const services = computed(() => productsStore.services);
const servicesProviders = computed(() => spStore.servicesProviders);
const showcases = computed(() => spStore.showcases);

const useNewLayout = computed(() => {
  return windowWidth.value > BREAKPOINT;
});

const isAllSelected = computed(() => {
  return selectedCategories.value.includes("all");
});

const filteredCategories = computed(() => {
  if (isAllSelected.value) {
    return categories.value;
  }

  const selectedCategoryUuid = selectedCategories.value[0];
  return categories.value.filter(
    (category) => category.uuid === selectedCategoryUuid
  );
});

const avaliableServices = computed(() => {
  const servicesList = [];

  if (config.sharedEnabled) {
    servicesList.push({
      title: "Virtual",
      translatable: true,
      icon: iconComponents.solution,
      type: "virtual",
      onclick: {
        function: routeTo,
        paramsArr: [{ name: "products", query: { service: "Virtual" } }],
      },
    });
  }

  if (config.vdcEnabled) {
    servicesList.push({
      title: "VDC",
      translatable: false,
      icon: iconComponents.cluster,
      type: "VDC",
      onclick: {
        function: routeTo,
        paramsArr: [{ name: "products", query: { service: "VDC" } }],
      },
    });
  }

  Object.keys(services.value).forEach((service) => {
    servicesList.push({
      title: service,
      icon: iconComponents.shopping,
      type: service,
      onclick: {
        function: routeTo,
        paramsArr: [{ name: "products", query: { service } }],
      },
    });
  });

  showcases.value
    .filter((showcase) => showcase?.meta?.type !== "ione-vpn")
    .forEach((showcase) => {
      servicesList.push({
        ...showcase,
        icon: icons[showcase.icon] ?? showcase.icon,
        onclick: {
          function: routeTo,
          paramsArr: [{ name: "products", query: { service: showcase.uuid } }],
        },
      });
    });

  if (config.whmcsRegistration) {
    servicesList.push({
      title: "registration in BelGIE",
      translatable: true,
      icon: iconComponents.form,
      type: "BelGIE",
      onclick: {
        function: routeTo,
        paramsArr: [{ name: "registration form", query: {} }],
      },
    });
  }

  if (config.dnsEditor) {
    servicesList.push({
      title: "DNS Editor",
      translatable: true,
      icon: iconComponents.dns,
      type: "DNSEditor",
      onclick: {
        function: routeTo,
        paramsArr: [{ name: "dns editor", query: {} }],
      },
    });
  }

  return sortServices(servicesList);
});

const columnsCount = computed(() => {
  const maxColumns =
    windowWidth.value < MOBILE_BREAKPOINT ? MOBILE_COLUMNS : DEFAULT_COLUMNS;
  return Math.min(avaliableServices.value.length, maxColumns);
});

const categories = computed(() => {
  if (!useNewLayout.value) return [];

  const categoriesMap = createCategoriesMap();
  return Array.from(categoriesMap.values())
    .filter((category) => category.services.length > 0)
    .sort((a, b) => (a.sorter || 0) - (b.sorter || 0));
});

// Methods
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const sortServices = (servicesList) => {
  return servicesList.sort((a, b) => {
    const aIsShopping = a.icon === "shopping";
    const bIsShopping = b.icon === "shopping";

    if (aIsShopping && !bIsShopping) return -1;
    if (bIsShopping && !aIsShopping) return 1;
    if (aIsShopping && bIsShopping) return 0;

    return (a.sorter || 0) - (b.sorter || 0);
  });
};

const createCategoriesMap = () => {
  const categoriesMap = new Map();

  // Get all showcase categories
  const showcaseCategories = [];
  showcases.value.forEach((showcase) => {
    if (showcase.categories && Array.isArray(showcase.categories)) {
      showcase.categories.forEach((category) => {
        const existingCategory = showcaseCategories.find(
          (c) => c.uuid === category.uuid
        );
        if (!existingCategory) {
          showcaseCategories.push({
            ...category,
            services: [],
          });
        }
      });
    }
  });

  // Initialize categories map with showcase categories
  showcaseCategories.forEach((category) => {
    categoriesMap.set(category.uuid, {
      uuid: category.uuid,
      title: category.title,
      promo: category.promo || {},
      sorter: category.sorter || 0,
      type: Array.isArray(category.type)
        ? category.type
        : [category.type || ""],
      services: [],
    });
  });
  const services = [...avaliableServices.value];
  services.sort((a, b) => (!a.uuid ? 1 : -1));

  // Distribute services to categories
  services.forEach((service) => {
    let assignedToCategory = false;

    // Check if service belongs to any showcase category
    if (service.uuid) {
      const showcase = showcases.value.find((s) => s.uuid === service.uuid);
      if (
        showcase &&
        showcase.categories &&
        Array.isArray(showcase.categories)
      ) {
        showcase.categories.forEach((category) => {
          if (categoriesMap.has(category.uuid)) {
            categoriesMap.get(category.uuid).services.push(service);
            assignedToCategory = true;
          }
        });
      }
    }

    if (!assignedToCategory) {
      const othersCategory = getOrCreateOthersCategory(categoriesMap, service);
      othersCategory.services.push(service);
    }
  });

  categoriesMap.forEach((category) => {
    category.services.sort((a, b) => (a.sorter || 0) - (b.sorter || 0));
  });

  return categoriesMap;
};

const getOrCreateOthersCategory = (categoriesMap, service) => {
  let categoryType = "others";
  const othersUuid = "others";

  if (service.type === "VDC") {
    categoryType = "vds";
  } else if (service.type === "virtual") {
    categoryType = "hosting";
  } else if (service.type === "DNSEditor") {
    categoryType = "domains";
  }

  const othersCategory = categoriesMap
    .values()
    .find((cat) => cat.type.includes(categoryType));

  if (!othersCategory) {
    categoriesMap.set(othersUuid, {
      uuid: othersUuid,
      title: "Others",
      promo: {
        en: "Others",
        ru: "Прочее",
      },
      sorter: 999,
      type: ["others"],
      services: [],
    });
    return getOrCreateOthersCategory(categoriesMap, service);
  }

  return othersCategory;
};

const getCategoryColumns = (categoriesList) => {
  const columns = [[], [], []];
  const columnWeights = [0, 0, 0];

  const sortedCategories = [...categoriesList].sort(
    (a, b) => b.services.length - a.services.length
  );

  sortedCategories.forEach((category) => {
    const minWeightIndex = columnWeights.indexOf(Math.min(...columnWeights));
    columns[minWeightIndex].push(category);
    columnWeights[minWeightIndex] += category.services.length;
  });

  return columns.filter((column) => column.length > 0);
};

const getBadgeStyle = (serviceTitle) => {
  const isHovered = hovered.value === serviceTitle;

  return {
    width: "auto",
    fontSize: "20px",
    transform: isHovered ? "none" : "scale(0) translate(-10px, -10px)",
    backgroundColor: "var(--bright_font)",
    boxShadow: "0 0 0 1px var(--main)",
    color: "var(--main)",
    cursor: "pointer",
    transition: "0.3s",
  };
};

const oldLayoutBadgeStyle = (serviceTitle) => {
  const isHovered = hovered.value === serviceTitle;

  return {
    width: "auto",
    fontSize: "20px",
    transform: isHovered ? "none" : "scale(0) translate(-20px, -20px)",
    backgroundColor: "var(--bright_font)",
    boxShadow: "0 0 0 1px var(--main)",
    color: "var(--main)",
    cursor: "pointer",
    transition: "0.3s",
  };
};

const routeTo = (param) => {
  router.push(param);
};

const newProductHandler = (service) => {
  const routeConfig = generateRouteConfig(service);
  router.push(routeConfig);
};

const generateRouteConfig = (service) => {
  const provider = service.onclick.paramsArr[0].query.service;
  const showcase = findShowcase(provider);
  const { type } = findServiceProvider(provider, showcase) || {};

  let name = "service-virtual";
  const query = { service: provider };

  const routeMap = {
    opensrs: "service-domains",
    goget: "service-ssl",
    acronis: "service-acronis",
    openai: "service-openai",
    bots: "service-bots",
    ione: "newPaaS",
    ovh: "newPaaS",
    keyweb: "newPaaS",
    bitrix24: "service-b24-apps",
  };

  if (routeMap[type]) {
    name = routeMap[type];
  } else if (type === "empty" || type === "virtual") {
    name = getVirtualServiceRoute(showcase);
    query.headerTitle =
      showcase.promo?.[i18nLocale.value]?.title ?? showcase.title;
  }

  if (type === "openai" || type === "bots") {
    query.headerTitle =
      showcase.promo?.[i18nLocale.value]?.title ||
      showcase.title ||
      (type === "openai" ? "ChatGPT" : "AIBot");
  }

  if (!type && services.value[provider]) name = "service-iaas";
  if (service.type === "VDC") name = "newVDC";
  if (service.type === "BelGIE") name = "registration form";
  if (service.type === "DNSEditor") name = "dns editor";

  return { name, query };
};

const findShowcase = (provider) => {
  return showcases.value.find(({ uuid }) => uuid === provider);
};

const findServiceProvider = (provider, showcase) => {
  return servicesProviders.value.find(({ uuid }) =>
    showcase?.items?.find(({ servicesProvider }) => servicesProvider === uuid)
  );
};

const getVirtualServiceRoute = (showcase) => {
  if (showcase.title.toLowerCase().includes("vpn")) return "service-vpn";
  if (showcase.meta?.type === "b24-apps") return "service-b24-apps";
  return "service-custom";
};

// Lifecycle hooks
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.services__wrapper {
  display: flex;
  flex-direction: column;
}

.services__grid--old {
  display: grid;
  grid-gap: 5px;

  .service-badge--old {
    width: 100%;
  }
}

.services__grid--new {
  gap: 24px;
  display: grid;
  grid-template-columns: 250px auto;
}

.category-menu {
  border-right: 1px solid var(--border-color, #e8e8e8);
  background: transparent;

  :deep(.ant-menu-item) {
    padding: 8px 16px;
    margin: 2px 0;
    height: auto;
    line-height: 1.4;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--primary-1, #f0f5ff);
    }

    &.ant-menu-item-selected {
      color: var(--primary-color, #1890ff);
      background-color: transparent;
    }
  }

  :deep(.ant-menu-item-icon) {
    font-size: 16px;
    min-width: 16px;
  }
}

.menu-item {
  display: flex;
  align-items: center;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.categories__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;

  @media (min-width: 1600px) {
    gap: 24px;
  }
}

.category-column {
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: 1600px) {
    gap: 28px;
  }
}

.category__container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category__header {
  margin: 0;
}

.category__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category__services {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-badge {
  display: block;
  width: 100%;
}
</style>
