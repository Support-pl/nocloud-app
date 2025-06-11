import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import { createPinia } from 'pinia'
import VueGoogleCharts from 'vue-google-charts'
import VueGtag from 'vue-gtag'

import 'ant-design-vue/dist/reset.css'
import './assets/style.css'
import './registerServiceWorker'

import App from '@/App.vue'
import i18n from '@/i18n'
import router from '@/router'
import api from '@/api.js'

import maintanance from '@/components/ui/maintanance.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(Antd)
  .use(VueGtag, { config: { id: VUE_APP_GA_ID } }, router)
  .use(VueGoogleCharts)
  .use(i18n)
  .use(router)
  .use(pinia)

app.config.globalProperties.$api = api

app.config.globalProperties.capitalize = (value, isLower) => {
  if (!value) return ''
  value = value.toString()

  if (isLower) value = value.toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

app.config.globalProperties.dateFormat = (value) => {
  if (!value) return ''
  // return   new Intl.DateTimeFormat("en-GB", {
  //   dateStyle: "short",
  // }).format(new Date(value))
  return new Intl.DateTimeFormat().format(new Date(value))
}

app.component('MaintananceMode', maintanance)
app.mount('#app')
