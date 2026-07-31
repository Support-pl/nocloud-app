import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import { createPinia } from 'pinia'
import VueGoogleCharts from 'vue-google-charts'

import 'ant-design-vue/dist/reset.css'
import './assets/style.css'
import './registerServiceWorker'

import App from '@/App.vue'
import i18n from '@/i18n'
import router from '@/router'
import api from '@/api.js'
import appconfig from '@/appconfig.js'
import { registerGtagTargets, initGtag } from '@/gtag.js'

import maintanance from '@/components/ui/maintanance.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(Antd)
  .use(VueGoogleCharts)
  .use(i18n)
  .use(router)
  .use(pinia)

registerGtagTargets(app, router)

// Google Analytics stays off until the visitor consents (or the cookie banner
// is disabled via config) — see consentBanner.vue for the ACCEPT/DECLINE flow.
const consentDecision = localStorage.getItem('consent_decision')
if (!appconfig.cookieConsentEnabled || consentDecision === 'ACCEPT') {
  initGtag()
}

app.config.globalProperties.$api = api

app.config.globalProperties.capitalize = (value, isLower) => {
  if (!value) return ''
  value = value.toString()

  if (isLower) value = value.toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

app.config.globalProperties.dateFormat = (value,withTime=false) => {
  if (!value) return ''
  // return   new Intl.DateTimeFormat("en-GB", {
  //   dateStyle: "short",
  // }).format(new Date(value))
  if (withTime) {
    return new Date(value).toLocaleString();
  }
  return new Intl.DateTimeFormat().format(new Date(value))
}

app.component('MaintananceMode', maintanance)
app.mount('#app')
