import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.js";
import { useCurrenciesStore } from "@/stores/currencies.js";

function useCurrency() {
  const store = useCurrenciesStore();
  const { isLogged, userdata } = storeToRefs(useAuthStore());

  const currency = computed(() => {
    const code = store.unloginedCurrency.title;
    const { rate } =
      store.currencies.find(
        (el) => el.to.title === code && el.from.id === store.defaultCurrency.id
      ) ?? {};

    const { rate: reverseRate } = store.currencies.find(
      (el) => el.from.title === code && el.to.id === store.defaultCurrency.id
    ) ?? { rate: 1 };

    const { title, precision } =
      userdata.value.currency ?? store.defaultCurrency;

    if (!isLogged.value)
      return { rate: rate || 1 / reverseRate, code, precision: precision || 0 };
    return { rate: 1, code: title.split("_").at(0), precision: precision || 0 };
  });

  return {
    currency,
    formatPrice: (price) => {
      return +(+price * currency.value.rate).toFixed(currency.value.precision);
    },
  };
}

export default useCurrency;
