<template>
  <div class="products_wrapper">
    <div class="products__header">
      <div class="products__title">
        {{ $t("comp_services.Your orders") }}
        <!-- Ваши услуги -->
        <transition name="header-transition" mode="out-in">
          <span
            class="header__animated"
            :key="$route.query.type || 'emptyQuery'"
          >
            <span v-if="isNeedFilterStringInHeader">
              {{ $t("comp_services.with filter") }}:
              <b>{{ $route.query.type.replace(/,/g, ", ") }}</b>
              <!-- по фильтру -->
            </span>
            <transition name="fade-in">
              <span v-if="!productsLoading" class="products__count">
                {{ $t("comp_services.total") }}: {{ productsCount }}
                <!-- всего -->
              </span>
            </transition>
          </span>
        </transition>
      </div>

      <div v-if="min && user" class="products__all">
        <router-link :to="{ name: 'products' }">
          {{ $t("comp_services.all") }}
          <!-- все -->
        </router-link>
      </div>
      <div v-else-if="user" class="products__control">
        <a-popover placement="bottomRight">
          <template slot="content">
            <p v-for="(type, key) in $config.services" :key="key">
              <a-checkbox
                :checked="!!~checkedTypes.indexOf(key)"
                @click="filterElementClickHandler(key)"
              >
                {{ key }}
              </a-checkbox>
            </p>
          </template>
          <template slot="title">
            <span>
              {{ $t("filter") | capitalize }}
            </span>
          </template>
          <a-icon class="products__control-item" type="filter" />
        </a-popover>
        <a-popover placement="bottomRight">
          <template slot="content">
            <p>
              {{ $t("coming soon") }}
            </p>
          </template>
          <template slot="title">
            <span>
              {{ $t("sort") | capitalize }}
            </span>
          </template>
          <a-icon class="products__control-item" type="sort-ascending" />
        </a-popover>
      </div>
    </div>
    <div
      class="products__wrapper"
      :class="{ 'products__wrapper--loading': productsLoading }"
    >
      <div class="products__unregistred" v-if="!user">
        {{ $t("unregistered.will be able after") }}
        <router-link :to="{ name: 'login' }">{{
          $t("unregistered.login")
        }}</router-link
        >.
      </div>
      <template v-else-if="!productsLoading && productsPrepared.length > 0">
        <product
          v-for="product in productsPrepared"
          @click.native="productClickHandler(product)"
          :key="product.orderid"
          :title="product.productname"
          :date="new Date(product.date)"
          :cost="product.orderamount"
          :domain="product.domain"
          :status="product.domainstatus"
          :wholeProduct="product"
        />
      </template>
      <loading v-else-if="productsLoading" />
      <a-empty v-else />
      <a-button
        class="products__new"
        size="large"
        shape="round"
        icon="plus"
        type="primary"
        style="margin-top: 15px"
        @click="newProductHandle"
        block
        v-if="queryTypes.length == 1"
      >
        {{ $t("Order") }}
      </a-button>
    </div>
  </div>
</template>

<script>
import product from "./product.vue";
import loading from "../loading/loading.vue";

export default {
  name: "products-block",
  components: {
    product,
    loading,
  },
  props: {
    min: {
      type: Boolean,
      default: true,
    },
    count: {
      type: Number,
      default: 5,
    },
  },
  data() {
    return {};
  },
  mounted() {
    if (!this.isLogged) return;
    this.$store.dispatch("products/autoFetch");
  },
  computed: {
    user() {
      return this.$store.getters.getUser;
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    productsPrepared() {
      if (this.min) return this.products.slice(0, 5);
      else if (this.$route.query.type) {
        const types = this.checkedTypes;
        const result = this.products.filter((element) => {
          //фильтруем по значениям из гет запроса
          return types.some((type) => {
            const groupname = this.$config.services[type].groupname;
            if (typeof groupname == "string")
              return groupname.toLowerCase() == element.groupname.toLowerCase();
            else
              return groupname.some(
                (group) =>
                  group.toLowerCase() == element.groupname.toLowerCase()
              );
          });
        });
        return result;
      }
      return this.products;
    },
    products() {
      return this.$store.getters["products/getProducts"];
    },
    productsLoading() {
      return this.$store.getters["products/getProductsLoading"];
    },
    checkedTypes() {
      return (
        this.$route.query?.type?.split(",").filter((el) => el.length > 0) || []
      );
    },
    productsCount() {
      if (this.min) {
        return this.products.length;
      } else if (this.$route.name == "products") {
        return this.productsPrepared.length;
      } else {
        return 0;
      }
    },
    isNeedFilterStringInHeader() {
      return this.$route.name == "products" && this.$route.query.type;
    },
    queryTypes() {
      if (this.$route.query.type) {
        const ret = this.$route.query.type
          .split(",")
          .filter((el) => el.length > 0);
        return ret;
      } else return [];
    },
  },
  methods: {
    productClickHandler(product) {
      this.$router.push({ name: "service", params: { id: product.hostingid } });
    },
    filterElementClickHandler(key) {
      const types = new Set(this.checkedTypes);
      if (types.has(key)) {
        types.delete(key);
      } else {
        types.add(key);
      }
      const newTypes = Array.from(types).join(",");
      this.$router.replace({ query: { type: newTypes } });
    },
    newProductHandle() {
      const newRoute = {
        name: this.$config.services[this.queryTypes[0]].creationRouteName,
      };
      this.$router.push(newRoute);
    },
  },
};
</script>

<style scoped>
.header__animated {
  display: inline-block;
}

.products_wrapper {
  background: #fff;
  border-radius: 10px;
  padding: 10px 10px 15px 10px;
}

.products__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  margin-bottom: 15px;
}

.products__wrapper--loading {
  min-height: 170px;
  /* display: flex; */
  justify-content: center;
  align-items: center;
}

.products__unregistred {
  font-size: 1.5rem;
}

.products__unregistred {
  text-align: center;
}

.products__title {
  font-size: 18px;
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
  margin-right: 10px;
  transform: translateY(-2px);
}

/* animations */

.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.5s ease;
}
.fade-in-enter,
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

.header-transition-enter {
  transform: translateY(-0.5em);
  opacity: 0;
}

.header-transition-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
