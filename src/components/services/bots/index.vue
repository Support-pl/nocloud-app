<template>
  <div class="order_wrapper">
    <div v-if="!fetchLoading && !plansLoading" class="order">
      <div style="position: relative">
        <div v-if="isPromoVisible" class="order__promo">
          <div class="order__field">
            <promo-block no-wrapper />
            <div
              v-html="
                marked(
                  $t('bots.labels.pricing_bot_description', {
                    priceForToken: `${priceForToken} ${userCurrency.title}`,
                    monthly: `${getProducts.price} ${userCurrency.title}`,
                  })
                )
              "
            />
          </div>
        </div>

        <div class="activate_btn">
          <a-button type="primary" block shape="round" @click="orderConfirm">
            {{ capitalize($t("activate")) }}
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
              {{ $t("order_services.Do you want to activate") }}:
              {{ showcase.promo?.[locale]?.title ?? showcase.title }}
            </p>
          </a-modal>
        </div>
      </div>
    </div>

    <loading v-else />
  </div>
</template>

<script setup>
import { computed, ref, watch, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import api from "@/api.js";
import Loading from "@/components/ui/loading.vue";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";

import { useSpStore } from "@/stores/sp.js";
import { usePlansStore } from "@/stores/plans.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";

import promoBlock from "@/components/ui/promo.vue";
import { useCurrenciesStore } from "@/stores/currencies";
import { storeToRefs } from "pinia";
import { useChatsStore } from "@/stores/chats";
import { marked } from "marked";

const router = useRouter();
const route = useRoute();
const { locale, t } = useI18n();
const { openNotification } = useNotification();

const appStore = useAppStore();
const authStore = useAuthStore();

const spStore = useSpStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);
const plansStore = usePlansStore();
const namespacesStore = useNamespasesStore();
const { namespaces } = storeToRefs(namespacesStore);
const instancesStore = useInstancesStore();
const currenciesStore = useCurrenciesStore();
const { userCurrency, defaultCurrency } = storeToRefs(currenciesStore);
const { getShowcases } = storeToRefs(spStore);

const plan = ref(null);
const service = ref(null);
const namespace = ref(null);
const provider = ref(null);

const cachedPlans = reactive({});
const fetchLoading = ref(false);
const plansLoading = ref(false);
const priceForToken = ref();

const modal = ref({ confirmCreate: false, confirmLoading: false });

const getProducts = computed(() => {
  const { title, products } =
    plans.value.find(({ uuid }) => uuid === plan.value) ?? {};

  return {
    price: products["bot"].price,
    title,
  };
});

const showcase = computed(() =>
  getShowcases.value.find(({ uuid }) => uuid === route.query.service)
);

const isPromoVisible = computed(() => {
  return (
    showcase.value?.promo && showcase.value.promo[locale.value]?.previewEnable
  );
});

const services = computed(() =>
  instancesStore.services.filter((el) => el.status !== "DEL")
);

const mainModel = computed(() =>
  globalModelsList.value.find(({ key }) => key == "gpt-4o-mini")
);

const plans = computed(
  () =>
    cachedPlans[`${provider.value}_${userCurrency.value?.code}`]?.filter(
      ({ type, uuid }) => {
        const { items } =
          spStore.showcases.find(({ uuid }) => uuid === route.query.service) ??
          {};
        const plans = [];

        if (!items) return type === "bots";
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === provider.value) {
            plans.push(plan);
          }
        });

        if (plans.length < 1) return type === "bots";
        return type === "bots" && plans.includes(uuid);
      }
    ) ?? []
);

const sp = computed(() => {
  const { items } =
    spStore.showcases.find(({ uuid }) => uuid === route.query.service) ?? {};

  if (!items) return [];
  return spStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  );
});

watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid;
});

async function fetchPlans(sp) {
  const cacheKey = `${sp}_${userCurrency?.value.code}`;

  plansLoading.value = true;
  if (cachedPlans[cacheKey]) return;
  try {
    const { pool } = await plansStore.fetch({
      anonymously: !authStore.isLogged,
      sp_uuid: sp,
    });

    cachedPlans[cacheKey] = pool;
    plan.value = plans.value[0]?.uuid;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message });
  } finally {
    plansLoading.value = false;
  }
}

watch(provider, (uuid) => fetchPlans(uuid));

watch(userCurrency, () => fetchPlans(provider.value));

watch(namespaces, (value) => {
  namespace.value = value[0]?.uuid;
});

