<template>
  <div class="order_wrapper">
    <div class="order-cart">
      <div class="order__inputs order__field-cart">
        <div class="order_option">
          <a-row class="order_option__steps" justify="center">
            <a-col :span="16">
              <!--TODO: add finish status if cart (watch to cart)-->
              <a-steps>
                <a-step
                  class="search"
                  status="start"
                  :title="$t('search')"
                  @click="search"
                >
                  <template #icon>
                    <!---->
                    <search-icon />
                  </template>
                </a-step>
                <a-step class="cart" status="finish" :title="$t('cart')">
                  <!--@click="cart"-->
                  <template #icon>
                    <shopping-cart-icon />
                  </template>
                </a-step>
              </a-steps>
            </a-col>
            <a-col :span="2" class="badge-wrapper">
              <a-badge
                :count="itemsInCart"
                :offset="[0, -5]"
                show-zero
                :number-style="{
                  backgroundColor: 'var(--bright_font)',
                  color: '#999',
                  boxShadow: '0 0 0 1px #d9d9d9 inset',
                }"
              />
            </a-col>
          </a-row>

          <a-row :gutter="[10, 10]" align="bottom">
            <a-col span="24">
              <a-row :gutter="[10, 10]">
                <a-col span="24">
                  {{ capitalize($t("advanced options")) }}:
                </a-col>
                <a-col span="12">
                  <a-switch
                    v-model:checked="resources.who_is_privacy"
                    size="small"
                  />
                  {{ capitalize($t("domain_product.who_is_privacy")) }} ({{
                    [
                      formatPrice(
                        (whoIsPrivacyAddon?.periods[
                          resources.period * 86400 * 365
                        ] || 0) * onCart.length
                      ),
                      currency.title,
                    ].join(" ")
                  }})
                </a-col>
                <a-col span="12">
                  <a-switch
                    v-model:checked="resources.lock_domain"
                    size="small"
                  />
                  {{ capitalize($t("domain_product.lock_domain")) }}
                </a-col>
              </a-row>
            </a-col>
          </a-row>

          <a-form
            validate-on-rule-change
            ref="form"
            layout="vertical"
            :model="form"
          >
            <a-row :gutter="[15, 10]" style="margin-top: 15px">
              <a-col span="24"> {{ capitalize($t("user data")) }}: </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="first_name"
                  :label="$t('clientinfo.firstname')"
                  :rules="[rules.req]"
                >
                  <a-input v-model:value="form.first_name" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="last_name"
                  :label="$t('clientinfo.lastname')"
                  :rules="[rules.req]"
                >
                  <a-input v-model:value="form.last_name" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="email"
                  :label="$t('clientinfo.email')"
                  :rules="[rules.req, rules.email]"
                >
                  <a-input v-model:value="form.email" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="phone"
                  :label="$t('clientinfo.phonenumber')"
                  :rules="[rules.req]"
                >
                  <a-input v-model:value="form.phone" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="country"
                  :label="$t('clientinfo.countryname')"
                  :rules="[rules.req]"
                >
                  <a-select
                    v-model:value="form.country"
                    show-search
                    style="width: 100%"
                    :options="countriesOptions"
                    :filter-option="searchCountries"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="state"
                  :label="$t('clientinfo.state')"
                  :rules="[rules.state]"
                >
                  <a-input v-model:value="form.state" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="city"
                  :label="$t('clientinfo.city')"
                  :rules="[rules.req]"
                >
                  <a-input v-model:value="form.city" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="postal_code"
                  :label="$t('clientinfo.postcode')"
                  :rules="[rules.postal_code]"
                >
                  <a-input v-model:value="form.postal_code" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="address1"
                  :label="$t('clientinfo.address1')"
                  :rules="[rules.req]"
                >
                  <a-input v-model:value="form.address1" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="address2" :label="$t('clientinfo.address2')">
                  <a-input v-model:value="form.address2" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item
                  name="org_name"
                  :label="$t('clientinfo.companyname')"
                  :rules="[rules.req]"
                >
                  <a-input v-model:value="form.org_name" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>

          <a-row class="order__prop" style="margin-bottom: 5px">
            <a-col span="8" :xs="6">
              {{ $t("domain_product.domain_in_your_cart") }} </a-col
            ><!--{{capitalize($t('provider'))}}-->
          </a-row>
          <div class="description">
            <div v-if="!onCart.length" class="description-header">
              <question-circle-icon />
              <p>{{ $t("domain_product.your_cart_is_empty") }}</p>
            </div>
            <a-descriptions
              v-for="(domain, index) in onCart"
              :key="index"
              bordered
              class="description-body"
              :column="6"
            >
              <a-descriptions-item :span="1">
                <span class="description-body__domain-name">
                  {{ domain.name }}
                </span>
              </a-descriptions-item>
              <a-descriptions-item :span="3">
                <span
                  class="description-body__domain-name"
                  v-if="!fetchLoading"
                >
                  {{
                    products[domain.name] &&
                    formatPrice(products[domain.name][resources.period])
                  }}
                  {{ currency.title }}
                </span>
                <div v-else class="loadingLine loadingLine--total" />
              </a-descriptions-item>
              <a-descriptions-item :span="2">
                <a-button
                  :key="index"
                  class="description-body__btn-order"
                  @click="removeProduct(domain, index)"
                >
                  {{ $t("Delete") }}
                </a-button>
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>
      </div>

      <div class="order__calculate order__field-cart">
        <a-row justify="space-around" style="margin-top: 20px">
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t("Pay period") }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12">
            <a-select v-model:value="resources.period" style="width: 100%">
              <!--v-if="!fetchLoading"-->
              <a-select-option v-for="period in periods" :key="period">
                {{ $tc("year", period) }}
              </a-select-option>
            </a-select>
            <!--<div v-else class="loadingLine"></div>-->
          </a-col>
        </a-row>

        <selects-to-create
          v-model:plan="plan"
          v-model:service="service"
          v-model:namespace="namespace"
          v-model:provider="provider"
          :plans-list="plans"
          :sp-list="sp"
        />

        <a-divider orientation="left" :style="{ marginBottom: 0 }">
          {{ $t("Total") }}:
        </a-divider>

        <a-row justify="space-around">
          <a-col v-if="!fetchLoading" style="font-size: 1.5rem">
            {{ formatPrice(fullPrice) }}
            {{ currency.title }}
          </a-col>
          <a-col v-else>
            <div class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

        <a-row
          justify="space-around"
          style="margin-top: 24px; margin-bottom: 10px"
        >
          <a-col :span="22">
            <a-button
              block
              type="primary"
              shape="round"
              :disabled="!onCart.length || !plan"
              @click="orderConfirm"
            >
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
                {{ getProducts["name"] }}
              </p>
            </a-modal>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  toRefs,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import {
  postcodeValidator,
  postcodeValidatorExistsForCountry,
} from "postcode-validator";

