<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <div class="content__title">
          {{ $t("Personal Area") }}
          <span class="content__small">
            #{{ isWhmcsUser ? billingUser.id : userdata.uuid }}
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
              <a-select
                v-if="key === 'countryname'"
                v-model:value="form.countryname"
                show-search
                :filter-option="searchCountries"
                :disabled="billingUser.country_stop === 1 || isDisabled"
                readonly
              >
                <a-select-option
                  v-for="country in countries"
                  :key="country.code"
                >
                  {{ $t(`country.${country.code}`) }}
                </a-select-option>
              </a-select>
              <div
                v-else-if="key === 'phonenumber'"
                style="display: flex; align-items: center"
              >
                <phone-input
                  style="width: 100%"
                  :number="form.phone_new.phone_number"
                  @update:number="form.phone_new.phone_number = $event"
                  :code="form.phone_new.phone_cc"
                  @update:code="form.phone_new.phone_cc = $event"
                />
                <template v-if="userdata.data.phone_new.phone_cc == '375'">
                  <a-button
                    style="margin-left: 5px"
                    type="primary"
                    @click="isPhonenumberVerificationOpen = true"
                    v-if="!userdata.isPhoneVerified"
                    :icon="h(warningOutlined)"
                    >{{ $t("phone_verification.labels.verify") }}</a-button
                  >
                  <check-circle-filled
                    style="margin-left: 5px; font-size: 1.2rem"
                    v-else
                    two-tone-color="#22bb33"
                  />
                </template>
              </div>
              <a-input
                v-else
                v-model:value="form[key]"
                :disabled="isDisabled"
              />
            </a-form-item>

            <a-form-item
              :label="form.countryname === 'PL' ? 'NIP' : 'VAT ID'"
              name="tax_id"
            >
              <a-input v-model:value="form.tax_id" :disabled="isDisabled" />
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
              <a-input readonly :value="userdata.title" />
            </a-form-item>

            <a-form-item :label="`${capitalize($t(`clientinfo.email`))}:`">
              <a-input readonly :value="userdata.data.email" />
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t(`clientinfo.phonenumber`))}:`"
            >
              <a-input readonly :value="userdata.data.phone" />
            </a-form-item>
          </a-form>
          <loading v-else-if="isLoading" />
          <empty v-else style="height: 100%" />
        </div>
      </div>
    </div>

    <verification-modal
      :open="isPhonenumberVerificationOpen"
      @update:open="isPhonenumberVerificationOpen = $event"
      @confirm="onCodeConfirm"
    />
  </div>
</template>

<script setup>
import {
  computed,
  inject,
  onMounted,
  reactive,
  ref,
  defineAsyncComponent,
} from "vue";
import { notification } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import config from "@/appconfig.js";
import api from "@/api.js";
import { useAuthStore } from "@/stores/auth.js";
import countries from "@/assets/countries.json";
import empty from "@/components/ui/empty.vue";
import loading from "@/components/ui/loading.vue";
import { storeToRefs } from "pinia";
import { h } from "vue";
import VerificationModal from "@/components/settings/verificationModal.vue";
import PhoneInput from "@/components/ui/phoneInput.vue";

const warningOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/WarningOutlined")
);

const checkCircleFilled = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CheckCircleTwoTone")
);

const i18n = useI18n();
const authStore = useAuthStore();
const { billingUser, userdata } = storeToRefs(authStore);

const formRef = ref(null);
const form = ref({});
const isLoading = ref(false);
const isSendingInfo = ref(false);
const isPhonenumberVerificationOpen = ref(false);

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
    if (info[key] === billingUser.value[key]) {
      delete info[key];
    }
  }
  return info;
});

const isDisabled = computed(() => {
  if (!billingUser.value.roles) return;
  return !!billingUser.value.roles.settings;
});

const isWhmcsUser = computed(() => {
  if (!config.whmcsSiteUrl) return true;
  if (localStorage.getItem("oauth")) return true;
  return !isLoading.value && billingUser.value.firstname;
});

const isNocloudUser = computed(() => {
  return !isLoading.value && userdata.value.title;
});

const isPasswordVisible = computed(() => localStorage.getItem("oauth"));

const mainKeys = computed(() => {
  if (isWhmcsUser.value) {
    const result = [
      "firstname",
      "lastname",
      "email",
      "companyname",
      "address1",
      "countryname",
      "city",
      "state",
      "postcode",
    ];

    return result
      .filter((key) => key in billingUser.value)
      .concat(["phonenumber"]);
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
    if (!(key in billingUser.value)) {
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
    "phone_new",
    "tax_id",
  ];

  interestedKeys.forEach((key) => {
    if (key === "phone_new") {
      return (form.value[key] = { ...userdata.value.data[key] });
    }
    if (config.whmcsSiteUrl) {
      form.value[key] = billingUser.value[key];
    } else {
      form.value[key] = userdata.value.data[key];
    }
  });
}

function onCodeConfirm() {
  fetchInfo(true);
  authStore.fetchUserData(true);
}

async function fetchInfo(update) {
  try {
    isLoading.value = true;
    const response = await authStore.fetchBillingData(update);
    if (localStorage.getItem("oauth")) return;
    if (response.ERROR) throw response.ERROR.toLowerCase();
    if (response.result === "error") throw response;
  } finally {
    setTimeout(() => {
      isLoading.value = false;

      installDataToBuffer();
    }, 100);
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
          uuid: userdata.value.uuid,
          run: "create_user_active",
        }
      : {
          run: "update_client",
          user: { ...billingUser.value, ...deltaInfo.value },
        };
    let response;

    isSendingInfo.value = true;
    if (config.whmcsSiteUrl) {
      response = await api.get(authStore.baseURL, { params });
    } else {
      await api.accounts.update(userdata.value.uuid, {
        ...userdata.value,
        title: `${deltaInfo.value.firstname} ${deltaInfo.value.lastname}`,
        data: [
          "firstname",
          "lastname",
          "email",
          "address1",
          "city",
          "postcode",
          "country",
          "phone_new",
          "companyname",
        ].reduce(
          (result, key) => ({ ...result, [key]: deltaInfo.value[key] }),
          { ...userdata.value.data }
        ),
      });
    }

    if (response.error === "email") {
      throw new Error(i18n.t("Email is already in use or is empty"));
    } else if (response.error) {
      throw new Error(response.error);
    }

    if (
      JSON.stringify(userdata.value.data.phone_new) !==
      JSON.stringify(form.value.phone_new)
    ) {
      await api.post("/accounts/change_phone", {
        newPhone: {
          countryCode: form.value.phone_new.phone_cc,
          number: form.value.phone_new.phone_number,
        },
      });

      userdata.value.data.phone_new = { ...form.value.phone_new };
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

if (!("firstname" in billingUser.value)) fetchInfo();
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
