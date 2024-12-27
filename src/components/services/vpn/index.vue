<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field order__main">
        <div class="order_description">
          <span>Select server or Buy VDS</span>
        </div>
        <div class="config">
          <a-select
            v-model:value="selectedInstance"
            :options="instances"
            style="width: 350px"
            allow-clear
            placeholder="Server"
          />

          <div>
            <a-button type="primary">Buy VDS</a-button>
          </div>

          <a-input
            class="config__field"
            :disabled="!selectedInstance"
            v-model:value="options.config.username"
            placeholder="Username"
          />
          <a-input-password
            class="config__field"
            :disabled="!selectedInstance"
            v-model:value="options.config.password"
            placeholder="Password"
            type="password"
          />
          <a-input
            class="config__field"
            :disabled="!selectedInstance"
            v-model:value="options.config.host"
            placeholder="Host"
          />
          <a-input
            class="config__field"
            :disabled="!selectedInstance"
            v-model:value="options.config.port"
            placeholder="Port"
          />
        </div>
      </div>

      <div class="order__calculate order__field">
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
              <template v-if="options.product.price">
                {{ formatPrice(options.product.price) }}
                {{ currency.title }}
              </template>
              <template v-else>
                {{ t("Free") }}
              </template>
            </template>
            <div v-else class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

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
                {{ `${options.product.title} (${selectedInstance})` }}
              </p>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-block class="order__promo" />

      <a-modal
        :title="$t(errModal.title)"
        :open="errModal.open"
        @ok="errModal.open = false"
        @cancel="errModal.open = false"
      >
        <p>
          {{ $t(errModal.message) }}
        </p>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { inject, watch } from "vue";

import { useCurrency, useNotification } from "@/hooks/utils";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";

import { useSpStore } from "@/stores/sp.js";
import { usePlansStore } from "@/stores/plans.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";

import selectsToCreate from "@/components/ui/selectsToCreate.vue";
import promoBlock from "@/components/ui/promo.vue";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import api from "@/api";
import useCreateInstance from "@/hooks/instances/create";

const namespacesStore = useNamespasesStore();
const spStore = useSpStore();
const plansStore = usePlansStore();
const instancesStore = useInstancesStore();
const authStore = useAuthStore();
const { onLogin } = storeToRefs(useAppStore());
const { isLogged, userdata } = storeToRefs(useAuthStore());

const checkBalance = inject("checkBalance", () => {});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const notification = useNotification();

const { currency, formatPrice } = useCurrency();
const { createInstance } = useCreateInstance();

const plan = ref(null);
const cachedPlans = ref({});
const service = ref(null);
const namespace = ref(null);
const provider = ref(null);
const selectedInstance = ref(null);
const fetchLoading = ref(false);
const options = ref({
  config: { username: "", password: "", host: "", port: "", instance: "" },
  product: "",
});
const modal = ref({ confirmCreate: false, confirmLoading: false });
const errModal = ref({ open: false, title: "", message: "" });

async function onCreated() {
  fetchLoading.value = true;
  const promises = [
    authStore.fetchBillingData(),
    spStore.fetch(!isLogged.value),
  ];

  if (isLogged.value) {
    promises.push(namespacesStore.fetch(), instancesStore.fetch());
  }

  if (spStore.showcases.length < 1) {
    promises.push(spStore.fetchShowcases(!isLogged.value));
  }

  try {
    await Promise.all(promises);

    if (!route.query.service) {
      router.replace({
        ...route,
        query: {
          ...route.query,
          service: spStore.showcases.find((showcase) =>
            showcase.title.toLowerCase().startsWith("vpn")
          )?.uuid,
        },
      });
    }
  } catch (err) {
    const message = err.response?.data?.message ?? err.message ?? err;
    if (err.response?.data?.code === 16) return;
    notification.openNotification("error", { message: t(message) });
    console.error(err);
  }
}

onCreated();

const sp = computed(() => {
  const { items } =
    spStore.showcases.find(({ uuid }) => uuid === route.query.service) ?? {};

  if (!items) return [];
  return spStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  );
});

const instances = computed(() =>
  instancesStore.instances
    .filter((instance) => ["ione"].includes(instance.type))
    .map((instance) => ({
      value: instance.title,
    }))
);

