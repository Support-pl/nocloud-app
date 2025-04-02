<template>
  <div class="order_wrapper">
    <div v-if="route.query.instance" class="order">
      <div class="order__field order__main">
        <div class="config">
          <a-form
            ref="formRef"
            class="form"
            :model="options.config"
            name="basic"
            autocomplete="off"
            :disabled="!selectedInstance"
          >
            <a-form-item
              class="config__field"
              name="username"
              :label="t('vpn.fields.username')"
              :rules="[requiredRule]"
            >
              <a-input
                v-model:value="options.config.username"
                :placeholder="t('vpn.fields.username')"
              />
            </a-form-item>

            <a-form-item
              name="password"
              :rules="[requiredRule]"
              class="config__field"
              :label="t('vpn.fields.password')"
            >
              <a-input-password
                v-model:value="options.config.password"
                :placeholder="t('vpn.fields.password')"
              />
            </a-form-item>

            <a-form-item
              name="host"
              :rules="[requiredRule]"
              class="config__field"
              :label="t('vpn.fields.host')"
            >
              <a-input
                v-model:value="options.config.host"
                :placeholder="t('vpn.fields.host')"
              />
            </a-form-item>

            <a-form-item
              :label="t('vpn.fields.port')"
              name="port"
              :rules="[requiredRule]"
              class="config__field"
            >
              <a-input
                v-model:value="options.config.port"
                :placeholder="t('vpn.fields.port')"
                type="number"
              />
            </a-form-item>
          </a-form>
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
          {{ t("Total") }}:
        </a-divider>

        <a-row justify="space-around">
          <a-col style="font-size: 1.5rem">
            <template v-if="!fetchLoading">
              <template v-if="options.product.price">
                {{ formatPrice(options.product.price) }}
                {{ currency.title }}
              </template>
              <template v-else>
                {{ t("vpn.labels.free") }}
              </template>
            </template>
            <div v-else class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

        <a-row justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button
              type="primary"
              block
              shape="round"
              :disabled="!selectedInstance || fetchLoading"
              @click="orderConfirm"
            >
              {{ capitalize(t("vpn.actions.install")) }}
            </a-button>
            <a-modal
              :title="t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="t('Cancel')"
              @ok="orderClickHandler"
              @cancel="modal.confirmCreate = false"
            >
              <p>
                {{ t("order_services.Do you want to order") }}:
                {{ `${options.product.title} (${selectedInstance})` }}
              </p>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-block class="order__promo" />

      <a-modal
        :title="t(errModal.title)"
        :open="errModal.open"
        @ok="errModal.open = false"
        @cancel="errModal.open = false"
      >
        <p>
          {{ t(errModal.message) }}
        </p>
      </a-modal>
    </div>

    <div v-else class="order">
      <promo-block class="order__promo" />

      <div class="next">
        <a-button type="primary" block shape="round" @click="goToBuyVds">
          {{ capitalize(t("next")) }}
        </a-button>
      </div>
    </div>
  </div>
  <!-- <div class="anonim_user_message" v-else>
    <span style="max-width: 400px; text-align: center">
      {{ t("vpn.labels.unlogin_message") }}
    </span>
    <a-button @click="goToLogin" style="margin-top: 10px" type="primary">
      {{ capitalize(t("login")) }}
    </a-button>
  </div> -->
</template>

<script setup>
import { storeToRefs } from "pinia";
import { capitalize, inject, watch } from "vue";

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
const formRef = ref(null);
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

  try {
    await Promise.all(promises);

    if (!route.query.service) {
      router.replace({
        ...route,
        query: {
          ...route.query,
          service: spStore.showcases.find(
            (showcase) => showcase.meta?.type === "vpn"
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
    .filter(
      (instance) =>
        ["ione"].includes(instance.type) &&
        instance.state.state === "RUNNING" &&
        !instancesStore.instances.find(
          (i) => i.type === "empty" && i.config?.instance == instance.uuid
        )
    )
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

        if (!items) {
          return [];
        }

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

const vdsVpnShowcase = computed(() => {
  return spStore.showcases.find(
    (showcase) => showcase?.meta?.type === "ione-vpn"
  );
});

const isBuyVdsEnabled = computed(
  () => vdsVpnShowcase.value && vdsVpnShowcase.value.items?.[0].servicesProvider
);

const requiredRule = computed(() => ({
  required: true,
  message: t("ssl_product.field is required"),
  trigger: "blur",
}));

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
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;
    console.log(error);

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
        errModal.value.title = "vpn.errors.unreachable.title";
        errModal.value.message = "vpn.errors.unreachable.message";
        break;
      }
      default: {
        errModal.value.title = "vpn.errors.unknown.title";
        errModal.value.message = "vpn.errors.unknown.message";
        break;
      }
    }
    errModal.value.open = true;
  } finally {
    modal.value.confirmLoading = false;
    modal.value.confirmCreate = false;
  }
};

const orderConfirm = async () => {
  await formRef.value.validate();

  const { price } = options.value.product;

  if (!checkBalance(price)) return;
  modal.value.confirmCreate = true;
};

const goToBuyVds = () => {
  router.push({
    name: "newPaaS",
    query: { service: vdsVpnShowcase.value?.uuid },
  });
};

const goToLogin = () => {
  router.push({
    name: "login",
  });
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

watch(selectedInstance, async (value) => {
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

    await formRef.value.validate();
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

watch(vdsVpnShowcase, () => {
  if (route.query.redirect && !route.query.instance) {
    goToBuyVds();
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

@media (max-width: 576px) {
  .order {
    display: grid;
    grid-template-columns: 1fr;
  }
}

.order__field {
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.next {
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

.config {
  display: grid;
}

.config div {
  margin: 5px 5px 5px 20px;
}

.config .form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.config .additional_actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.config .additional_actions .server {
  max-width: 300px;
}

.config .additional_actions .description {
  font-size: 1.3rem;
}

.config .additional_actions .or {
  margin-left: 5px;
}

@media (max-width: 900px) {
  .config .form {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
  }

  .config .form input {
    max-width: 80vw;
  }
}

.anonim_user_message {
  font-size: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>

<style>
.ant-col.ant-form-item-label {
  min-width: 150px;
  display: flex;
}
</style>
