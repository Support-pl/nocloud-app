<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <div class="order_option">
          <a-slider
            v-if="isSlider"
            ref="slider"
            :marks="{ ...sizes }"
            :value="sizes.indexOf(options.size)"
            :tip-formatter="null"
            :max="sizes.length - 1"
            :min="0"
            @change="(value) => (options.size = sizes[value])"
          />

          <div v-else class="order__grid">
            <div
              v-for="item of sizes"
              :key="item"
              class="order__slider-item"
              :class="{ 'order__slider-item--active': options.size === item }"
              @click="options.size = item"
            >
              {{ item }}
            </div>
          </div>

          <transition name="specs" mode="out-in">
            <table
              v-if="currentProduct.resources"
              :key="currentProduct.title"
              class="product__specs"
            >
              <tr v-for="(value, key) in currentProduct.resources" :key="key">
                <td>{{ capitalize($t("virtual_product." + key)) }}</td>
                <td>
                  {{
                    ["Не ограничен", "unlimited"].includes(value)
                      ? $t("virtual_product.unlimited")
                      : value
                  }}
                </td>
              </tr>
            </table>
          </transition>

          <a-form
            style="margin-top: 15px"
            :model="config"
            :rules="rules"
            :label-col="{ span: 8, xs: 6 }"
            :wrapper-col="{ span: 16, xs: 18 }"
          >
            <a-form-item
              name="domain"
              :label="capitalize($t('ssl_product.domain'))"
            >
              <a-input
                v-if="!fetchLoading"
                v-model:value="config.domain"
                placeholder="example.com"
              />
              <div v-else class="loadingLine" />
            </a-form-item>

            <a-form-item
              v-if="!billingUser.email && isLogged"
              name="email"
              :label="capitalize($t('ssl_product.email'))"
            >
              <a-input
                v-if="!fetchLoading"
                v-model:value="config.email"
                placeholder="email"
              />
              <div v-else class="loadingLine" />
            </a-form-item>
          </a-form>
        </div>
      </div>

      <div class="order__calculate order__field">
        <a-row type="flex" justify="space-around" style="margin-top: 20px">
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

        <a-row type="flex" justify="space-around">
          <a-col style="font-size: 1.5rem">
            <template v-if="!fetchLoading && !isPlansLoading">
              <div class="price__sale" v-if="isSaleApply">
                <span class="without_sale">
                  {{ formatPrice(currentProduct.price, userCurrency) }}
                  {{ userCurrency.title }}
                </span>

                <span>
                  {{ formatPrice(currentProductWithSale.price, userCurrency) }}
                  {{ userCurrency.title }}
                </span>
              </div>
              <template v-else>
                {{ formatPrice(currentProduct.price, userCurrency) }}
                {{ userCurrency.title }}
              </template>
            </template>
            <div v-else class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

        <promocode-menu
          :plan-id="plan"
          :applyed-promocode="planWithApplyedPromocode"
          :is-flavors-loading="fetchLoading || isPlansLoading"
          @update:promocode="promocode = $event"
        />

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button block shape="round" type="primary" @click="orderConfirm">
              {{ capitalize($t("order")) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="
                () => {
                  modal.confirmCreate = false;
                }
              "
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
import { ref, reactive, computed, onMounted, watch, inject } from "vue";
import { storeToRefs } from "pinia";
import useCreateInstance from "@/hooks/instances/create.js";
import {
  useCurrency,
  useNotification,
  usePeriod,
  useSlider,
} from "@/hooks/utils";
import { checkPayg } from "@/functions.js";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";

import { useSpStore } from "@/stores/sp.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";

import selectsToCreate from "@/components/ui/selectsToCreate.vue";
import promoBlock from "@/components/ui/promo.vue";
import promocodeMenu from "@/components/ui/promocode-menu.vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { usePlansStore } from "@/stores/plans";
import { usePromocodesStore } from "@/stores/promocodes";

const instancesStore = useInstancesStore();
const namespacesStore = useNamespasesStore();
const plansStore = usePlansStore();
const promocodesStore = usePromocodesStore();
const spStore = useSpStore();
const { isLogged, userdata, billingUser } = storeToRefs(useAuthStore());
const authStore = useAuthStore();

const { onLogin } = storeToRefs(useAppStore());

const checkBalance = inject("checkBalance", () => {});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notification = useNotification();

const { getPeriod } = usePeriod();
const { createInstance } = useCreateInstance();
const { currency: userCurrency, formatPrice } = useCurrency();

const plan = ref(null);
const planWithApplyedPromocode = ref(null);
const promocode = ref(null);
const service = ref(null);
const namespace = ref(null);
const provider = ref(null);
const fetchLoading = ref(false);
const isPlansLoading = ref(false);
const cachedPlans = ref({});
const products = ref([]);
const sizes = ref([]);
const periods = ref([]);

const options = reactive({ size: "", model: "", period: "" });
const config = reactive({ domain: "", email: "" });
const modal = reactive({ confirmCreate: false, confirmLoading: false });

const slider = ref();
const { isSlider } = useSlider(slider, plan);

onMounted(() => {
  config.email = billingUser.value.email;
  const { action } = onLogin.value;

  if (typeof action !== "function") return;
  modal.confirmCreate = true;
  modal.confirmLoading = true;
  action();
});

function onCreated() {
  const promises = [
    authStore.fetchBillingData(),
    spStore.fetch(!isLogged.value),
    spStore.fetchShowcases(!isLogged.value),
  ];

  if (isLogged.value) {
    promises.push(namespacesStore.fetch(), instancesStore.fetch());
  }

  fetchLoading.value = true;
  Promise.all(promises)
    .catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err;
      if (err.response?.data?.code === 16) return;
      notification.openNotification("error", { message: t(message) });

      console.error(err);
    })
    .finally(() => {
      fetchLoading.value = false;
    });
}

