<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__inputs order__field">
        <div class="order__option">
          <transition name="specs" mode="out-in">
            <a-row :gutter="[10, 10]" style="margin-bottom: 10px">
              <a-col
                v-for="(resource, key) in getProducts.resources"
                :key="key"
                span="24"
                class="order__resource"
              >
                {{ resource.title ?? capitalize(key) }}:
                <a-slider
                  v-if="resource.slider"
                  v-model:value="resources[key]"
                  style="margin: 10px"
                  :tip-formatter="null"
                  :step="resource.step"
                  :max="resource.max"
                  :min="0"
                />

                <a-input-number
                  v-else
                  v-model:value="resources[key]"
                  allow-clear
                  style="margin: 0 0 0 auto"
                  :min="0"
                  :max="resource.max"
                />
                <template v-if="resource.slider">
                  {{ resources[key] }}
                </template>
                {{ resource.postfix }}
              </a-col>
            </a-row>
          </transition>
        </div>
      </div>

      <div class="order__calculate order__field">
        <template v-for="(resource, key) in resources" :key="key">
          <a-row
            v-if="resource > 0"
            type="flex"
            justify="space-around"
            align="middle"
          >
            <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
              {{ getProducts.resources[key].title }}:
            </a-col>
            <a-col :xs="12" :sm="18" :lg="12">
              <div
                v-if="!fetchLoading"
                style="font-size: 1.1rem; text-align: right"
              >
                {{ resource }} {{ getProducts.resources[key].postfix }}
              </div>
              <div v-else class="loadingLine" />
            </a-col>
          </a-row>
        </template>

        <a-divider style="margin: 5px 0 15px" />

        <a-row :gutter="[10, 10]" style="margin-bottom: 10px">
          <a-col v-if="providers.length > 1" span="24">
            <a-select
              v-model:value="sp"
              style="width: 100%"
              placeholder="providers"
            >
              <a-select-option v-for="item of providers" :key="item.uuid">
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>

          <a-col v-if="namespacesStore.namespaces.length > 1" span="24">
            <a-select
              v-model:value="namespace"
              style="width: 100%"
              placeholder="namespaces"
            >
              <a-select-option
                v-for="item of namespacesStore.namespaces"
                :key="item.uuid"
              >
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>

          <a-col v-if="plans.length > 1" span="24">
            <a-select
              v-model:value="plan"
              style="width: 100%"
              placeholder="plans"
            >
              <a-select-option v-for="item of plans" :key="item.uuid">
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>
        </a-row>

        <a-divider orientation="left" style="margin: 10px 0 0">
          {{ $t("Total") }}:
        </a-divider>

        <a-row type="flex" justify="space-around">
          <a-col style="font-size: 1.5rem">
            <transition name="textchange" mode="out-in">
              <template v-if="!fetchLoading">
                {{ getProducts.price }} {{ currency.title }}
              </template>
              <div v-else class="loadingLine loadingLine--total" />
            </transition>
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
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
                {{ getProducts.title }}
              </p>
            </a-modal>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/api.js";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useCurrency, useNotification } from "@/hooks/utils";

import { useSpStore } from "@/stores/sp.js";
import { usePlansStore } from "@/stores/plans.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";

const router = useRouter();
const route = useRoute();
const i18n = useI18n();

const appStore = useAppStore();
const authStore = useAuthStore();
const { currency } = useCurrency();
const { openNotification } = useNotification();

const spStore = useSpStore();
const plansStore = usePlansStore();
const namespacesStore = useNamespasesStore();
const instancesStore = useInstancesStore();

const plan = ref(null);
const sp = ref(null);
const namespace = ref(null);
const fetchLoading = ref(false);

const modal = ref({ confirmCreate: false, confirmLoading: false });
const resources = ref({});

