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

app.directive('phone', {
  updated (el, { value: code, modifiers }) {
    const start = el.selectionStart
    const { length } = el.value

    el.value = el.value.replace(code, '')
    if (code?.startsWith(el.value)) el.value = ''

    const value = el.value.replace(/\D/g, '')
    const num = (value.length > 8) ? value.length - 7 : 1
    const regexp = new RegExp(`(\\d{0,${num}})(\\d{0,3})(\\d{0,2})(\\d{0,2})`)
    const x = value.match(regexp)

    if (x[1] === '') el.value = ''
    else if (x[2] === '') el.value = `${x[1]}`
    else if (x[3] === '') el.value = `${x[1]} ${x[2]}`
    else if (x[4] === '') el.value = `${x[1]} ${x[2]}-${x[3]}`
    else el.value = `${x[1]} ${x[2]}-${x[3]}-${x[4]}`

    if (code && !modifiers.hidden) {
      el.value = `${code} ${el.value}`
    } else {
      el.value = el.value.replace(`${code} `, '')
    }
    const currentStart = el.selectionStart

    el.selectionStart = currentStart - length + start
    el.selectionEnd = currentStart - length + start
  }
})

app.component('MaintananceMode', maintanance)
app.mount('#app')
