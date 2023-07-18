import Api from 'nocloudjsrest'
import vuex from '@/app/store'

// const api = new Api()
const api = new Api(VUE_APP_BASE_URL)

api.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response?.data?.code === 7) {
      console.log('credentials are not actual')
      vuex.dispatch('nocloud/auth/logout')
    }
    return Promise.reject(error) // this is the important part
  })

export default api