import useCreateInstance from "@/hooks/instances/create.js";
import { checkPayg } from "@/functions.js";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useInstancesStore } from "@/stores/instances.js";

import { useSpStore } from "@/stores/sp.js";

import { useCurrency, useNotification } from "@/hooks/utils";
import countries from "@/assets/countries.json";
import selectsToCreate from "@/components/ui/selectsToCreate.vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { notification } from "ant-design-vue";
import api from "@/api";
import { useNamespasesStore } from "@/stores/namespaces";
import { Kind } from "nocloud-proto/proto/es/billing/billing_pb";
import { useCurrenciesStore } from "@/stores/currencies";
import { GeneratePassword } from "js-generate-password";
import { useAddonsStore } from "@/stores/addons";

const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);
const shoppingCartIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ShoppingCartOutlined")
);
const questionCircleIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const props = defineProps({
  data: { type: Object, required: true },
  onCart: { type: Array, required: true },
  itemsInCart: { type: Number, required: true },
  search: { type: Function, required: true },
  plans: { type: Array, required: true },
  plan: { type: String, required: true },
  provider: { type: String, required: true },
  removeFromCart: { type: Function, required: true },
});
const {
  data,
  itemsInCart,
  onCart,
  search,
  removeFromCart,
  plan,
  plans,
  provider,
} = toRefs(props);

