<template>
  <div class="products__wrapper">
    <div class="products__header" v-if="isLogged">
      <div class="products__title">
        <!-- Ваши услуги -->
        <transition name="header-transition" mode="out-in">
          <span
            class="header__animated"
            v-if="!productsLoading || isNeedFilterStringInHeader"
            :key="$route.query.service || 'emptyQuery'"
          >
            {{ (isNeedFilterStringInHeader) ? '' : `${$t("comp_services.Your orders")}:` }}
            <span class="products__count" v-if="!isNeedFilterStringInHeader">
              {{ productsCount() }}
            </span>

            <transition-group name="fade-in" style="display: flex; flex-wrap: wrap; gap: 10px">
              <a-badge class="products__filters" v-for="checkedType of checkedTypesString" :key="checkedType.value">
                <template #count>
                  <a-icon
                    type="close-circle"
                    theme="filled"
                    style="color: var(--err)"
                    @click="filterElementClickHandler(checkedType.value)"
                  />
                </template>
                {{ checkedType.title }}: {{ productsCount(checkedType.value) }}
                <!-- всего -->
              </a-badge>
            </transition-group>
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
            <p v-for="productType of types" :key="productType.value ?? productType">
              <a-checkbox
                :checked="!!~checkedTypes.indexOf(productType.value ?? productType)"
                @click="filterElementClickHandler(productType.value ?? productType)"
              >
                {{ productType.title ?? productType }}
              </a-checkbox>
            </p>
          </template>
          <template slot="title">
            <span>
              {{ $t("filter") | capitalize }} {{ $t("by") }}
            </span>
            <span class="products__count">
              {{ (isFilterByLocation) ? $t('location') : $t('provider') }}
            </span>
            <a-switch size="small" v-model="isFilterByLocation" />
          </template>
          <a-icon
            type="filter"
            class="products__control-item"
            :style="{ color: (checkedTypes.length > 0) ? 'var(--main)' : null }"
          />
        </a-popover>
        <a-popover placement="bottomRight" arrow-point-at-center>
          <template slot="content">
            <a-radio-group v-model="sortBy">
              <a-radio value="Name">{{ $t('name') | capitalize }}</a-radio>
              <a-radio value="Cost">{{ $t('cost') | capitalize }}</a-radio>
              <a-radio value="Date">{{ $t('date') | capitalize }}</a-radio>
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
      class="products__inner"
      :class="{ 'products__wrapper--loading': productsLoading }"
    >
      <div class="products__unregistred" v-if="!isLogged">
        {{ $t("unregistered.will be able after") }}
        <router-link :to="{ name: 'login' }">{{ $t("unregistered.login") }}</router-link>.
      </div>
      <loading v-else-if="productsLoading" />
      <template v-else-if="productsPrepared.length > 0">
        <cloud-item
          v-for="product in productsPrepared"
          :key="product.orderid"
          :instance="product"
          @click="productClickHandler(product)"
        />
      </template>
      <a-empty v-else />
      <a-button
        ref="order-button"
        class="products__new"
        size="large"
        shape="round"
        icon="plus"
        type="primary"
        @click="newProductHandle"
        block
        v-if="queryTypes.length === 1 && !isFilterByLocation"
      >
        {{ $t("Order") }}
      </a-button>
    </div>
  </div>
</template>

<script>
import cloudItem from "@/components/appMain/cloud/cloudItem.vue";
import loading from "../loading/loading.vue";

