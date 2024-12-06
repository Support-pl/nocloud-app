import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useCurrenciesStore } from "@/stores/currencies.js";
import { Rounding } from "nocloud-proto/proto/es/billing/billing_pb.js";

function useCurrency() {
  const { currencies, defaultCurrency, userCurrency } = storeToRefs(
    useCurrenciesStore()
  );

  const currency = computed(() => {
    const { id, code, title, precision, rounding } = userCurrency.value || {};
    const { rate } =
      currencies.value.find(
        (el) => el.to.id === id && el.from.id === defaultCurrency.value.id
      ) ?? {};

    return {
      rate: rate,
      title,
      code,
      rounding,
      precision: precision || 0,
    };
  });

  return {
    currency,
    formatPrice: (price) => {
      price = +price || 0;
      const precision = currency.value.precision || 0;
      const rounding = currency.value.rounding || "ROUND_HALF";

      if (price == 0) {
        return 0;
      }

      if (price < 0.01 && price > -1) {
        return price;
      }

      if (Rounding.ROUND_HALF === Rounding[rounding]) {
        return +price.toFixed(precision).toString();
      }

      const fn =
        Rounding[rounding] === Rounding.ROUND_DOWN ? Math.floor : Math.round;

      return fn(price * Math.pow(10, precision)) / Math.pow(10, precision);
    },
  };
}

export default useCurrency;