const emits = defineEmits(["change"]);

const checkBalance = inject("checkBalance", () => {});

const { currency, formatPrice } = useCurrency();
const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const { deployService } = useCreateInstance();
const { openNotification } = useNotification();

const ogPrices = ref([]);
const products = ref({});
const productsDefaultCurrency = ref({});
const service = ref(null);
const fetchLoading = ref(false);
const modal = ref({
  confirmCreate: false,
  confirmLoading: false,
});

const resources = ref({
  registrant_ip: "",
  reg_username: "",
  reg_password: "",
  period: 1,
  who_is_privacy: false,
  lock_domain: true,
});
const form = ref({});
const getProducts = ref({ name: "", pricing: {} });
const selectedProduct = ref();
const periods = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // 'annually biennially triennial quadrennial quinquennial'

const spStore = useSpStore();
const instancesStore = useInstancesStore();
const authStore = useAuthStore();
const appStore = useAppStore();
const namespacesStore = useNamespasesStore();
const addonsStore = useAddonsStore();
const currenciesStore = useCurrenciesStore();

const { billingUser, userdata, isLogged } = storeToRefs(authStore);
const { namespaces } = storeToRefs(namespacesStore);
const { addons } = storeToRefs(addonsStore);

const { onLogin } = storeToRefs(appStore);

onMounted(() => {
  const { action } = onLogin.value;

  if (typeof action === "function") {
    modal.value.confirmCreate = true;
    modal.value.confirmLoading = true;
    action();
  }

  if (!"form" in data.value) {
    installDataToBuffer();
  }

  if (namespaces.value.length === 0) {
    namespacesStore.fetch();
  }
});

function onCreated() {
  if (isLogged.value) {
    const promises = [];

    Promise.all(promises).catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err;

      if (err.response?.data?.code === 16) return;
      openNotification("error", {
        message: t(message),
      });
      console.error(err);
    });
  }
}

onCreated();

onBeforeUnmount(() => {
  emits(
    "change",
    JSON.parse(
      JSON.stringify({
        resources: resources.value,
        form: form.value,
      })
    )
  );
});

const sp = computed(() =>
  spStore.servicesProviders.filter((sp) => sp.type === "opensrs")
);

const namespace = computed(() => namespaces.value[0]?.uuid);

const services = computed(() => {
  return instancesStore.services.filter((el) => el.status !== "DEL");
});

const whoIsPrivacyAddon = computed(() => {
  return addons.value?.find((addon) => addon.meta?.type === "who_is_privacy");
});

const fullPrice = computed(
  () =>
    getProducts.value.pricing[resources.value.period] +
    (!resources.value.who_is_privacy
      ? 0
      : (whoIsPrivacyAddon.value?.periods[
          resources.value.period * 86400 * 365
        ] || 0) * onCart.value.length)
);

const rules = computed(() => {
  const message = t("ssl_product.field is required");

  return {
    req: {
      required: true,
      message,
      trigger: "blur",
      validator: (d) => {
        const value = form.value[d.field];
        if (!!value && value.length > 1) {
          return Promise.resolve();
        }

        return Promise.reject();
      },
    },
    email: {
      required: true,
      trigger: "blur",
      message: t("email is not valid"),
      validator: (d) => {
        const value = form.value[d.field];
        if (
          !!value &&
          value.length > 1 &&
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/.test(value)
        ) {
          return Promise.resolve();
        }

        return Promise.reject();
      },
    },
    state: {
      required: ["CA", "US", "ES"].includes(form.value.country),
      message,
      trigger: "blur",
    },
    postal_code: {
      validator: () => {
        const country = form.value.country;
        const value = form.value.postal_code;

        if (
          !postcodeValidatorExistsForCountry(country) ||
          postcodeValidator(value, country)
        ) {
          return Promise.resolve();
        }

        return Promise.reject();
      },
      required: false,
      message: t("ssl_product.postal_code_not_valid"),
      trigger: "blur",
    },
  };
});

