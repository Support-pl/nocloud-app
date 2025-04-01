import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { CurrencyService } from "nocloud-proto/proto/es/billing/billing_connect";
import {
  GetCurrenciesRequest,
  GetExchangeRatesRequest,
} from "nocloud-proto/proto/es/billing/billing_pb";
import { useAppStore } from "./app.js";
import { createPromiseClient } from "@connectrpc/connect";
import { useAuthStore } from "./auth.js";
import { MultiConversionRequest } from "nocloud-proto/proto/es/billing/billing_pb.js";

export const useCurrenciesStore = defineStore("currencies", () => {
  const app = useAppStore();
  const auth = useAuthStore();

  const list = ref([]);
  const currencies = ref([]);
  const defaultCurrency = ref({ id: 0, title: "USD" });
  const unloginedCurrency = ref({ id: 0, title: "USD" });
  const isLoading = ref(false);

  function setDefaultCurrency(currencies) {
    const currency = currencies.find((el) => el.default);

    if (!currency) return;
    defaultCurrency.value = JSON.parse(JSON.stringify(currency));
    unloginedCurrency.value = JSON.parse(JSON.stringify(currency));
  }

  const userCurrency = computed(() =>
    auth.isLogged ? auth.userdata.currency : unloginedCurrency.value
  );

  return {
    list,
    currencies,
    defaultCurrency,
    unloginedCurrency,
    userCurrency,

    async fetchCurrencies() {
      const currenciesApi = createPromiseClient(CurrencyService, app.transport);

      if (isLoading.value) return;
      try {
        isLoading.value = true;
        const [currenciesResponse, ratesResponse] = await Promise.all([
          currenciesApi.getCurrencies(GetCurrenciesRequest.fromJson({})),
          currenciesApi.getExchangeRates(GetExchangeRatesRequest.fromJson({})),
        ]);

        list.value = currenciesResponse.toJson().currencies;
        setDefaultCurrency(list.value);

        currencies.value = ratesResponse.toJson().rates;

        return list.value;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },

    convert({ from, to, amounts }) {
      const currenciesApi = createPromiseClient(CurrencyService, app.transport);

      return currenciesApi.convertMany(
        MultiConversionRequest.fromJson({
          from: { code: from },
          to: { code: to },
          amounts,
        })
      );
    },
  };
});
