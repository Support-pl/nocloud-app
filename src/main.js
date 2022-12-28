import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import VueGoogleCharts from 'vue-google-charts'
import i18n from './i18n'
import store from './store'
import router from './router'
import './registerServiceWorker'
import axios from './axios'
import config from './appconfig'
import api from "@/api.js"
import './assets/style.css'


import maintanance from '@/components/maintanance.vue'

Vue.config.productionTip = false
Vue.use(Antd)
Vue.use(VueGoogleCharts)


Vue.prototype.$config = config;
Vue.prototype.$axios = axios;
Vue.prototype.$api = api;

Vue.filter('capitalize', function (value) {
  if (!value) return ''
  value = value.toString()
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
  return   new Intl.DateTimeFormat().format(new Date(value))
})

Vue.directive('phone', {
  componentUpdated(el) {
    if (!event.isTrusted) return

    const x = el.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,4})/)

    if (!x[2] && x[1] !== '') {
      el.value = x[1] === '8' ? x[1] : '8' + x[1]
    } else {
      el.value = !x[3] ? x[1] + x[2] : x[1] + '(' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '')
    }
  }
})

Vue.component('maintanance-mode', maintanance);

new Vue({
  i18n,
	router,
	store,
  render: h => h(App)
}).$mount('#app')