watch(provider, async () => {
  fetch();
});

const fetch = async () => {
  if (!provider.value) {
    return;
  }

  fetchLoading.value = true;
  const promises = onCart.value.map(({ name }) =>
    api.servicesProviders.action({
      uuid: provider.value,
      action: "get_domain_price",
      params: { domain: name },
    })
  );
  try {
    const res = await Promise.all(promises);

    const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);

    res.forEach(({ meta }) => {
      Object.keys(meta.prices).forEach((key) => {
        meta.prices[key] =
          +meta.prices[key] +
          (+fullPlan.fee.default
            ? meta.prices[key] * (fullPlan.fee.default / 100)
            : 0);
      });
    });

    ogPrices.value = res;
  } catch (err) {
    const message = err.response?.data?.message ?? err.message ?? err;

    openNotification("error", {
      message: t(message),
    });
  } finally {
    fetchLoading.value = false;
    selectedProduct.value = onCart.value[0]?.name;
  }
};

fetch();

const convertPrices = async () => {
  if (!ogPrices.value.length) {
    return;
  }
  const res = JSON.parse(JSON.stringify(ogPrices.value));
  let data = [];

  fetchLoading.value = true;
  try {
    if (
      currenciesStore.defaultCurrency.code !== "USD" &&
      !Object.keys(productsDefaultCurrency.value).length
    ) {
      const amounts = [];

      res.forEach(({ meta }) => {
        Object.keys(meta.prices).forEach((key) => {
          amounts.push(meta.prices[key]);
        });
      });
      const response = await currenciesStore.convert({
        from: "USD",
        to: currenciesStore.defaultCurrency.code,
        amounts,
      });

      amounts.forEach((amount, index) => {
        data.push({ from: amount, converted: response.amounts[index] });
      });
    }

    res.forEach(({ meta }, i) => {
      const { name } = onCart.value[i];

      Object.keys(meta.prices).forEach((key) => {
        meta.prices[key] =
          data.find((d) => d.from == meta.prices[key])?.converted ??
          meta.prices[key];
      });

      productsDefaultCurrency.value[name] = { ...meta.prices };
    });

    data = [];

    if (currenciesStore.defaultCurrency.code !== currency.value.code) {
      const amounts = [];

      res.forEach(({ meta }) => {
        Object.keys(meta.prices).forEach((key) => {
          amounts.push(meta.prices[key]);
        });
      });
      const response = await currenciesStore.convert({
        from: currenciesStore.defaultCurrency.code,
        to: currency.value.code,
        amounts,
      });

      amounts.forEach((amount, index) => {
        data.push({ from: amount, converted: response.amounts[index] });
      });
    }

    res.forEach(({ meta }, i) => {
      const { name } = onCart.value[i];

      Object.keys(meta.prices).forEach((key) => {
        meta.prices[key] =
          data?.find((d) => d.from == meta.prices[key])?.converted ??
          meta.prices[key];
      });

      products.value[name] = { ...meta.prices };
    });
  } finally {
    fetchLoading.value = false;
  }
};

