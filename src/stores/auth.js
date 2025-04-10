import { computed, ref } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import cookies from "js-cookie";

import { useSpStore } from "./sp.js";
import { useInstancesStore } from "./instances.js";
import api, { addApiInterceptors } from "@/api.js";
import config from "@/appconfig.js";
import { useProductsStore } from "./products.js";
import { useCurrenciesStore } from "./currencies.js";

const COOKIES_NAME = "noCloudinApp-token";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();
  const i18n = useI18n();
  const sp = useSpStore();
  const instances = useInstancesStore();
  const products = useProductsStore();
  const currenciesStore = useCurrenciesStore();

  const { userCurrency } = storeToRefs(currenciesStore);

  const token = ref("");
  const userdata = ref({ data: {} });
  const billingUser = ref({});
  const billingUserPromise = ref();

  const loginButtons = ref([]);
  const baseURL = `${config.whmcsSiteUrl}/modules/addons/nocloud/api/index.php`;
  const isLogged = computed(() => token.value.length > 0);
  const userBalance = computed(() =>
    !isLogged.value
      ? 0
      : +userdata.value.balance?.toFixed(userCurrency.value.precision || 0)
  );

  function setToken(value) {
    const expires = new Date(Date.now() + 7776e6);

    token.value = value;
    cookies.set(COOKIES_NAME, value, { expires });
  }

  return {
    token,
    userdata,
    billingUser,
    userBalance,

    baseURL,
    isLogged,
    loginButtons,
    setToken,

    async login({ login, password, type, uuid }) {
      try {
        const response = await api.authorizeCustom({
          auth: { type, data: [login, password] },
          exp: Math.round((Date.now() + 7776e6) / 1000),
          uuid,
        });

        api.applyToken(response.token);
        addApiInterceptors();

        setToken(response.token);

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    logout() {
      if (!isLogged.value) return;

      const config = localStorage.getItem("globalConfig");
      const lang = localStorage.getItem("lang") ?? i18n.locale.value;

      localStorage.clear();
      localStorage.setItem("globalConfig", config);
      localStorage.setItem("lang", lang);
      instances.$reset();
      products.resetProducts();
      sp.$reset();

      token.value = "";
      billingUser.value = { data: {} };
      userdata.value = {};
      cookies.remove(COOKIES_NAME);
      router.push("/login");
    },

    load() {
      const getToken = cookies.get(COOKIES_NAME);
      if (getToken) {
        api.axios.defaults.headers.common.Authorization = "Bearer " + getToken;
        token.value = getToken;
      }
    },

    async fetchUserData(update) {
      if (userdata.value.uuid && !update) {
        return userdata.value;
      }

      try {
        const response = await api.accounts.get("me");

        if (!response.data) response.data = {};

        userdata.value = response;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async fetchBillingData(update) {
      if (billingUser.value.firstname && !update) {
        return billingUser.value;
      }
      if (!config.whmcsSiteUrl) return billingUser.value;
      if (billingUserPromise.value) return billingUserPromise.value;

      try {
        billingUserPromise.value = api.get(baseURL, {
          params: { run: "client_detail" },
        });
        const response = await billingUserPromise.value;

        if (!response.id) response.id = "none";
        billingUser.value = response;

        return response;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        billingUserPromise.value = null;
      }
    },

    async addSSH(data) {
      try {
        const response = await api.accounts.update(data.id, data.body);

        if (response.result === false) {
          throw new Error(response.message ?? "[Error]: Unknown");
        }
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async fetchAuth() {
      try {
        const response = await api.get("/oauth");

        loginButtons.value = response;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    async linkAccount(type) {
      try {
        const { url } = await api.get(`/oauth/${type}/link`, {
          params: {
            state: Math.random().toString(16).slice(2),
            redirect: `https://${location.host}/login`,
          },
        });

        location.assign(url);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  };
});
