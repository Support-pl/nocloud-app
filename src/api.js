import Api from 'nocloudjsrest'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

// const api = new Api()
const api = new Api(VUE_APP_BASE_URL)

api.axios.interceptors.response.use(
  (response) => {
    if (response.data?.maintenance) {
      console.log(response, 'maintanance mode')
      useAppStore().isMaintananceMode = response.data.maintenance
    }

    return response
  },
  (error) => {
    if (
      error.response && (
        [7, 16].includes(error.response?.data?.code) ||
        error.response?.data.message === 'Token is expired'
      )
    ) {
      console.log('credentials are not actual')
      useAuthStore().logout()
    }

    return Promise.reject(error) // this is the important part
  })

export default api