const getProducts = computed(() => {
  return {
    title: "VDC",
    resources: {
      cpu: { max: 12, postfix: "cores", title: "CPU" },
      ram: { max: 32, postfix: "Gb", title: "RAM" },
      ips_public: { max: 10, postfix: "", title: "Public IP's" },
      ips_private: { max: 10, postfix: "", title: "Private IP's" },
      drive_ssd: {
        max: 300,
        postfix: "Gb",
        title: "SSD",
        slider: true,
        step: 10,
      },
      drive_hdd: {
        max: 1000,
        postfix: "Gb",
        title: "HDD",
        slider: true,
        step: 10,
      },
    },
    price: "-",
    description: "",
  };
});

watch(getProducts, (value) => {
  Object.keys(value.resources).forEach((key) => {
    resources.value[key] = 0;
  });
});

const providers = computed(() =>
  spStore.servicesProviders.filter((sp) => sp.type === "ione")
);

const plans = computed(() =>
  plansStore.plans.filter(({ type, uuid }) => {
    const { plans } =
      spStore.getShowcases.find(({ uuid }) => uuid === route.query.service) ??
      {};

    if (!plans) return type === "vdc";

    if (plans.length < 1) return type === "vdc";
    return type === "vdc" && plans.includes(uuid);
  })
);

watch(
  () => namespacesStore.namespaces,
  (value) => {
    namespace.value = value[0]?.uuid;
  }
);

watch(providers, (value) => {
  sp.value = value[0]?.uuid;
});

watch(plans, (value) => {
  plan.value = value[0]?.uuid;
});

function orderClickHandler() {
  const result = {};

  Object.entries(resources.value).forEach(([key, value]) => {
    if (getProducts.value.resources[key].postfix === "Gb") {
      result[key] = value * 1024;
    } else {
      result[key] = value;
    }
  });

  const newGroup = {
    title: authStore.userdata.title + Date.now(),
    type: "ione",
    sp: sp.value,
    instances: [],
    config: { is_vdc: true },
    resources: result,
  };

  if (!authStore.userdata.uuid) {
    appStore.onLogin.redirect = route.name;
    appStore.onLogin.info = {
      type: "vdc",
      title: "VDC",
      cost: getProducts.value.price,
      currency: currency.value.code,
    };

    router.push({ name: "login" });
    return;
  }

  createVDC(newGroup);
}

async function createVDC(info) {
  modal.value.confirmLoading = true;
  const orderData = {
    namespace: namespace.value,
    service: {
      title: `VDC-${Date.now()}`,
      context: {},
      version: "1",
      instancesGroups: [info],
    },
  };

  try {
    const { uuid } = await instancesStore.createService(orderData);

    await deployService(uuid);
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

    openNotification("success", { message: i18n.t("Done") });
    router.push({ path: "/services" });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: i18n.t(message) });
  } finally {
    modal.value.confirmLoading = false;
  }
}

async function fetch() {
  try {
    fetchLoading.value = true;
    const promises = [
      authStore.fetchBillingData(),
      plansStore.fetch({ anonymously: !authStore.isLogged }),
      spStore.fetch(!authStore.isLogged),
    ];

    if (authStore.isLogged) {
      promises.push(namespacesStore.fetch(), instancesStore.fetch());
    }

    await Promise.all(promises);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    if (error.response?.data?.code === 16) return;

    openNotification("error", { message: i18n.t(message) });
    console.error(error);
  } finally {
    fetchLoading.value = false;
  }
}

fetch();
</script>

<script>
export default { name: "CreateVdc" };
</script>

<style scoped>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1024px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.order__inputs {
  margin-right: 20px;
  width: 72%;
}

.order__resource {
  display: grid;
  grid-template-columns: auto 1fr minmax(30px, max-content);
  align-items: center;
  gap: 5px;
}

.order__field {
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate {
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
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
    flex-direction: column;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }

  .order__inputs {
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
  }

  .order__field {
    box-shadow: none;
    flex-grow: 0;
  }

  .order__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
  }
}
</style>