export default {
  name: "products-block",
  components: { cloudItem, loading },
  props: {
    min: { type: Boolean, default: true },
    count: { type: Number, default: 5 },
  },
  data: () => ({
    isFilterByLocation: false,
    sortType: 'sort-ascending',
    sortBy: 'Date',
    anchor: null
  }),
  created() {
    const service = localStorage.getItem('types');
    const sorting = JSON.parse(localStorage.getItem('serviceSorting') ?? "false");
    const isProductsRoute = service && this.$route.name !== 'products';
    const isServicesSame = service === this.$route.query.service;

    if (isProductsRoute && !isServicesSame) {
      this.$router.replace({ query: { service } });
    }
    if (localStorage.getItem('isFilterByLocation')) {
      this.isFilterByLocation = JSON.parse(localStorage.getItem('isFilterByLocation'));
    }
    if (sorting) {
      this.sortBy = sorting.sortBy;
      this.sortType = sorting.sortType;
    }

    if (this.sp.length < 1) {
      this.$store.dispatch('nocloud/sp/fetch', !this.isLogged)
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$notification['error']({ message: this.$t(message) });
        });
    }

    if (Object.keys(this.services).length < 1) {
      this.$store.dispatch("products/fetchServices")
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$notification['error']({ message: this.$t(message) });
        });
    }

    if (!this.isLogged) return;
    this.$store.commit("products/setProductsLoading", true);
    this.$store.dispatch("nocloud/auth/fetchBillingData")
      .then((user) => {
        this.$store.dispatch("nocloud/vms/fetch");
        this.$store.dispatch("products/fetch", user.client_id);
      })
      .catch((err) => console.error(err));
  },
  mounted() { this.createObserver() },
  beforeDestroy() {
    const anchor = document.querySelector('#app').lastElementChild;

    if (this.anchor) anchor.remove();
  },
  computed: {
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    user() {
      return this.$store.getters["nocloud/auth/billingData"];
    },
    productsPrepared() {
      const state = {
        size: this.$store.getters["products/size"],
        page: this.$store.getters["products/page"]
      };
      const start = state.size * (state.page - 1);
      const end = start + state.size;
      const products = this.products.slice(start, end);

      if (this.min) return this.products.slice(0, 5);
      else if (this.$route.query.service) {
        return this.filterProducts(products, this.checkedTypes);
      }
      return products;
    },
    products() {
      const products = this.$store.getters["products/getProducts"]
        .map((el) => ({ ...el.ORDER_INFO, groupname: el.groupname, productname: el.name }));

      const instances = this.$store.getters["nocloud/vms/getInstances"]
        .map((inst) => {
          const regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

          const publicIPs = inst.state?.meta.networking?.public?.filter((el) => !regexp.test(el));
          const state = (this.VM?.billingPlan.type === 'ione')
            ? inst.state?.meta.lcm_state_str
            : inst.state?.state;
          let status = "UNKNOWN";

          switch (state) {
            case "LCM_INIT":
              status = "POWEROFF";
            default:
              if (state) status = state.replaceAll('_', ' ');
          }

          if (inst.state?.meta.state === 1) status = "PENDING";
          if (inst.state?.meta.state === 5) status = "SUSPENDED";
          if (inst.data.suspended_manually) status = "SUSPENDED";
          if (inst.state?.meta.state === "BUILD") status = "BUILD";

          const res = {
            ...inst,
            sp: inst.sp,
            orderid: inst.uuid,
            groupname: 'Self-Service VDS SSD HC',
            invoicestatus: null,
            domainstatus: status,
            productname: inst.title,
            domain: publicIPs?.at(0),
            date: inst.data.last_monitoring * 1000 || 0,
            orderamount: inst.billingPlan.products[inst.product]?.price ?? 0,
          };

          switch (inst.type) {
            case 'virtual':
              res.groupname = 'Custom';
              break;
            case 'acronis':
              res.groupname = 'Acronis';
              break;
            case 'opensrs':
              res.groupname = 'Domains';
              res.date = inst.data.expiry.expiredate;
              res.domain = inst.resources.domain;
              break;
            case 'goget': {
              const key = `${inst.resources.period} ${inst.resources.id}`;

              res.groupname = 'SSL';
              res.date = +`${inst.resources.period}`;
              res.domain = inst.resources.domain;
              res.orderamount = inst.billingPlan.products[key]?.price ?? 0;
              break;
            }
            case 'ovh': {
              const key = (inst.config.planCode)
                ? `${inst.config.duration} ${inst.config.planCode}`
                : inst.product;

              res.date = inst.data.expiration ?? inst.data.last_monitoring * 1000;
              res.orderamount = inst.billingPlan.products[key]?.price ?? 0;

              inst.config.addons?.forEach((addon) => {
                const { price } = inst.billingPlan.resources.find(
                  ({ key }) => key === `${inst.config.duration} ${addon}`
                ) ?? { price: 0 };

                res.orderamount += +price;
              });
              break;
            }
            case 'ione': {
              res.orderamount += +inst.billingPlan.resources.reduce((prev, curr) => {
                if (curr.key === `drive_${inst.resources.drive_type.toLowerCase()}`) {
                  return prev + curr.price * inst.resources.drive_size / 1024;
                } else if (curr.key === "ram") {
                  return prev + curr.price * inst.resources.ram / 1024;
                } else if (inst.resources[curr.key]) {
                  return prev + curr.price * inst.resources[curr.key];
                }
                return prev;
              }, 0)?.toFixed(2);
            }
          }

          return res;
        });

      return [...products, ...instances]
        .sort((a, b) => {
          if (this.sortType === 'sort-ascending') [b, a] = [a, b];
          if (this.min) {
            if (this.isExpired(a) && !this.isExpired(b)) return 1;
            else if (!this.isExpired(a) && this.isExpired(b)) return -1;
            else 0;
          }

          switch (this.sortBy) {
            case 'Date':
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'Name' :
              return a.productname.toLowerCase() < b.productname.toLowerCase();
            case 'Cost':
              return parseFloat(a.orderamount) - parseFloat(b.orderamount);
          }
        });
    },
    productsLoading() {
      const productsLoading = this.$store.getters["products/getProductsLoading"];
      const instancesLoading = this.$store.getters["nocloud/vms/isLoading"];

      return productsLoading || instancesLoading;
    },

    services() {
      return this.$store.getters['products/getServices'];
    },
    sp() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    types() {
      const result = this.sp.reduce((prev, curr) => {
        const showcase = Object.entries(curr.meta.showcase ?? {})
          .map(([value, { title }]) => ({ title, value }));

        return [...prev, ...showcase];
      }, []);

      if (this.isFilterByLocation) return this.sp.reduce((prev, curr) =>
        [...prev, ...curr.locations.map(({ title }) => title)], []
      );

      Object.keys(this.services).forEach((key) => {
        result.push(key);
      });

      if (this.$config.sharedEnabled) result.push('Virtual');
      return result;
    },
    checkedTypes() {
      return (
        this.$route.query?.service?.split(",").filter((el) => el.length > 0) ?? []
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
      return ["services", "root", "products"].includes(this.$route.name) && this.$route.query.service;
    },
    queryTypes() {
      if (this.$route.query.service) {
        return this.$route.query.service.split(",").filter((el) => el.length > 0);
      } else return [];
    },
  },
  methods: {
    productClickHandler({ groupname, orderid, hostingid }) {
      if (['Domains', 'SSL'].includes(groupname)) {
        this.$router.push({ name: 'service', params: { id: orderid } });
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
      this.$router.replace({ query: { service: newTypes } });
    },
    newProductHandle() {
      const services = this.$store.getters['products/getServices'];
      const { type } = this.sp.find(({ meta }) => (meta.showcase ?? {})[this.queryTypes[0]]) ?? {};
      let name = 'service-virtual';
      let query = {};

      switch (type) {
        case 'opensrs':
          name = 'service-domains';
          break;
        case 'goget':
          name = 'service-ssl';
          break;
        case 'acronis':
          name = 'service-acronis';
          break;
        case 'virtual':
          name = 'service-custom';
          break;
        case 'ione':
        case 'ovh':
          name = 'newPaaS';
          query = { service: this.queryTypes[0] };
      }

      if (!type && services[this.queryTypes[0]]) {
        name = 'service-iaas';
        query = { service: this.queryTypes[0] };
      }

      this.$router.push({ name, query });
    },
    filterProducts(products, types) {
      return products.filter(({ sp, hostingid, config, billingPlan, productname }) => {
          //фильтруем по значениям из гет запроса
          let { title, locations = [], meta } = this.sp.find(({ uuid }) => uuid === sp) ?? {};
          const service = Object.values(meta?.showcase ?? {}).find(
            (el) => el.billing_plans.includes(billingPlan.uuid)
          );

          if (hostingid) title = 'Virtual';
          if (this.isFilterByLocation) {
            const key = Object.keys(config?.configuration ?? {}).find(
              (key) => key.includes('datacenter')
            );
            const region = locations?.find(({ extra }) =>
              extra.region === (config?.configuration ?? {})[key]
            );

            title = region?.title ?? locations[0];
          }

          return types.some((value) => {
            if (this.services[value]) {
              return this.services[value].find(({ name }) => name === productname);
            }
            if (!meta?.showcase) return value === title;

            const plans = meta?.showcase[value]?.billing_plans ?? [];

            if (plans?.includes(billingPlan.uuid) && service) return true;
            else if (plans?.length > 0) return false;
            else return value === title || meta?.showcase[value];
          });
        });
    },
    productsCount(type) {
      const total = this.$store.getters["products/total"];

      if (this.checkedTypes.length > 0) {
        return this.filterProducts(this.productsPrepared, [type]).length;
      }

      if (total && this.$route.name !== "products") return total;
      if (this.min) {
        return this.products.length;
      } else {
        return this.productsPrepared.length;
      }
    },
    isExpired(instance){
      const productDate = new Date(instance.date);
      const timestamp = productDate.getTime() - Date.now();
      const days = 7 * 24 * 3600 * 1000;

      if (instance.groupname === 'SSL') return;
      if (instance.date === 0) return;
      return timestamp < days;
    },
    createObserver() {
      const button = this.$refs['order-button']?.$el;

      if (!button && !this.anchor) return;
      else if (this.anchor) {
        document.querySelector('#app').lastElementChild.remove();
        this.anchor = null;
        return;
      }

      const anchor = button.cloneNode(true);
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio < 0.2) {
          button.style.visibility = 'hidden';
          anchor.style.cssText = `
            position: fixed;
            right: 5vw;
            bottom: 7vh;
            display: block;
            width: 50px;
            height: 50px;
            font-size: 25px;
            overflow: hidden;
          `;
          anchor.firstElementChild.style.margin = '7px 20px 0 -7px';
        } else if (entries[0].intersectionRatio === 1) {
          button.style.visibility = '';
          anchor.style.cssText = 'display: none';
          anchor.firstElementChild.style.margin = '';
        }
      }, { root: null, threshold: [0.2, 1] });

      observer.observe(button);
      anchor.onclick = this.newProductHandle;
      document.querySelector('#app').append(anchor);
      this.anchor = anchor;
    }
  },
  watch: {
    queryTypes() { setTimeout(this.createObserver) },
    checkedTypes() {
      if (this.$route.query.service) {
        localStorage.setItem('types', this.$route.query.service);
      } else {
        localStorage.removeItem('types');
      }
    },
    sortBy(value) {
      const sorting = { sortBy: value, sortType: this.sortType };

      localStorage.setItem('serviceSorting', JSON.stringify(sorting));
    },
    sortType(value) {
      const sorting = { sortBy: this.sortBy, sortType: value };

      localStorage.setItem('serviceSorting', JSON.stringify(sorting));
    },
    isFilterByLocation(value) {
      if (this.$route.name === 'products') {
        localStorage.setItem('isFilterByLocation', false);
      } else {
        localStorage.setItem('isFilterByLocation', value);

        if (this.$route.query.service) {
          this.$router.replace({ query: {} });
        }
      }
    }
  }
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
  background: #fff;
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
  background: #fff;
  box-shadow: 5px 8px 10px rgba(0,0,0,.05);
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
  background: #fff;
  box-shadow: 5px 8px 10px rgba(0,0,0,.05);
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
  color: var(--bright_font);
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
