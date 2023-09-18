import axios from 'axios'
import { useAppStore } from '@/stores/app.js'
import config from '@/appconfig.js'

const axiosConfig = {
  baseURL: config.WHMCSsiteurl + config.appFolder
}

const ax = axios.create(axiosConfig)

ax.interceptors.response.use((response) => {
  if (response.data.maintenance) {
    const appStore = useAppStore()

    console.log(response, 'maintanance mode')
    appStore.isMaintananceMode = response.data.maintenance
  }

  return response
}, error => {
  return Promise.reject(error)
})
export default ax