function orderClickHandler() {
  const serviceItem = services.value.find(({ uuid }) => uuid === service.value);
  const planItem = plans.value.find(({ uuid }) => uuid === plan.value);
  let title =
    showcase.value.promo?.[locale.value]?.title ?? showcase.value.title;

  const same = instancesStore.getInstances.filter((instance) =>
    instance.title.startsWith(title)
  );
  same.sort((a, b) => b.title.localeCompare(a.title));

  title =
    same.length > 0
      ? `${title} ${
          (Number.parseInt(same[0].title.split(" ").reverse()[0]) || 1) + 1
        }`
      : title;

  const instances = [
    {
      config: {
        user: authStore.userdata.uuid,
        auto_start: planItem.meta.auto_start,
      },
      title,
      billing_plan: planItem,
      product: "bot",
    },
  ];
  const newGroup = {
    title: authStore.userdata.title + Date.now(),
    type: "bots",
    sp: provider.value,
    instances,
  };

  const info = !service.value
    ? newGroup
    : JSON.parse(JSON.stringify(serviceItem));
  const group = info.instancesGroups?.find(({ sp }) => sp === provider.value);

  if (group) group.instances = [...group.instances, ...instances];
  else if (service.value) info.instancesGroups.push(newGroup);

  if (!authStore.userdata.uuid) {
    const showcase =
      spStore.showcases.find(({ uuid }) => uuid === route.query.service) ?? {};

    appStore.onLogin.redirect = route.name;
    appStore.onLogin.redirectQuery = route.query;
    appStore.onLogin.info = {
      type: "bots",
      title:
        showcase.promo?.[locale.value]?.title || showcase.title || "AIBots",
      cost: getProducts.value.price,
      currency: userCurrency.value.code,
    };
    appStore.onLogin.action = () => {
      orderClickHandler();
    };

    router.push({ name: "login" });
    return;
  }

  createBot(info);
}

async function createBot(info) {
  modal.value.confirmLoading = true;
  const action = service.value ? "update" : "create";
  const orderData = service.value
    ? info
    : {
        namespace: namespace.value,
        service: {
          title: authStore.userdata.title,
          context: {},
          version: "1",
          instancesGroups: [info],
        },
      };

  try {
    const { uuid } = await instancesStore[`${action}Service`](orderData);

    deployService(uuid);
  } catch (error) {
    const matched = (
      error.response?.data?.message ??
      error.message ??
      ""
    ).split(/error:"|error: "/);
    const message = matched.at(-1).split('" ').at(0);

    if (message) {
      openNotification("error", { message });
    } else {
      const message = error.response?.data?.message ?? error.message ?? error;

      openNotification("error", { message });
    }
    console.error(error);
  }
}

function orderConfirm() {
  modal.value.confirmCreate = true;
}

async function deployService(uuid) {
  try {
    await api.services.up(uuid);

    openNotification("success", { message: t("Done") });
    router.push({ path: "/services" });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: t(message) });
  } finally {
    modal.value.confirmLoading = false;
  }
}

async function fetch() {
  try {
    fetchLoading.value = true;
    const promises = [
      authStore.fetchBillingData(),
      spStore.fetch(!authStore.isLogged),
      chatsStore.fetch_models_list(),
    ];

    if (authStore.isLogged) {
      promises.push(namespacesStore.fetch(), instancesStore.fetch());
    }

    await Promise.all(promises);

    fetchPriceForTokens();
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    if (error.response?.data?.code === 16) return;
    openNotification("error", { message: t(message) });

    console.error(error);
  } finally {
    fetchLoading.value = false;
  }
}

fetch();

async function fetchPriceForTokens() {
  if (
    mainModel.value &&
    mainModel.value?.billing.tokens?.text_input?.price.amount
  ) {
    const price = mainModel.value?.billing.tokens?.text_input?.price.amount;
    if (userCurrency.value === defaultCurrency.value) {
      return (priceForToken.value = price);
    }

    const { amounts } = await currenciesStore.convert({
      from: defaultCurrency.value.code,
      to: userCurrency.value.code,
      amounts: [price],
    });
    priceForToken.value = amounts[0] || price;
  }
}
</script>

<script>
export default { name: "AiBotsComponent" };
</script>

<style scoped>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.order__pricing {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
}

.order__pricing > :deep(.ant-row:not(:first-child)) {
  margin-top: 10px;
}

.order__price {
  font-size: 1.1rem;
  text-align: right;
  white-space: nowrap;
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

.order__option div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name img {
  max-height: 65px;
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

@keyframes glowing {
  from {
    background-color: #f2f2f2;
  }

  to {
    background-color: #e9e9e9;
    /* background-color: red; */
  }
}

.activate_btn {
  position: absolute;
  bottom: 10px;
  right: 15px;
  width: 200px;
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
  .product__specs {
    width: 100%;
  }

  .product__specs td {
    padding: 3px 7px;
  }

  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
  }

  .activate_btn {
    position: absolute;
    bottom: -15px;
    right: 15px;
    width: 200px;
  }
}
</style>

<style>
@media screen and (max-width: 576px) {
  .order__promo img {
    max-width: 90vw !important;
  }
}
</style>