onCreated();

const isSaleApply = computed(() => planWithApplyedPromocode.value);

const currentProduct = computed(() => {
  if (Object.keys(products.value || {}).length === 0) return "NAN";
  if (!(options.size && options.period)) return "NAN";
  const product = JSON.parse(
    JSON.stringify(
      products.value.find(
        ({ title, period }) =>
          title === options.size && +period === options.period
      )
    )
  );

  delete product.resources.model;
  if (`${product.resources.ssd}`.includes("Gb")) return product;
  product.resources.ssd = `${product.resources.ssd / 1024} Gb`;

  return product;
});

const currentProductWithSale = computed(() => {
  if (!isSaleApply.value) {
    return {};
  }

  const products = Object.values(planWithApplyedPromocode.value.products);

  if (Object.keys(products || {}).length === 0) return "NAN";
  if (!(options.size && options.period)) return "NAN";
  const product = JSON.parse(
    JSON.stringify(
      products.find(
        ({ title, period }) =>
          title === options.size && +period === options.period
      )
    )
  );

  delete product.resources.model;
  if (`${product.resources.ssd}`.includes("Gb")) return product;
  product.resources.ssd = `${product.resources.ssd / 1024} Gb`;

  return product;
});

const services = computed(() => {
  return instancesStore.services.filter((el) => el.status !== "DEL");
});

const plans = computed(() => {
  return (
    cachedPlans.value?.[`${provider.value}_${userCurrency.value.code}`]?.filter(
      ({ type, uuid }) => {
        const { items } =
          spStore.showcases.find(({ uuid }) => uuid === route.query.service) ??
          {};
        const plans = [];

        if (!items) return type === "cpanel";
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === provider.value) {
            plans.push(plan);
          }
        });

        if (plans.length < 1) return type === "cpanel";
        return type === "cpanel" && plans.includes(uuid);
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

const rules = computed(() => {
  const req = {
    required: true,
    message: t("ssl_product.field is required"),
  };

  return {
    domain: [
      req,
      {
        message: t("domain is wrong"),
        pattern: /.+\..+/,
      },
    ],
    email: [
      req,
      {
        message: t("email is not valid"),
        pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/,
      },
    ],
  };
});

const changeProducts = () => {
  const productsAndSizes = plans.value.reduce(
    (result, plan) => {
      for (const [key, product] of Object.entries(plan.products)) {
        const i = result.sizes.findIndex(
          ({ title }) => title === product.title
        );

        result.products.push({ key, ...product, planId: plan.uuid });
        if (i === -1) {
          result.sizes.push({
            title: product.title,
            sorter: product.sorter,
            price: product.price,
          });
        }
      }

      return result;
    },
    { products: [], sizes: [] }
  );
  productsAndSizes.sizes
    .sort((a, b) => a.price - b.price)
    .sort((a, b) => a.sorter - b.sorter);

  products.value = productsAndSizes.products;
  sizes.value = productsAndSizes.sizes.map(({ title }) => title);

  const data = JSON.parse(route.query.data ?? "{}");

  if (data.productSize) options.size = data.productSize;
  else options.size = sizes.value[0];
};
const changePeriods = (title) => {
  periods.value = [];
  products.value.forEach((product) => {
    if (product.title !== title) return;
    if (periods.value.includes(+product.period)) return;
    periods.value.push(+product.period);
  });

  periods.value.sort((a, b) => a - b);
  const data = JSON.parse(route.query.data ?? "{}");

  if (data.period && periods.value.includes(+data.period)) {
    options.period = +data.period;
  } else {
    options.period = periods.value[0];
  }
};
const orderClickHandler = () => {
  const fullService = services.value.find(({ uuid }) => uuid === service.value);
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);
  const { key } = products.value.find(
    ({ title, period }) => title === options.size && +period === options.period
  );

  const instance = {
    config: { ...config, auto_start: fullPlan.meta.auto_start },
    resources: {
      ...currentProduct.value.resources,
      ssd: `${parseFloat(currentProduct.value.resources.ssd) * 1024}`,
      model: options.model,
      plan: options.model,
    },
    title: currentProduct.value.title,
    billing_plan: { uuid: plan.value },
    product: key,
  };
  const newGroup = {
    title: userdata.value.title + Date.now(),
    type: "cpanel",
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
    onLogin.value.info = {
      type: "virtual",
      title: "Virtual Hosting",
      cost: currentProductWithSale.value.price || currentProduct.value.price,
      currency: userCurrency.value.code,
    };
    onLogin.value.action = () => {
      createVirtual(info, instance);
    };

    router.push({ name: "login" });
    return;
  }

  createVirtual(info, instance);
};
const createVirtual = async (info, instance) => {
  modal.confirmLoading = true;
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
  if (!config.domain.match(/.+\..+/)) {
    notification.openNotification("error", { message: t("domain is wrong") });
    return;
  }

  const instance = {
    config: {},
    billingPlan: plans.value.find(({ uuid }) => uuid === plan.value),
  };
  const isPayg = checkPayg(instance);
  const { price } = currentProduct.value;

  if (isPayg && !checkBalance(price)) return;
  modal.confirmCreate = true;
};

const fetchPlans = async (sp) => {
  const cacheKey = `${sp}_${userCurrency.value.code}`;

  if (cachedPlans.value[cacheKey]) {
    changeProducts();
    return;
  }

  isPlansLoading.value = true;

  try {
    const { pool } = await plansStore.fetch({
      anonymously: !isLogged.value,
      sp_uuid: sp,
    });

    cachedPlans.value[cacheKey] = pool;
    plan.value = plans.value[0]?.uuid;
    changeProducts();
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.openNotification("error", { message });
  } finally {
    isPlansLoading.value = false;
  }
};

watch(billingUser, (value) => {
  if (config) {
    config.email = value.email;
  }
});
watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid;
});

