<template>
  <div class="login">
    <div class="login__title login__layout">
      <div class="logo" :class="['pos_' + config.appLogo.pos]">
        <div v-if="companyName" class="logo__title">
          {{ companyName }}
        </div>
        <div v-if="companyLogo" class="logo__image">
          <img :src="companyLogo" alt="logo" />
        </div>
      </div>
      <svg class="clipPathSvg" width="0" height="0">
        <defs>
          <clipPath id="myCurve" clipPathUnits="objectBoundingBox">
            <path
              d="M0.000,0.000 L1,-0.000 L1,0.743 C1,0.7 1,0.806 0.846,0.806 C0.728,0.806 0.635,0.791 0.400,0.791 C0.130,0.791 0.022,0.976 0.000,1 L0.000,-0.000 Z"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
    <div class="login__main login__layout">
      <div class="login__UI">
        <div v-if="appStore.onLogin.info" class="login__action-info">
          {{ $t("comp_services.Your orders") }}:
          <div class="order__card">
            <div class="order__icon">
              <component
                :is="config.services[appStore.onLogin.info.type]?.icon"
              />
            </div>
            <div class="order__info">
              <div class="order__title">
                {{ appStore.onLogin.info.title }}
              </div>
              <div class="order__cost">
                {{ +appStore.onLogin.info.cost.toFixed(2) }}
                {{ appStore.onLogin.info.currency }}
              </div>
            </div>
            <div class="order__remove" @click="appStore.clearOnLogin">
              <close-icon />
            </div>
          </div>
        </div>

        <div class="login__inputs">
          <form>
            <!-- <div v-if="loginError" class="login__error">{{loginError}}</div> -->

            <!-- <div class="inputs__log-pas">
              <input type="text" placeholder="Email" v-model="userinfo.email">
              <span class="login__horisontal-line"></span>
              <input type="password" :placeholder="capitalize($t('clientinfo.password'))"  v-model="userinfo.password">
            </div> -->

            <div class="inputs__log-pas">
              <input
                v-if="fields.firstname"
                v-model="userinfo.firstname"
                type="text"
                name="firstname"
                :placeholder="`${capitalize($t('clientinfo.firstname'))} *`"
                readonly
                onfocus="this.removeAttribute('readonly')"
              />
              <span v-if="fields.firstname" class="login__horisontal-line" />
              <input
                v-if="fields.lastname"
                v-model="userinfo.lastname"
                type="text"
                name="lastname"
                :placeholder="`${capitalize($t('clientinfo.lastname'))} *`"
                readonly
                onfocus="this.removeAttribute('readonly')"
              />
              <span v-if="fields.lastname" class="login__horisontal-line" />
              <input
                v-if="fields.email"
                v-model="userinfo.email"
                type="email"
                name="email"
                :placeholder="`${capitalize($t('clientinfo.email'))} *`"
                readonly
                onfocus="this.removeAttribute('readonly')"
              />

              <span v-if="fields.email" class="login__horisontal-line" />
              <a-select
                v-if="fields.country"
                id="country"
                v-model:value="userinfo.country"
                name="country"
                class="register__select"
                show-search
                :filter-option="searchCountries"
                :placeholder="`${capitalize($t('clientinfo.countryname'))} *`"
              >
                <a-select-option
                  v-for="country in countries"
                  :key="country.code"
                >
                  {{ $t(`country.${country.code}`) }}
                </a-select-option>
              </a-select>

              <span v-if="fields.country" class="login__horisontal-line" />

              <phone-input
                v-if="fields.phonenumber"
                :disabled="!userinfo.country"
                :number="userinfo.phone_new.phone_number"
                @update:number="userinfo.phone_new.phone_number = $event"
                :code="userinfo.phone_new.phone_cc"
                @update:code="userinfo.phone_new.phone_cc = $event"
              />

              <span v-if="fields.phonenumber" class="login__horisontal-line" />
              <a-input-password
                v-if="fields.password"
                v-model:value="userinfo.password"
                :placeholder="`${capitalize($t('clientinfo.password'))} *`"
                style="padding: 6px 15px; border: none"
              />
            </div>

            <div class="inputs__log-pas" style="padding: 8px 16px">
              <a-checkbox v-model:checked="invoiceChecked">
                {{ $t("Company Details") }}
              </a-checkbox>
            </div>

            <div v-if="invoiceChecked" class="inputs__log-pas">
              <input
                v-if="fields.company.companyname"
                v-model="userinfo.companyname"
                :placeholder="`${capitalize($t('clientinfo.companyname'))} *`"
              />
              <span
                v-if="fields.company.companyname"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.tax_id"
                v-model="userinfo.tax_id"
                :placeholder="
                  userinfo.country === 'PL' ? 'NIP' : 'VAT ID / Tax ID'
                "
              />
              <!-- <span class="login__horisontal-line"></span>
              <input :placeholder="capitalize($t('clientinfo.state'))" v-model="userinfo.state"> -->
              <span
                v-if="fields.company.tax_id"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.city"
                v-model="userinfo.city"
                :placeholder="`${capitalize($t('clientinfo.city'))} *`"
              />
              <span v-if="fields.company.city" class="login__horisontal-line" />
              <input
                v-if="fields.company.postcode"
                v-model="userinfo.postcode"
                :placeholder="`${capitalize($t('clientinfo.postcode'))} *`"
              />
              <span
                v-if="fields.company.postcode"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.address1"
                v-model="userinfo.address1"
                :placeholder="`${capitalize($t('clientinfo.address'))} *`"
              />
              <span
                v-if="fields.company.address1"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.account_number"
                v-model="userinfo.account_number"
                :placeholder="`${capitalize(
                  $t('documents.payer account number'),
                )} *`"
              />
              <span
                v-if="fields.company.account_number"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.checking_account"
                v-model="userinfo.checking_account"
                :placeholder="`${capitalize(
                  $t('documents.checking account'),
                )} *`"
              />
              <span
                v-if="fields.company.checking_account"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.bankname"
                v-model="userinfo.bankname"
                :placeholder="`${capitalize($t('documents.bankname'))} *`"
              />
              <span
                v-if="fields.company.bankname"
                class="login__horisontal-line"
              />
              <input
                v-if="fields.company.bic"
                v-model="userinfo.bic"
                placeholder="BIC *"
              />
            </div>

            <div class="inputs__log-pas">
              <a-select
                v-model:value="$i18n.locale"
                class="register__select"
                style="width: 100%; border: none"
              >
                <a-select-option v-for="lang in config.languages" :key="lang">
                  {{ $t("localeLang", lang) }}
                </a-select-option>
              </a-select>

              <span class="login__horisontal-line" />
              <a-select
                v-model:value="userinfo.currency"
                class="register__select"
                style="width: 100%; border: none"
              >
                <a-select-option
                  v-for="currency in currencies"
                  :key="currency.id"
                >
                  {{ currency.code }}
                </a-select-option>
              </a-select>
            </div>

            <button
              v-if="!registerLoading"
              class="login__submit"
              @click.prevent="submitHandler"
            >
              {{ capitalize($t("clientinfo.register")) }}
            </button>

            <div v-else class="login__loading">
              <span class="load__item" />
              <span class="load__item" />
              <span class="load__item" />
            </div>
          </form>
        </div>
        <div class="register__already-has" style="margin-top: 20px">
          <router-link :to="{ name: 'login', query: route.query }">
            {{ capitalize($t("clientinfo.already have account?")) }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  inject,
  onMounted,
  ref,
  watch,
} from "vue";
import { notification, message } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import api from "@/api.js";
import config from "@/appconfig.js";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useCurrenciesStore } from "@/stores/currencies.js";
import countries from "@/assets/countries.json";
import PhoneInput from "@/components/ui/phoneInput.vue";

const router = useRouter();
const route = useRoute();
const i18n = useI18n();

const appStore = useAppStore();
const authStore = useAuthStore();
const currenciesStore = useCurrenciesStore();

const closeIcon = defineAsyncComponent(
  () => import("@ant-design/icons-vue/CloseOutlined"),
);

const registerLoading = ref(false);
const invoiceChecked = ref(false);
const userinfo = ref({
  firstname: "",
  lastname: "",
  email: "",
  password: "",

  address1: "",
  city: "",
  // state: '',
  postcode: "",
  country: undefined,
  phonenumber: "",
  phone_new: { phone_cc: "", phone_number: "" },
  currency: 1,

  companyname: "",
  tax_id: "",
  account_number: "",
  checking_account: "",
  bankname: "",
  bic: "",
});

const currencies = computed(() => currenciesStore.list);

watch(
  () => currenciesStore.list,
  () => {
    setDefaultCurrency();
  },
);

const setDefaultCurrency = () => {
  userinfo.value.currency = currenciesStore.defaultCurrency.id;
};

//rm after register refactor to nocloud
const whmcsCurrencies = ref([]);
const fetchWhmcsCurrencies = async () => {
  if (!config.whmcsSiteUrl) return;
  try {
    const response = await api.get(authStore.baseURL, {
      params: { run: "get_currencies" },
    });

    if (Array.isArray(response.currency)) {
      whmcsCurrencies.value = response.currency;
    } else {
      whmcsCurrencies.value = Object.keys(response.currency).map(
        (key) => response.currency[key],
      );
    }

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
onMounted(() => {
  fetchWhmcsCurrencies();
  setDefaultCurrency();
});

userinfo.value.currency = currenciesStore.defaultCurrency;

const companyName = computed(() => appStore.domainInfo.name ?? config.appTitle);

const companyLogo = computed(() => {
  const { settings } = appStore.domainInfo;

  if (settings.logo && typeof settings.logo === "string") {
    return settings.logo;
  }
  return config.appLogo.path;
});

const fields = ref({});

async function fetchFields() {
  try {
    const response = await api.get(authStore.baseURL, {
      params: { run: "fields_register" },
    });

    fields.value = response;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
    console.error(error);
  }
}

fetchFields();

async function submitHandler() {
  let info = JSON.parse(JSON.stringify(fields.value));

  if (!invoiceChecked.value) {
    delete info.company;
  } else {
    info = { ...info, ...info.company };
    delete info.company;
  }
  const regexEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/;

  if (!userinfo.value.email.match(regexEmail)) {
    message.warn(i18n.t("email is not valid"));
    return;
  }

  const temp = JSON.parse(JSON.stringify(userinfo.value));
  const { locale } = i18n.getLocaleMessage(i18n.locale.value);

  temp.email = `${temp.email[0].toLowerCase()}${temp.email.slice(1)}`;
  temp.phonenumber = temp.phone_new.phone_number;

  for (const [key, value] of Object.entries(info)) {
    if (value !== "require") continue;
    if (temp[key].length === 0) {
      message.warn(`${key} - ${i18n.t("ssl_product.field is required")}`);
      return;
    }
    if (temp[key].length < 2) {
      message.warn(`${key} - ${i18n.t("field must contain more characters")}`);
      return;
    }
  }

  const currency = currencies.value.find((c) => c.id === temp.currency);

  try {
    console.log(temp, {
      params: {
        ...temp,
        currency: whmcsCurrencies.value.find((c) => c.code === currency.code)
          .id,
        phone_new: JSON.stringify(temp.phone_new),
        app_language: locale,
        run: "create_user",
      },
    });

    registerLoading.value = true;
    const response = config.whmcsSiteUrl
      ? await api.get(authStore.baseURL, {
          params: {
            ...temp,
            currency: whmcsCurrencies.value.find(
              (c) => c.code === currency.code,
            ).id,
            phone_new: JSON.stringify(temp.phone_new),
            app_language: locale,
            run: "create_user",
          },
        })
      : await api.post("/accounts/signup", {
          title: `${temp.firstname} ${temp.lastname}`,
          auth: { type: "standard", data: [temp.email, temp.password] },
          currency,
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
            "phone_new",
          ].reduce((result, key) => ({ ...result, [key]: temp[key] }), {}),
        });

    if (!response)
      throw new Error(`[Error]: ${i18n.t("failed to create user")}`);
    if (response.result === "error") throw response;
    else message.success(i18n.t("account created successfully"));
    router.push({ name: "new-user", query: router.query });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
    console.error(error);
  } finally {
    registerLoading.value = false;
  }
}

function searchCountries(input, option) {
  const country = option.children(option)[0].children.toLowerCase();

  return country.includes(input.toLowerCase());
}

const theme = inject("theme");
const shadowColor = computed(() =>
  theme.value ? "var(--bright_font)" : "rgba(164, 180, 244, .5)",
);

watch(
  () => userinfo.value.country,
  (value) => {
    userinfo.value.phone_new.phone_cc = countries.find(
      (c) => c.code === value,
    ).dial_code;
  },
);
</script>

<script>
export default { name: "RegisterView" };
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo__image {
  max-width: 70%;
}

.logo__image img {
  max-width: 100%;
}

.pos_top {
  flex-direction: column-reverse;
}

.pos_bottom {
  flex-direction: column;
}

.pos_left {
  flex-direction: row-reverse;
}

.pos_right {
  flex-direction: row;
}

.logo__title {
  text-align: center;
}

.clipPathSvg {
  height: 0;
  width: 0;
}

.login {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 50% auto;
  overflow-y: auto;
}

.login__layout {
  overflow-y: initial;
}

.login__title {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main);
  clip-path: url(#myCurve);
  color: var(--gloomy_font);
  font-size: 36px;
  font-weight: bold;
}

.login__title::selection {
  color: var(--main);
  background: var(--bright_font);
}
.login__title::moz-selection {
  color: var(--main);
  background: var(--bright_font);
}

.login__main {
  background: var(--bright_bg);
}

.login__UI {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  min-height: 100%;
  padding-bottom: 15px;
}

.login__action-info {
  margin-bottom: 20px;
}

.login__inputs {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 80%;
  max-width: 500px;
}

.login__horisontal-line {
  display: block;
  width: 95%;
  height: 1px;
  margin: auto;
  background: var(--bright_bg);
}

.inputs__log-pas {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 3px 8px 20px v-bind("shadowColor");
  margin-bottom: 25px;
}

:deep(.ant-select.register__select) .ant-select-selector {
  padding: 0px 15px;
  border: 0;
}

.login__submit {
  border: none;
  outline: none;
  color: var(--gloomy_font);
  font-weight: 600;
  border-radius: 10px;
  padding: 7px 20px;
  background: var(--main);
  background-size: 150% 200%;
  background-position: 0 0;
  /* animation: AnimationName 1s ease infinite; */
  cursor: pointer;
  width: 100%;
}
#qrcode {
  display: none;
}

.login__submit:hover {
  animation: gradient 2s ease infinite;
}

@keyframes gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.inputs__log-pas input,
.inputs__log-pas select {
  border: none;
  outline: none;
  padding: 10px 15px;
  background: var(--bright_font);
}

.inputs__log-pas :deep(input.ant-input),
.inputs__log-pas :deep(.ant-input-password),
.inputs__log-pas :deep(.ant-select-selector) {
  background: var(--bright_font);
}

.inputs__log-pas .ant-select-search__field {
  padding-left: 0;
}

.inputs__log-pas input::placeholder {
  opacity: 0.5;
}

.register__already-has a {
  text-decoration: none;
}

.register__already-has a:hover {
  text-decoration: underline;
}

.inputs__log-pas .ant-select-selection--single .ant-select-selection__rendered {
  margin-left: 15px;
}

.login__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 35px;
}

.load__item:not(:first-child) {
  margin-left: 10px;
}

.load__item {
  display: block;
  width: 25px;
  height: 25px;
  background: var(--main);
  border-radius: 50%;
}

.load__item:nth-child(1) {
  animation: loading 1.4s 0.2s ease infinite;
}
.load__item:nth-child(2) {
  animation: loading 1.4s 0.4s ease infinite;
}
.load__item:nth-child(3) {
  animation: loading 1.4s 0.6s ease infinite;
}

.inputs__log-pas .ant-select-selection {
  border: none;
}

@keyframes loading {
  from,
  to {
    transform: scale(1);
  }
  50% {
    transform: scale(0.2);
  }
}

.login__error {
  color: tomato;
  text-align: center;
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
}

@media screen and (max-width: 500px) and (max-height: 700px) {
  .login {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    overflow-y: auto;
  }

  .login__title {
    padding: 8px;
    font-size: 18px;
  }

  .logo {
    gap: 8px;
  }

  .logo__image {
    max-width: 40%;
  }

  .login__UI {
    justify-content: flex-start;
    padding: 10px 0;
    min-height: auto;
  }

  .login__inputs {
    width: 90%;
    max-width: 450px;
  }

  .inputs__log-pas {
    margin-bottom: 12px;
  }

  .login__submit {
    font-size: 13px;
    padding: 6px 15px;
    width: 100%;
  }

  .login__action-info {
    margin-bottom: 10px;
    font-size: 13px;
  }

  .order__card {
    min-width: 100%;
    padding: 8px 12px;
    margin-top: 5px;
  }

  .order__icon {
    font-size: 24px;
  }

  .order__title {
    margin-right: 10px;
    font-size: 12px;
  }

  .order__cost {
    font-size: 12px;
  }

  .register__already-has {
    margin-top: 10px !important;
    font-size: 12px;
  }

  .login__loading {
    height: 30px;
  }

  .load__item {
    width: 20px;
    height: 20px;
  }

  .load__item:not(:first-child) {
    margin-left: 8px;
  }
}

@media screen and (min-width: 1024px) {
  .login {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    overflow-y: initial;
  }

  .login__layout {
    overflow-y: auto;
  }

  .login__title {
    clip-path: none;
  }

  .login__UI {
    justify-content: center;
    padding: 15px;
  }

  #qrcode {
    display: inline-block;
  }
}
</style>
