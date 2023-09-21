import Vue from 'vue'
import Antd from 'ant-design-vue'
import { PiniaVuePlugin, createPinia } from 'pinia'
import VueGoogleCharts from 'vue-google-charts'
import App from './App.vue'
import 'ant-design-vue/dist/antd.css'
import i18n from './i18n'
import store from './store'
import router from './router'
import './registerServiceWorker'
import axios from './axios'
import api from '@/api.js'
import './assets/style.css'

import maintanance from '@/components/maintanance.vue'

Vue.config.productionTip = false
Vue.use(Antd)
Vue.use(VueGoogleCharts)
Vue.use(PiniaVuePlugin)

Vue.prototype.$axios = axios
Vue.prototype.$api = api

Vue.filter('capitalize', function (value, isLower) {
  if (!value) return ''
  value = value.toString()

  if (isLower) value = value.toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

Vue.filter('replace', function (value, from, to) {
  if (!value) return ''
  value = value.toString()
  return value.replace(from, to)
})

Vue.filter('dateFormat', function (value) {
  if (!value) return ''
  // return   new Intl.DateTimeFormat("en-GB", {
  //   dateStyle: "short",
  // }).format(new Date(value))
  return new Intl.DateTimeFormat().format(new Date(value))
})

Vue.directive('phone', {
  update (el, { value: code }) {
    if (!event?.isTrusted) return
    el.value = el.value.replace(code, '')

    const value = el.value.replace(/\D/g, '')
    const num = (value.length > 8) ? value.length - 7 : 1
    const regexp = new RegExp(`(\\d{0,${num}})(\\d{0,3})(\\d{0,2})(\\d{0,2})`)
    const x = value.match(regexp)

    if (x[1] === '') el.value = ''
    else if (x[2] === '') el.value = `${x[1]}`
    else if (x[3] === '') el.value = `${x[1]} ${x[2]}`
    else if (x[4] === '') el.value = `${x[1]} ${x[2]}-${x[3]}`
    else el.value = `${x[1]} ${x[2]}-${x[3]}-${x[4]}`

    if (code) el.value = `${code} ${el.value}`
  }
})

Vue.component('MaintananceMode', maintanance)

const pinia = createPinia()

new Vue({
  i18n,
  router,
  store,
  pinia,
  render: h => h(App)
}).$mount('#app')
