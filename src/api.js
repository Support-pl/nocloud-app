import Api from "nocloudjsrest";
import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useCurrenciesStore } from "./stores/currencies.js";

// const api = new Api()
const api = new Api(VUE_APP_BASE_URL);

export function addApiInterceptors() {
  api.axios.interceptors.response.use(
    (response) => {
      if (response.data?.maintenance) {
        console.log(response, "maintanance mode");
        useAppStore().isMaintananceMode = response.data.maintenance;
      }

      return response;
    },
    (error) => {
      if (
        error.response &&
        ([7, 16].includes(error.response?.data?.code) ||
          error.response?.data.message === "Token is expired")
      ) {
        console.log("credentials are not actual");
        useAuthStore().logout();
      }

      return Promise.reject(error); // this is the important part
    }
  );

  api.axios.interceptors.request.use((request) => {
    const store = useCurrenciesStore();

    console.log(store.userCurrency?.code);

    if (store.userCurrency?.code) {
      request.headers["grpc-metadata-nocloud-primary-currency-code"] =
        store.userCurrency.code;
    }

    return request;
  });
}

addApiInterceptors();

export default api;
