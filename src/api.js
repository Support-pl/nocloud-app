import Api from "nocloudjsrest";
import vuex from "@/store/index.js";

console.log(VUE_APP_BASE_URL);

const api = new Api("https://api." + VUE_APP_BASE_URL + "/api");

api.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response?.data?.code === 7) {
      console.log("credentials are not actual");
      vuex.dispatch("nocloud/auth/logout");
    }
    return Promise.reject(error); // this is the important part
  }
);

export default api;
