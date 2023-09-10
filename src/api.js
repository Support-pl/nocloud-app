import Api from 'nocloudjsrest';
import vuex from '@/store/index.js'

// const api = new Api();
const api = new Api(VUE_APP_BASE_URL);

api.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response && (
        [7].includes(error.response?.data?.code) ||
        error.response?.data.message === 'Token is expired'
      )
    ) {
      console.log('credentials are not actual');
      vuex.dispatch("nocloud/auth/logout")
    }
    return Promise.reject(error) // this is the important part
  })

export default api;