watch([provider, userCurrency], () => {
  fetchPlans(provider.value);
});

watch(currentProduct, () => {
  const product = products.value.find(
    ({ title, period }) => title === options.size && +period === options.period
  );

  options.model = product?.resources.model ?? "";
});

watch(
  () => options.size,
  (value) => {
    changePeriods(value);
    fetchLoading.value = false;
  }
);

watch(
  () => options.period,
  (value) => {
    const product = products.value.find(
      ({ title, period }) => title === options.size && +period === value
    );

    plan.value = cachedPlans.value[
      `${provider.value}_${userCurrency.value.code}`
    ]?.find(({ uuid }) => uuid === product.planId)?.uuid;
  }
);

watch([promocode, userCurrency], async () => {
  if (!promocode.value || !userCurrency.value || !plan.value) {
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
  name: "VirtualComponent",
};
</script>

<style>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  left: 50%;
  display: grid;
  grid-template-columns: calc(72% - 20px) 28%;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.order .ant-slider-mark-text {
  white-space: nowrap;
}

.order .ant-slider-mark-text:first-of-type {
  transform: translateX(-10px) !important;
}

.order .ant-slider-mark-text:last-of-type {
  transform: translateX(calc(-100% + 10px)) !important;
}

.product__specs {
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  margin: 0 auto;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td {
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1) {
  font-weight: 500;
  color: var(--gray);
}

.product__specs td:nth-child(2) {
  text-align: right;
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

.order__field-header {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.order__template {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.order__template.one-line {
  flex-wrap: nowrap;
  justify-content: space-between;
}

.order__template-item {
  width: 116px;
  margin-bottom: 10px;
  background-color: var(--bright_font);
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  text-align: center;
  overflow: hidden;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: max-content auto;
}

.order__template-item:not(:last-child) {
  margin-right: 10px;
}

.order__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}

.order__template-item.active {
  box-shadow: 5px 8px 12px rgba(0, 0, 0, 0.08), 0px 0px 13px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
}

.order__template-image {
  padding: 10px;
}

.order__template-image__rate {
  font-size: 2rem;
}

.order__template-name {
  padding: 10px;
}

.order__template-item.active .order__template-name {
  background-color: var(--main);
  color: var(--bright_font);
}

.max-width {
  width: 100%;
}

.ant-collapse-item:last-of-type .ant-collapse-content {
  border-radius: 0 0 28px 28px;
}

.slider_btn {
  cursor: pointer;
}

.removeMarginSkeleton .ant-skeleton-title {
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
  overflow-x: auto;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  font-size: 1.1rem;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--border_color);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--gloomy_font);
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
  .order {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .order__field {
    box-shadow: none;
    border-radius: 20px 20px 0 0;
  }
  .order__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }
  .order__promo {
    margin-top: 20px;
  }
}

@media screen and (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
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

.price__sale {
  justify-content: center;
  display: flex;
  flex-wrap: wrap;
}

.price__sale .without_sale {
  text-decoration: line-through;
  margin-right: 10px;
}
</style>
