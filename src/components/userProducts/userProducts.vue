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
        <a-popover placement="bottomRight" arrow-point-at-center>
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
        <a-popover placement="bottomRight" arrow-point-at-center>
          <template slot="content">
            <a-radio-group v-model="sortBy">
              <a-radio value="Name">Name</a-radio>
              <a-radio value="Cost">Cost</a-radio>
              <a-radio value="Date">Date</a-radio>
            </a-radio-group>
          </template>
          <template slot="title">
            <span>
              {{ $t("sort") | capitalize }}
            </span>
          </template>
          <a-icon
            class="products__control-item"
            :type="sortType"
            @click="() => (sortType === 'sort-descending')
              ? sortType = 'sort-ascending'
              : sortType = 'sort-descending'"
          />
        </a-popover>
      </div>
    </div>
    <div
      class="products__wrapper"
      style="flex-direction: column"
      :class="{ 'products__wrapper--loading': productsLoading }"
    >
      <div class="products__unregistred" v-if="!user">
        {{ $t("unregistered.will be able after") }}
        <router-link :to="{ name: 'login' }">{{
          $t("unregistered.login")
        }}</router-link
        >.
      </div>
      <loading v-else-if="productsLoading" />
      <template v-else-if="productsPrepared.length > 0">
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
  components: { product, loading },
  props: {
    min: { type: Boolean, default: true },
    count: { type: Number, default: 5 },
  },
  data: () => ({ sortBy: 'Date', sortType: 'sort-ascending' }),
  mounted() {
    if (!this.isLogged) return;
    this.$store.commit("products/setProductsLoading", true);
    this.$store.dispatch("nocloud/auth/fetchBillingData")
      .then((user) => {
        this.$store.dispatch("nocloud/vms/fetch");
        this.$store.dispatch("products/fetch", user.client_id);
      })
      .catch((err) => console.error(err));
  },
  computed: {
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    user() {
      return this.$store.getters["nocloud/auth/billingData"];
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
      const products = this.$store.getters["products/getProducts"];
      const instances = this.$store.getters["nocloud/vms/getInstances"]
        .map((inst) => ({
          orderid: inst.uuid,
          groupname: (inst.type === 'opensrs') ? 'Domains' : 'Self-Service VDS SSD HC',
          invoicestatus: null,
          domainstatus: inst.state?.meta?.state_str || 'DELETED',
          productname: inst.title,
          domain: (inst.type === 'opensrs')
            ? inst.resources.domain
            : inst.state?.meta.networking?.public?.at(0),
          date: inst.data.last_monitoring * 1000 || 0,
          orderamount: 0,
        }));

      return [...products, ...instances]
        .sort((a, b) => {
          if (this.sortType === 'sort-ascending') [b, a] = [a, b];
          switch (this.sortBy) {
            case 'Date':
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'Name' :
              return a.productname - b.productname;
            case 'Cost':
              return parseFloat(a.orderamount) - parseFloat(a.orderamount);
          }
        });
    },
    productsLoading() {
      const productsLoading = this.$store.getters["products/getProductsLoading"];
      const instancesLoading = this.$store.getters["nocloud/vms/isLoading"];
      return productsLoading || instancesLoading;
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
    productClickHandler({ groupname, orderid, hostingid }) {
      if (groupname === 'Domains') {
        // this.$router.push({ name: 'service', params: { id: orderid } });
        return;
      } else if (groupname === 'Self-Service VDS SSD HC') {
        this.$router.push({ name: 'openCloud_new', params: { uuid: orderid } });
      } else {
        this.$router.push({ name: 'service', params: { id: hostingid } });
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
  display: flex;
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
