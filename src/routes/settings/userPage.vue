<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <div class="content__title">
          {{ $t("Personal Area") }}
          <span class="content__small">
            #{{
              isWhmcsUser ? authStore.billingUser.id : authStore.userdata.uuid
            }}
          </span>
        </div>
        <div
          class="content__fields-wrapper"
          :style="{ margin: isWhmcsUser || isNocloudUser ? null : 'auto' }"
        >
          <a-form
            v-if="isWhmcsUser"
            ref="formRef"
            layout="vertical"
            :model="form"
            :rules="rules"
          >
            <a-form-item
              v-for="key of mainKeys"
              :key="key"
              :label="`${capitalize($t(`clientinfo.${key}`))}:`"
              :name="key"
            >
              <a-input v-model:value="form[key]" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              :label="form.countryname === 'PL' ? 'NIP' : 'VAT ID'"
              name="tax_id"
            >
              <a-input v-model:value="form.tax_id" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t('clientinfo.countryname'))}:`"
              name="countryname"
            >
              <a-select
                v-model:value="form.countryname"
                show-search
                :filter-option="searchCountries"
                :disabled="
                  authStore.billingUser.country_stop === 1 || isDisabled
                "
              >
                <a-select-option
                  v-for="country in countries"
                  :key="country.code"
                >
                  {{ $t(`country.${country.code}`) }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t('clientinfo.phonenumber'))}:`"
              name="phonenumber"
            >
              <input
                v-model="form.phonenumber"
                v-phone="phonecode"
                type="tel"
                class="user__input"
                :disabled="!form.countryname || isDisabled"
              />
            </a-form-item>

            <a-form-item
              v-for="(title, key) in keys"
              :key="key"
              :label="`${capitalize($t(`documents.${title}`))}:`"
              :name="key"
            >
              <a-input v-model:value="form[key]" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              v-if="isPasswordVisible"
              :label="`${capitalize($t('clientinfo.password'))}:`"
              name="password"
            >
              <a-input v-model:value="form.password" />
            </a-form-item>

            <a-button
              v-if="!isDisabled"
              class="user__button user__button--submit"
              type="primary"
              :loading="isSendingInfo"
              @click="sendInfo"
            >
              {{ $t("Submit") }}
            </a-button>
            <a-button
              v-if="!isDisabled"
              class="user__button user__button--cancel"
              @click="installDataToBuffer"
            >
              {{ $t("Cancel") }}
            </a-button>
          </a-form>

          <a-form v-else-if="isNocloudUser" ref="formRef" layout="vertical">
            <a-form-item :label="`${capitalize($t(`clientinfo.username`))}:`">
              <a-input readonly :value="authStore.userdata.title" />
            </a-form-item>

            <a-form-item :label="`${capitalize($t(`clientinfo.email`))}:`">
              <a-input readonly :value="authStore.userdata.data.email" />
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t(`clientinfo.phonenumber`))}:`"
            >
              <a-input readonly :value="authStore.userdata.data.phone" />
            </a-form-item>
          </a-form>

          <loading v-else-if="isLoading" />
          <empty v-else style="height: 100%" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from "vue";
import { notification } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import config from "@/appconfig.js";
import api from "@/api.js";

import { useAuthStore } from "@/stores/auth.js";
import countries from "@/assets/countries.json";

import empty from "@/components/ui/empty.vue";
import loading from "@/components/ui/loading.vue";

const i18n = useI18n();
const authStore = useAuthStore();

const formRef = ref(null);
const form = ref({});
const isLoading = ref(false);
const isSendingInfo = ref(false);

const reqRule = reactive({
  required: true,
  message: "Field is required",
  trigger: "change",
});
const rules = computed(() => ({
  email: [reqRule],
  lastname: [reqRule],
  firstname: [reqRule],
  countryname: [reqRule],
  phonenumber: [reqRule],
  currency: [reqRule],

  companyname: [{ required: false }],
  address1: [{ required: false }],
  city: [{ required: false }],
  state: [{ required: false }],
  postcode: [{ required: false }],
  account_number: [{ required: false }],
  checking_account: [{ required: false }],
  bankname: [{ required: false }],
  bic: [{ required: false }],
}));

onMounted(() => {
  reqRule.message = `${i18n.t("ssl_product.field is required")}`;
});

const deltaInfo = computed(() => {
  const info = { ...form.value, country: form.value.countryname };

  for (const key in info) {
    if (info[key] === authStore.billingUser[key]) {
      delete info[key];
    }
  }
  return info;
});

const phonecode = computed(
  () =>
    countries.find(({ title }) => title === form.value.countryname)?.dial_code
);

const isDisabled = computed(() => {
  if (!authStore.billingUser.roles) return;
  return !!authStore.billingUser.roles.settings;
});

const isWhmcsUser = computed(() => {
  if (!config.whmcsSiteUrl) return true;
  if (localStorage.getItem("oauth")) return true;
  return !isLoading.value && authStore.billingUser.firstname;
});

const isNocloudUser = computed(() => {
  return !isLoading.value && authStore.userdata.title;
});

const isPasswordVisible = computed(() => localStorage.getItem("oauth"));

const mainKeys = computed(() => {
  if (isWhmcsUser.value) {
    const result = [
      "firstname",
      "lastname",
      "companyname",
      "email",
      "address1",
      "city",
      "state",
      "postcode",
    ];

    return result.filter((key) => key in authStore.billingUser);
  } else {
    const result = ["title", "data.email", "data.phone"];
    return result;
  }
});
const keys = computed(() => {
  const result = {
    account_number: "payer account number",
    checking_account: "checking account",
    bankname: "bankname",
    bic: "BIC",
  };

  Object.keys(result).forEach((key) => {
    if (!(key in authStore.billingUser)) {
      delete result[key];
    }
  });

  return result;
});

function installDataToBuffer() {
  const interestedKeys = [
    ...mainKeys.value,
    ...Object.keys(keys.value),
    "address2",
    "countryname",
    "phonenumber",
    "tax_id",
  ];

  interestedKeys.forEach((key) => {
    if (config.whmcsSiteUrl) {
      form.value[key] = authStore.billingUser[key];
    } else {
      form.value[key] = authStore.userdata.data[key];
    }
  });
}

async function fetchInfo(update) {
  try {
    isLoading.value = true;
    const response = await authStore.fetchBillingData(update);

    if (localStorage.getItem("oauth")) return;
    if (response.ERROR) throw response.ERROR.toLowerCase();
    if (response.result === "error") throw response;

    installDataToBuffer();
  } finally {
    isLoading.value = false;
  }
}

async function sendInfo() {
  try {
    await formRef.value.validate();
  } catch {
    notification.error({
      message: i18n.t("ssl_product.fields is required"),
    });
    return;
  }

  try {
    const { locale } = i18n.getLocaleMessage(i18n.locale.value);
    const params = localStorage.getItem("oauth")
      ? {
          ...deltaInfo.value,
          app_language: locale,
          uuid: authStore.userdata.uuid,
          run: "create_user_active",
        }
      : {
          run: "update_client",
          user: { ...authStore.billingUser, ...deltaInfo.value },
        };
    let response;

    isSendingInfo.value = true;
    if (config.whmcsSiteUrl) {
      response = await api.get(authStore.baseURL, { params });
    } else {
      await api.accounts.update(authStore.userdata.uuid, {
        ...authStore.userdata,
        title: `${deltaInfo.value.firstname} ${deltaInfo.value.lastname}`,
        data: [
          "firstname",
          "lastname",
          "email",
          "address1",
          "city",
          "postcode",
          "country",
          "phonenumber",
          "companyname",
        ].reduce(
          (result, key) => ({ ...result, [key]: deltaInfo.value[key] }),
          { ...authStore.userdata.data }
        ),
      });
    }

    if (response.error === "email") {
      throw new Error(i18n.t("Email is already in use or is empty"));
    } else if (response.error) {
      throw new Error(response.error);
    }

    localStorage.removeItem("oauth");
    notification.success({ message: i18n.t("Done") });

    fetchInfo(true);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
    console.error(error);
  } finally {
    isSendingInfo.value = false;
  }
}

function searchCountries(input, option) {
  const country = option.children(option)[0].children.toLowerCase();

  return country.includes(input.toLowerCase());
}

const theme = inject("theme");
const inputColors = computed(() =>
  theme.value
    ? { background: "var(--bright_bg)", border: "var(--bright_font)" }
    : { background: "inherit", border: "var(--border_color)" }
);

if (!("firstname" in authStore.billingUser)) fetchInfo();
else installDataToBuffer();
</script>

<script>
export default { name: "UserSettingsView" };
</script>

<style>
.user__settings {
  padding-top: 10px;
}

.content__wrapper {
  display: flex;
  flex-direction: column;
  padding: 10px 10px 15px 10px;
  border-radius: 10px;
  background: var(--bright_font);
}

.content__fields-wrapper {
  min-height: 100%;
}

.content__title {
  font-size: 1.6rem;
  margin-bottom: 5px;
}

.content__small {
  font-size: 0.7em;
  opacity: 0.5;
}

.user__input {
  padding: 4px 11px;
  font-size: 14px;
  width: 100%;
  border: 1px solid v-bind("inputColors.border");
  border-radius: 6px;
  transition: all 0.2s;
  background: v-bind("inputColors.background");
}

.user__input:disabled {
  color: rgba(0, 0, 0, 0.25);
  background-color: rgba(0, 0, 0, 0.04);
  border-color: v-bind("inputColors.border");
  box-shadow: none;
  cursor: not-allowed;
}

.user__button--cancel {
  margin-left: 10px;
}
</style>