const installDataToBuffer = () => {
  const interestedKeys = [
    "firstname",
    "lastname",
    "companyname",
    "email",
    "address1",
    "address2",
    "city",
    "state",
    "country",
    "postcode",
    "phonenumber",
  ];
  interestedKeys.forEach((key) => {
    switch (key) {
      case "firstname":
        form.value.first_name = billingUser.value[key];
        break;
      case "lastname":
        form.value.last_name = billingUser.value[key];
        break;
      case "companyname":
        form.value.org_name = billingUser.value[key];
        break;
      case "postcode":
        form.value.postal_code = billingUser.value[key];
        break;
      case "phonenumber":
        form.value.phone = billingUser.value[key];
        break;
      default:
        form.value[key] = billingUser.value[key];
    }
  });
};
const orderClickHandler = async () => {
  const fullService = services.value.find(({ uuid }) => uuid === service.value);
  const fullPlan = plans.value.find(({ uuid }) => uuid === plan.value);

  const instances = Object.keys(products.value).map((domain) => ({
    config: { auto_start: fullPlan.meta.auto_start },
    resources: {
      ...resources.value,
      user: form.value,
      domain,
      reg_username: "user" + Math.random().toString(16).slice(2),
      reg_password: GeneratePassword({
        length: 20,
        numbers: true,
        symbols: false,
      }),
    },
    addons:
      resources.value.who_is_privacy && whoIsPrivacyAddon.value.uuid
        ? [whoIsPrivacyAddon.value.uuid]
        : [],
    title: `Domain - ${domain}`,
    billing_plan: { uuid: fullPlan.uuid },
    product: domain,
  }));

  const newGroup = {
    title: userdata.value.title + Date.now(),
    type: "opensrs",
    sp: provider.value,
    instances,
  };

  const info = !fullService
    ? newGroup
    : JSON.parse(JSON.stringify(fullService));
  const group = info.instancesGroups?.find(({ sp }) => sp === provider.value);

  if (group) group.instances = [...group.instances, ...instances];
  else if (fullService) info.instancesGroups.push(newGroup);

  if (!userdata.value.uuid) {
    const showcase =
      spStore.showcases.find(({ uuid }) => uuid === route.query.service) ?? {};

    onLogin.value.redirect = route.name;
    onLogin.value.redirectQuery = route.query;
    onLogin.value.info = {
      type: "domains",
      title:
        showcase.promo?.[locale.value]?.title ?? showcase.title ?? "domains",
      cost: formatPrice(fullPrice.value),
      currency: currency.value.code,
    };

    router.push({ name: "login" });
    return;
  }

  try {
    await form.value.validate();
    createDomains(info);
  } catch {
    openNotification("error", {
      message: t("all fields are required"),
    });
  }
};
const createDomains = async (info) => {
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

  try {
    await Promise.all(
      Object.keys(products.value).map((key) =>
        api.servicesProviders.action({
          uuid: provider.value,
          action: "add_product",
          params: {
            plan: plan.value,
            key,
            product: {
              kind: Kind.PREPAID,
              price:
                +productsDefaultCurrency.value[key][resources.value.period],
              title: `Domain: ${key}`,
              period: 86400 * 365 * +resources.value.period,
              resources: {},
            },
          },
        })
      )
    );

    const { uuid } = await instancesStore[`${action}Service`](orderData);
    await deployService(uuid, t("Domain created successfully"));

    onCart.value.forEach((domain, index) => {
      removeFromCart.value(domain, index);
    });

    router.push({ path: "/billing" });
  } catch (error) {
    const url =
      error.response?.data.redirect_url ?? error.response?.data ?? error;

    if (url.startsWith && url.startsWith("http")) {
      localStorage.setItem("order", "Invoice");
      router.push({ path: "/billing" });
      return;
    }

    const matched = (
      error.response?.data?.message ??
      error.message ??
      ""
    ).split(/error:"|error: "/);
    const message = matched.at(-1).split('" ').at(0);

    if (message) {
      notification.error({ message });
    } else {
      const message = error.response?.data?.message ?? error.message ?? error;

      notification.error({ message });
    }
    console.error(error);
  } finally {
  }
};
const orderConfirm = async () => {
  const domains = Object.keys(products.value);

  if (!domains.every((el) => el.match(/.+\..+/))) {
    message.error(t("domain is wrong"));
    return;
  }

  const instance = {
    config: {},
    billingPlan: plans.value.find(({ uuid }) => uuid === plan.value),
  };
  const isPayg = checkPayg(instance);
  const price = getProducts.value.pricing[resources.value.period];

  if ((isPayg && !checkBalance(price)) || !(await form.value.validate()))
    return;
  modal.value.confirmCreate = true;
};