const plans = computed(() => {
  return (
    cachedPlans.value[`${provider.value}_${currency.value.code}`]?.filter(
      ({ type, uuid }) => {
        const { items } =
          spStore.showcases.find(({ uuid }) => uuid === route.query.service) ??
          {};
        const plans = [];

        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === provider.value) {
            plans.push(plan);
          }
        });

        return type === "vpn" && plans.includes(uuid);
      }
    ) ?? []
  );
});

const services = computed(() => {
  return instancesStore.services.filter((el) => el.status !== "DEL");
});

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
    console.log(plans.value);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.openNotification("error", { message });
  } finally {
    fetchLoading.value = false;
  }
};

const orderClickHandler = () => {
  const fullService = services.value.find(({ uuid }) => uuid === service.value);
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);

  const instance = {
    config: { ...options.value.config, auto_start: fullPlan.meta.auto_start },
    title: `${options.value.product.title} (${selectedInstance.value})`,
    billing_plan: { uuid: plan.value },
    product: options.value.product.key,
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
    onLogin.value.info = {
      type: "vpn",
      title: "Vpn",
      cost: options.value.product.price,
      currency: currency.value.code,
      goToInvoice: modal.value.goToInvoice,
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
  modal.value.confirmLoading = true;

  try {
    const response = await api.servicesProviders.action({
      uuid: provider.value,
      action: "vpn",
      params: {
        ...options.value.config,
        action: "sniff",
      },
    });

    if (response?.meta?.errors) {
      throw new Error(response.meta.errors[0].code);
    }

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

    await createInstance(
      action,
      orderData,
      instance,
      provider.value,
      null,
      null,
      t("Done")
    );
    router.push({ path: "/billing" });
  } catch (err) {
    errModal.value.open = true;
    switch (err.message) {
      case "UNREACHABLE": {
        errModal.value.title = "UNREACHABLE";
        errModal.value.message =
          "Please check your sdcnjscndjsccsdvd,bdl v,wedlfm gdkemdqkf dmfkqwmf jd";
        break;
      }
      default: {
        errModal.value.title = "Unknown error";
        errModal.value.message = "Please try again later";
        break;
      }
    }
    errModal.value.open = true;
  } finally {
    modal.value.confirmLoading = false;
    modal.value.confirmCreate = false;
  }
};

const orderConfirm = () => {
  const { price } = options.value.product;

  if (!checkBalance(price)) return;
  modal.value.confirmCreate = true;
};

watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid;
});

watch([provider, currency], () => {
  fetchPlans(provider.value);
});

watch(plan, () => {
  if (plan.value) {
    const fullPlan = plans.value.find((p) => p.uuid === plan.value);
    options.value.product = {
      ...fullPlan.products["setup_vpn"],
      key: "setup_vpn",
    };
  }
});

watch(selectedInstance, (value) => {
  if (value) {
    const instance = instancesStore.instances.find(
      (instance) => instance.title === selectedInstance.value
    );

    options.value.config.instance = instance.uuid;
    options.value.config.password = instance.config.password || "";
    options.value.config.username = instance.config.username || "";

    const kind = instance.state?.interfaces?.find((int) => int.kind == "SSH");
    if (kind) {
      const { host, port } = kind.data;

      options.value.config.host = host || "";
      options.value.config.port = port || "";
    } else {
      options.value.config.host = "";
      options.value.config.port = "";
    }
  } else {
    options.value.config.instance = null;
    options.value.config.password = "";
    options.value.config.username = "";
    options.value.config.host = "";
    options.value.config.port = "";
  }
});

watch(instances, () => {
  if (!route.query.instance) {
    return;
  }

  const instance = instancesStore.instances.find(
    (instance) => instance.uuid == route.query.instance
  );

  if (instance) {
    selectedInstance.value = instance.title;
  }
});
</script>

<script>
export default {
  name: "VpnComponent",
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
  grid-template-columns: calc(80% - 30px) 20%;
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
}

.config {
  display: grid;
  grid-template-columns: 350px 350px;
  grid-template-rows: 1fr 1fr 1fr;
  grid-column-gap: 20px;
}

.config .config__field {
  margin: 5px 5px 5px 20px;
}
.config div {
  margin: 5px 5px 5px 20px;
}

.order_description {
  display: flex;
  justify-content: start;
  margin-left: 25px;
  align-items: center;
}

.order_description span {
  font-size: 1.3rem;
}
</style>
