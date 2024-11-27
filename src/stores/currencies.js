import { ref } from "vue";
import { defineStore } from "pinia";
import { CurrencyService } from "nocloud-proto/proto/es/billing/billing_connect";
import {
  GetCurrenciesRequest,
  GetExchangeRatesRequest,
} from "nocloud-proto/proto/es/billing/billing_pb";
import { useAppStore } from "./app.js";
import { createPromiseClient } from "@connectrpc/connect";

export const useCurrenciesStore = defineStore("currencies", () => {
  const app = useAppStore();

  const list = ref([]);
  const currencies = ref([]);
  const defaultCurrency = ref({ id: 0, title: "USD" });
  const unloginedCurrency = ref({ id: 0, title: "USD" });
  const isLoading = ref(false);

  function setDefaultCurrency(currencies) {
    const currency = currencies.find(
      (el) => el.rate === 1 && [el.from.title, el.to.title].includes("NCU")
    );

    if (!currency) return;
    defaultCurrency.value =
      currency.from.title === "NCU" ? currency.to : currency.from;
  }

  return {
    list,
    currencies,
    defaultCurrency,
    unloginedCurrency,

    setDefaultCurrency,

    async fetchCurrencies() {
      const currenciesApi = createPromiseClient(CurrencyService, app.transport);

      if (isLoading.value) return;
      try {
        isLoading.value = true;
        const [currenciesResponse, ratesResponse] = await Promise.all([
          currenciesApi.getCurrencies(GetCurrenciesRequest.fromJson({})),
          currenciesApi.getExchangeRates(GetExchangeRatesRequest.fromJson({})),
        ]);

        list.value = currenciesResponse
          .toJson()
          .currencies.map((currency) => ({
            id: currency.id,
            code: currency.title,
            precision: currency.precision,
          }))
          .filter((currency) => currency.code !== "NCU");

        currencies.value = ratesResponse.toJson().rates;
        setDefaultCurrency(currencies.value);

        return list.value;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        isLoading.value = false;
      }
    },
  };
});