const removeProduct = (domain, index) => {
  removeFromCart.value(domain, index);
  products.value[domain.name] = undefined;

  products.value = Object.keys(products.value).reduce((acc, key) => {
    if (products.value[key]) {
      acc[key] = products.value[key];
    }

    return acc;
  }, {});
};

const countriesOptions = computed(() => {
  return countries.map((country) => ({
    value: country.code,
    label: t(`country.${country.code}`),
  }));
});

const searchCountries = (input, option) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

watch(
  [selectedProduct, periods, products, onCart],
  () => {
    const prices = { suffix: currency.value.title };

    if (onCart.value.length === 0) {
      return {
        pricing: periods.value.reduce(
          (res, curr) => {
            res[curr] = 0;
            return res;
          },
          { ...prices }
        ),
      };
    }
    onCart.value.forEach(({ name }) => {
      const domain = products.value[name] ?? {};

      Object.entries(domain).forEach(([key, value]) => {
        if (!prices[key]) prices[key] = 0;
        prices[key] = +(prices[key] + +value).toFixed(2);
      });
    });
    getProducts.value = {
      name: `Domain - ${selectedProduct.value}`,
      pricing: { ...prices },
    };
  },
  { deep: true }
);

watch([ogPrices, currency], () => {
  convertPrices();
});
</script>

<script>
export default {
  name: "DomainOrder",
};
</script>

<style>
.has-error .ant-form-explain,
.has-error .ant-form-split {
  position: absolute;
}
</style>

<style scoped>
/*--description--*/
.description {
  padding: 12px;
  margin-top: 18px;
  background-color: var(--bright_bg);
}

.description-header {
  display: flex;
  margin-bottom: 2px;
}

.description-header p {
  margin-top: 4px;
  margin-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: #0fd058;
  background-color: var(--bright_bg);
  display: inline;
}

.description-body {
  background-color: var(--bright_bg);
}

.description-body__domain-name {
  color: black;
}

.description-body__btn-order {
  background-color: var(--err);
  color: var(--bright_font);
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: var(--err);
}
.description-body__btn-order:hover {
  color: var(--err) !important;
  background-color: var(--bright_font) !important;
  border-color: var(--err) !important;
}

div.ant-descriptions-view {
  border-color: var(--bright_bg) !important;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

th.ant-descriptions-item-label.ant-descriptions-item-colon.ant-descriptions-item-no-label {
  border: none;
  margin: 0;
  padding: 0;
}

td.ant-descriptions-item-content {
  padding: 7px 0 2px !important;
  font-weight: 400; /*!important*/
  font-size: 12px;
  text-align: center;
}
td.ant-descriptions-item-content:nth-child(2) {
  width: 184px;
  text-align: start;
  border: none;
}
td.ant-descriptions-item-content:nth-child(4) {
  width: 150px;
  background-color: var(--bright_font);
}
td.ant-descriptions-item-content:nth-child(6) {
  background-color: var(--bright_font);
}

/* order*/
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order-cart {
  position: absolute;
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1224px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.order__prop:not(:first-child) {
  margin-top: 15px;
}

.order__inputs {
  margin-right: 20px;
  width: 72%;
}

.order__field-cart {
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
  .order-cart {
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
  .order__field-cart {
    box-shadow: none;
    flex-grow: 0;
  }
  .order__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
  }
}
</style>
